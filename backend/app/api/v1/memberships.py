# backend/app/api/v1/memberships.py
"""اشتراک باشگاه‌های بدنسازی (بدون سانس): پلن‌های جلسه‌ای/پک/ماهانه + خرید و پرداخت."""
import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.database import get_session
from app.models.membership import (
    MembershipPlan,
    MembershipPurchase,
    PlanType,
    PurchaseStatus,
)
from app.models.user import User
from app.models.venue import Venue
from app.schemas.membership import (
    MembershipPayRequest,
    MembershipPlanCreate,
    MembershipPlanResponse,
    MembershipPlanUpdate,
    MembershipPurchaseCreate,
    MembershipPurchaseResponse,
)
from app.utils.auth import get_current_manager, get_current_user

router = APIRouter(prefix="/memberships", tags=["Memberships"])


def _normalize_digits(value: str) -> str:
    return "".join(
        ch for ch in value
        if ch.isdigit() or "۰" <= ch <= "۹" or "٠" <= ch <= "٩"
    ).translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789"))


def _plan_response(p: MembershipPlan) -> MembershipPlanResponse:
    return MembershipPlanResponse.model_validate(p)


def _purchase_response(
    s: Session, p: MembershipPurchase
) -> MembershipPurchaseResponse:
    plan = s.get(MembershipPlan, p.plan_id)
    venue = s.get(Venue, p.venue_id)
    return MembershipPurchaseResponse(
        id=p.id,
        plan_id=p.plan_id,
        user_id=p.user_id,
        venue_id=p.venue_id,
        plan_title=plan.title if plan else None,
        plan_type=plan.plan_type.value if plan and hasattr(plan.plan_type, "value") else (plan.plan_type if plan else None),
        venue_name=venue.name if venue else None,
        amount=p.amount,
        status=p.status.value if hasattr(p.status, "value") else str(p.status),
        transaction_id=p.transaction_id,
        card_pan=p.card_pan,
        sessions_remaining=p.sessions_remaining,
        starts_at=p.starts_at,
        expires_at=p.expires_at,
        created_at=p.created_at,
        paid_at=p.paid_at,
    )


def _get_plan_or_404(s: Session, plan_id: int) -> MembershipPlan:
    plan = s.get(MembershipPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="پلن یافت نشد")
    return plan


def _ensure_venue_manager(s: Session, venue_id: int, user: User) -> Venue:
    venue = s.get(Venue, venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="سالن یافت نشد")
    if venue.manager_id != user.id and user.role != "super_admin":
        raise HTTPException(status_code=403, detail="فقط مدیر این سالن مجاز است")
    return venue


# ---------- Plans ----------

@router.get("/plans", response_model=List[MembershipPlanResponse])
def list_plans(
    venue_id: Optional[int] = Query(None),
    include_inactive: bool = Query(False),
    session: Session = Depends(get_session),
):
    """لیست پلن‌های اشتراک (عمومی — فقط فعال‌ها مگر مدیر)"""
    stmt = select(MembershipPlan)
    if venue_id is not None:
        stmt = stmt.where(MembershipPlan.venue_id == venue_id)
    if not include_inactive:
        stmt = stmt.where(MembershipPlan.is_active == True)  # noqa: E712
    plans = session.exec(stmt.order_by(MembershipPlan.price)).all()
    return [_plan_response(p) for p in plans]


@router.post("/plans", response_model=MembershipPlanResponse, status_code=201)
def create_plan(
    data: MembershipPlanCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_manager),
):
    """ایجاد پلن اشتراک برای سالن — فقط مدیر سالن"""
    _ensure_venue_manager(session, data.venue_id, current_user)

    plan_type = PlanType(data.plan_type)
    if plan_type == PlanType.SESSIONS_PACK and not data.sessions_count:
        raise HTTPException(status_code=400, detail="برای پک جلسه‌ای، sessions_count الزامی است")
    if plan_type == PlanType.MONTHLY and not data.duration_days:
        raise HTTPException(status_code=400, detail="برای پلن ماهانه، duration_days الزامی است")

    plan = MembershipPlan(
        venue_id=data.venue_id,
        title=data.title,
        plan_type=plan_type,
        price=data.price,
        sessions_count=data.sessions_count,
        duration_days=data.duration_days,
        description=data.description,
    )
    session.add(plan)
    session.commit()
    session.refresh(plan)
    return _plan_response(plan)


@router.put("/plans/{plan_id}", response_model=MembershipPlanResponse)
def update_plan(
    plan_id: int,
    data: MembershipPlanUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_manager),
):
    plan = _get_plan_or_404(session, plan_id)
    _ensure_venue_manager(session, plan.venue_id, current_user)
    updates = data.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(plan, k, v)
    session.add(plan)
    session.commit()
    session.refresh(plan)
    return _plan_response(plan)


