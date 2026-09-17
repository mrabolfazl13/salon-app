# backend/app/api/v1/crm.py
"""CRM سالن (brief §4) — لیست مشتری/جزئیات/آمار + کمپین + consent.

دسترسی: خواندن با crm.view یا customer.view_basic (مالک/سرپرست pass-through).
نوشتن (VIP/notes/tags، کمپین) با crm.manage. کاربر عادیِ بدون venue_id ⇒ ۴۰۳
(دامنه‌ی کارکنan per-venue).

قوانین سخت‌گیرانه‌ی حریم خصوصی کمپین:
- فقط کاربران دارای VenueCustomer.marketing_consent=False→ ارسال صفر (consentمحورِ خالص).
- سقف روزانه هر سالن از settings.CRM_CAMPAIGN_DAILY_LIMIT (پیش‌فرض ۱).
- اعلان این‌اپ با نوع crm_campaign از طریق NotificationService.
"""
import json
from datetime import date, datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import col, select

from app.config import settings
from app.unit_of_work import UnitOfWork, get_unit_of_work
from app.models.booking import Booking, BookingStatus
from app.models.customer import CrmCampaign, VenueCustomer
from app.models.slot import Slot
from app.models.user import User, UserRole
from app.schemas.customer import CampaignCreate, ConsentUpdate, CrmCustomerUpdate
from app.services.crm_service import (
    compute_customer_rows, filter_rows, loyalty_balances_for, sort_rows, stats_for,
)

router = APIRouter(prefix="/crm", tags=["CRM"])

from app.utils.auth import get_current_user  # noqa: E402
from app.utils.permissions import Perm  # noqa: E402
from app.utils.staff_access import (  # noqa: E402
    ensure_venue_permission, log_security_event,
)
from app.services.finance_service import FinanceService  # noqa: E402
from app.services.notification_service import notification_service  # noqa: E402

READ_CODES = [Perm.CRM_VIEW, Perm.CUSTOMER_VIEW_BASIC]
MANAGE_CODES = [Perm.CRM_MANAGE]

SEGMENTS = {"new", "regular", "vip", "at_risk", "dormant"}


def _json_tags(tags: Optional[List[str]]) -> str:
    if not tags:
        return ""
    cleaned = [t.strip() for t in tags if t and t.strip()][:10]
    return ",".join(cleaned)


def _user_row(rows: List[dict], user_id: int) -> Optional[dict]:
    for r in rows:
        if r["user_id"] == user_id:
            return r
    return None