@router.delete("/plans/{plan_id}")
def deactivate_plan(
    plan_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_manager),
):
    """غیرفعال کردن پلن (حذف نرم)"""
    plan = _get_plan_or_404(session, plan_id)
    _ensure_venue_manager(session, plan.venue_id, current_user)
    plan.is_active = False
    session.add(plan)
    session.commit()
    return {"message": "پلن غیرفعال شد"}


# ---------- Purchases ----------

@router.post("/purchases", response_model=MembershipPurchaseResponse, status_code=201)
def create_purchase(
    data: MembershipPurchaseCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """ایجاد فاکتور خرید اشتراک (در انتظار پرداخت)"""
    plan = _get_plan_or_404(session, data.plan_id)
    if not plan.is_active:
        raise HTTPException(status_code=400, detail="این پلن غیرفعال است")

    purchase = MembershipPurchase(
        plan_id=plan.id,
        user_id=current_user.id,
        venue_id=plan.venue_id,
        amount=plan.price,
        status=PurchaseStatus.PENDING,
    )
    session.add(purchase)
    session.commit()
    session.refresh(purchase)
    return _purchase_response(session, purchase)


@router.post("/purchases/{purchase_id}/pay", response_model=MembershipPurchaseResponse)
def pay_purchase(
    purchase_id: int,
    data: MembershipPayRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """شبیه‌سازی پرداخت خرید اشتراک — پس از موفقیت فعال‌سازی می‌شود"""
    purchase = session.get(MembershipPurchase, purchase_id)
    if not purchase:
        raise HTTPException(status_code=404, detail="فاکتور یافت نشد")
    if purchase.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="این فاکتور متعلق به شما نیست")
    if purchase.status == PurchaseStatus.PAID:
        raise HTTPException(status_code=400, detail="این فاکتور قبلاً پرداخت شده است")

    card = _normalize_digits(data.card_number)
    if len(card) != 16 or not card.isdigit():
        purchase.status = PurchaseStatus.CANCELLED
        session.add(purchase)
        session.commit()
        raise HTTPException(status_code=400, detail="شماره کارت نامعتبر است (۱۶ رقم)")

    plan = _get_plan_or_404(session, purchase.plan_id)
    now = datetime.now(timezone.utc)
    purchase.status = PurchaseStatus.PAID
    purchase.transaction_id = secrets.token_hex(8).upper()
    purchase.card_pan = card[-4:]
    purchase.paid_at = now
    purchase.starts_at = now
    if plan.plan_type in (PlanType.SESSION, PlanType.SESSIONS_PACK):
        purchase.sessions_remaining = plan.sessions_count or 1
    elif plan.plan_type == PlanType.MONTHLY:
        purchase.expires_at = now + timedelta(days=plan.duration_days or 30)
    session.add(purchase)
    session.commit()
    session.refresh(purchase)
    return _purchase_response(session, purchase)


@router.get("/my", response_model=List[MembershipPurchaseResponse])
def my_purchases(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """اشتراک‌های کاربر جاری"""
    stmt = (
        select(MembershipPurchase)
        .where(MembershipPurchase.user_id == current_user.id)
        .order_by(MembershipPurchase.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return [_purchase_response(session, p) for p in session.exec(stmt).all()]


@router.post("/purchases/{purchase_id}/consume", response_model=MembershipPurchaseResponse)
def consume_session(
    purchase_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_manager),
):
    """کسر یک جلسه از اشتراک (توسط مدیر سالن هنگام ورود کاربر)"""
    purchase = session.get(MembershipPurchase, purchase_id)
    if not purchase:
        raise HTTPException(status_code=404, detail="اشتراک یافت نشد")
    _ensure_venue_manager(session, purchase.venue_id, current_user)
    if purchase.status != PurchaseStatus.PAID:
        raise HTTPException(status_code=400, detail="این اشتراک پرداخت نشده است")
    if purchase.sessions_remaining is None:
        raise HTTPException(status_code=400, detail="این اشتراک جلسه‌ای نیست (ماهانه است)")
    if purchase.expires_at and purchase.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="اعتبار اشتراک به پایان رسیده است")
    if purchase.sessions_remaining <= 0:
        raise HTTPException(status_code=400, detail="جلسات این اشتراک تمام شده است")
    purchase.sessions_remaining -= 1
    session.add(purchase)
    session.commit()
    session.refresh(purchase)
    return _purchase_response(session, purchase)


@router.get("/venue/{venue_id}/purchases", response_model=List[MembershipPurchaseResponse])
def venue_purchases(
    venue_id: int,
    limit: int = Query(100, ge=1, le=500),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_manager),
):
    """لیست خریدهای اشتراک یک سالن — برای مدیر سالن"""
    _ensure_venue_manager(session, venue_id, current_user)
    stmt = (
        select(MembershipPurchase)
        .where(MembershipPurchase.venue_id == venue_id)
        .order_by(MembershipPurchase.created_at.desc())
        .limit(limit)
    )
    return [_purchase_response(session, p) for p in session.exec(stmt).all()]