@router.get("/customers")
def list_customers(
    venue_id: int = Query(...),
    search: Optional[str] = Query(None, max_length=100),
    is_vip: Optional[bool] = Query(None),
    tag: Optional[str] = Query(None, max_length=50),
    segment: Optional[str] = Query(None),
    status: str = Query("all", pattern="^(active|inactive|all)$"),
    sort: str = Query("last_visit", pattern="^(spend|last_visit|bookings)$"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    request: Request = None,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """لیست مشتریان سالن با segment مشتق (مستند در crm_service)."""
    ensure_venue_permission(uow, current_user, venue_id, READ_CODES, request)
    if segment and segment not in SEGMENTS:
        raise HTTPException(status_code=400, detail="segment نامعتبر است")
    rows = compute_customer_rows(uow, venue_id)
    rows = filter_rows(rows, search=search, is_vip=is_vip, tag=tag,
                       status=status, segment=segment)
    rows = sort_rows(rows, sort)
    total = len(rows)
    return {"items": rows[offset:offset + limit], "total": total,
            "limit": limit, "offset": offset}


@router.get("/customers/{user_id}")
def get_customer(
    user_id: int,
    request: Request,
    venue_id: int = Query(...),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    ensure_venue_permission(uow, current_user, venue_id, READ_CODES, request)
    if not uow.users.get_by_id(user_id):
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    rows = compute_customer_rows(uow, venue_id)
    row = _user_row(rows, user_id)
    if row is None:  # بدون هیچ فعالیت/رکورد — حداقل اطلاعات کاربر
        u = uow.users.get_by_id(user_id)
        row = {"user_id": user_id, "full_name": u.full_name, "phone": u.phone,
               "bookings_count": 0, "total_spend": 0, "balance_due": 0,
               "loyalty_balance": loyalty_balances_for(uow, [user_id]).get(user_id, 0),
               "last_booking_date": None, "first_seen": None,
               "is_vip": False, "tags": [], "notes": None,
               "marketing_consent": False, "inactive_days": None,
               "segment": "regular"}
    recent_bookings = list(uow.session.exec(
        select(Booking, Slot)
        .join(Slot, col(Booking.slot_id) == col(Slot.id))
        .where(Slot.venue_id == venue_id, Booking.user_id == user_id,
               Booking.status != BookingStatus.CANCELLED)
        .order_by(col(Booking.booked_at).desc()).limit(10)).all())
    recent_payments, _n = uow.transactions.list_transactions(
        venue_ids=[venue_id], counterparty=user_id, limit=10)
    return {
        "customer": row,
        "recent_bookings": [{
            "id": b.id, "slot_id": b.slot_id, "slot_date": s.slot_date,
            "start_time": s.start_time, "status": b.status.value,
            "payment_amount": b.payment_amount, "booked_at": b.booked_at,
        } for b, s in recent_bookings],
        "recent_payments": FinanceService.transactions_to_response(
            uow, recent_payments),
        "statement": FinanceService.ledger_statement(uow, user_id, None, None,
                                                    [venue_id]),
        "venue_customer": (lambda vc: None if vc is None else {
            "is_vip": vc.is_vip, "tags": vc.tags, "notes": vc.notes,
            "marketing_consent": vc.marketing_consent,
        })(uow.customers.get_for(venue_id, user_id)),
    }


@router.put("/customers/{user_id}")
def update_customer(
    user_id: int,
    request: Request,
    data: CrmCustomerUpdate,
    venue_id: int = Query(...),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    ensure_venue_permission(uow, current_user, venue_id, MANAGE_CODES, request)
    user = uow.users.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    vc = uow.customers.get_for(venue_id, user_id)
    fields = {}
    if data.is_vip is not None:
        fields["is_vip"] = data.is_vip
    if data.tags is not None:
        fields["tags"] = _json_tags(data.tags)
    if data.notes is not None:
        fields["notes"] = data.notes[:2000]
    if vc is None:
        vc = uow.customers.create({
            "venue_id": venue_id, "user_id": user_id, "marked_by": current_user.id,
            **fields,
        })
    elif fields:
        vc = uow.customers.update(vc.id, dict(fields, marked_by=current_user.id))
    else:
        raise HTTPException(status_code=400, detail="تغییری ارسال نشده است")
    rows = compute_customer_rows(uow, venue_id)
    return _user_row(rows, user_id) or {}


@router.get("/stats")
def crm_stats(
    venue_id: int = Query(...),
    request: Request = None,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """تفکیک segment، بی‌فعال‌ها، پرسرف‌ترین‌ها، مشتری تازه (≤۷روز)."""
    ensure_venue_permission(uow, current_user, venue_id, READ_CODES, request)
    return stats_for(compute_customer_rows(uow, venue_id))


# ─────────────────────────── کمپین‌ها ───────────────────────────

@router.post("/campaigns", status_code=201)
async def create_campaign(
    data: CampaignCreate,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """کمپین پیامکیِ فقط-consent با سقف روزانه. ارسال = اعلان این‌اپ crm_campaign."""
    venue = ensure_venue_permission(uow, current_user, data.venue_id,
                                    MANAGE_CODES, request)
    if not data.segment and not data.customer_ids:
        raise HTTPException(status_code=400,
                            detail="segment یا customer_ids الزامی است")
    if data.segment and data.segment not in SEGMENTS:
        raise HTTPException(status_code=400, detail="segment نامعتبر است")
    # created_at در UTC ذخیره می‌شود؛ سقف «امروز» باید روز UTC باشد.
    already = uow.crm_campaigns.count_for_venue_on(
        venue.id, datetime.now(timezone.utc).date())
    if already >= settings.CRM_CAMPAIGN_DAILY_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"سقف کمپین امروز این سالن ({settings.CRM_CAMPAIGN_DAILY_LIMIT}) "
                   "تکمیل شده است")

    rows = compute_customer_rows(uow, venue.id)
    if data.segment:
        target_rows = [r for r in rows if r["segment"] == data.segment]
    else:
        wanted = set(data.customer_ids)
        target_rows = [r for r in rows if r["user_id"] in wanted]

    consented = [r for r in target_rows if r["marketing_consent"]]
    skipped = len(target_rows) - len(consented)
    message = data.message + (f" | کد تخفیف: {data.discount_code}"
                              if data.discount_code else "")
    campaign = uow.crm_campaigns.create({
        "venue_id": venue.id, "created_by": current_user.id,
        "title": data.title, "message": data.message,
        "discount_code": data.discount_code, "segment": data.segment,
        "customer_ids": json.dumps(
            [r["user_id"] for r in target_rows] if data.customer_ids else [],
            ensure_ascii=False),
        "sent_count": len(consented),
        "skipped_no_consent": skipped,
    })
    log_security_event(uow, "crm.campaign_sent", current_user.id,
                       target_type="crm_campaign", target_id=campaign.id,
                       venue_id=venue.id,
                       data={"sent": len(consented), "skipped": skipped,
                             "segment": data.segment}, request=request)
    uow.commit()
    for r in consented:
        await notification_service.send_to_user(
            r["user_id"], title=data.title[:200], message=message[:950],
            data={"venue_id": venue.id, "campaign_id": campaign.id,
                  "discount_code": data.discount_code},
            notif_type="crm_campaign",
        )
    return {"campaign_id": campaign.id, "sent_count": len(consented),
            "skipped_no_consent": skipped}


@router.get("/campaigns")
def list_campaigns(
    venue_id: int = Query(...),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    request: Request = None,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    ensure_venue_permission(uow, current_user, venue_id, READ_CODES, request)
    rows = uow.crm_campaigns.list_by_venue(venue_id, limit, offset)
    actor_ids = {r.created_by for r in rows if r.created_by}
    names = {}
    if actor_ids:
        names = {u.id: u.full_name for u in uow.session.exec(
            select(User).where(col(User.id).in_(list(actor_ids)))).all()}
    return {"items": [{
        "id": r.id, "title": r.title, "message": r.message,
        "segment": r.segment, "discount_code": r.discount_code,
        "sent_count": r.sent_count, "skipped_no_consent": r.skipped_no_consent,
        "created_by": r.created_by,
        "created_by_name": names.get(r.created_by),
        "created_at": r.created_at,
    } for r in rows], "total": len(rows)}


# ─────────────────────────── consent کاربر ───────────────────────────

@router.get("/consent")
def get_my_consents(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """خوانش خودسرویس رضایت‌ها — تاگل‌های پروفایل (فقط رکوردهای خودِ کاربر)."""
    rows = uow.customers.list_by_user(current_user.id)
    consented = sorted({vc.venue_id for vc in rows if vc.marketing_consent})
    return {"marketing_consent": bool(consented),
            "notify_deals": bool(current_user.notify_deals),
            "venues_with_consent": consented}


@router.put("/consent")
def set_marketing_consent(
    data: ConsentUpdate,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """self-service: رضایت بازاریابی per-venue یا روی همه رکوردهای کاربر."""
    ts = datetime.now(timezone.utc)
    if data.venue_id is not None:
        venue = uow.venues.get_by_id(data.venue_id)
        if not venue:
            raise HTTPException(status_code=404, detail="Venue not found")
        vc = uow.customers.get_for(data.venue_id, current_user.id)
        if vc is None:
            uow.customers.create({
                "venue_id": data.venue_id, "user_id": current_user.id,
                "marketing_consent": data.marketing_consent,
                "consent_updated_at": ts,
            })
        else:
            vc.marketing_consent = data.marketing_consent
            vc.consent_updated_at = ts
            vc.updated_at = ts
            uow.session.add(vc)
        uow.commit()
        return {"marketing_consent": data.marketing_consent, "updated": 1}
    rows = uow.customers.list_by_user(current_user.id)
    for vc in rows:
        vc.marketing_consent = data.marketing_consent
        vc.consent_updated_at = ts
        vc.updated_at = ts
        uow.session.add(vc)
    uow.commit()
    return {"marketing_consent": data.marketing_consent, "updated": len(rows)}