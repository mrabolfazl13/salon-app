# backend/app/api/v1/split_payments.py
"""Team split payment API — team-based contract (see src/services/splitPayment.ts)."""

import json
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func

from app.database import get_session
from app.models.split_payment import (
    TeamSplitPayment, SplitPaymentShare, SplitPaymentAuditEvent,
    SplitMethod, SplitPaymentStatus, ShareStatus,
)
from app.models.team import Team, TeamMember, TeamMemberStatus
from app.models.game import Game
from app.models.user import User
from app.utils.auth import get_current_user
from pydantic import BaseModel, Field


router = APIRouter(prefix="/split-payments", tags=["split-payments"])


# ─────────────────────────── Schemas ───────────────────────────

class CustomShareIn(BaseModel):
    user_id: int
    amount: int = Field(gt=0)


class PercentageShareIn(BaseModel):
    user_id: int
    percentage: float = Field(gt=0, le=100)


class SplitPaymentCreate(BaseModel):
    team_id: int
    game_id: Optional[int] = None
    booking_id: Optional[int] = None
    amount: int = Field(gt=0)
    currency: str = Field(default="IRR", max_length=10)
    method: SplitMethod = SplitMethod.EQUAL
    deadline: Optional[datetime] = None
    note: Optional[str] = Field(default=None, max_length=1000)
    custom_shares: Optional[List[CustomShareIn]] = None
    percentage_shares: Optional[List[PercentageShareIn]] = None


class PayShareIn(BaseModel):
    payment_method: Optional[str] = None
    transaction_ref: Optional[str] = None
    note: Optional[str] = Field(default=None, max_length=500)


# ─────────────────────────── Helpers ───────────────────────────

def _require_member(session: Session, team_id: Optional[int], user_id: int) -> TeamMember:
    if team_id is None:
        raise HTTPException(status_code=403, detail="این پرداخت اشتراکی به تیمی متصل نیست")
    member = session.exec(select(TeamMember).where(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_id,
        TeamMember.status == TeamMemberStatus.ACTIVE,
    )).first()
    if not member:
        raise HTTPException(status_code=403, detail="فقط اعضای تیم به پرداخت اشتراکی دسترسی دارند")
    return member


def _active_member_ids(session: Session, team_id: int) -> List[int]:
    rows = session.exec(select(TeamMember).where(
        TeamMember.team_id == team_id,
        TeamMember.status == TeamMemberStatus.ACTIVE,
    )).all()
    return [r.user_id for r in rows]


def _user_names(session: Session, payment_id: int) -> dict:
    rows = session.exec(
        select(SplitPaymentShare.user_id, User.full_name)
        .join(User, SplitPaymentShare.user_id == User.id)
        .where(SplitPaymentShare.split_payment_id == payment_id)
    ).all()
    return {uid: name for uid, name in rows}


def _serialize_share(share: SplitPaymentShare, user_name: Optional[str] = None) -> dict:
    return {
        "id": share.id,
        "split_payment_id": share.split_payment_id,
        "user_id": share.user_id,
        "amount": share.amount,
        "percentage": share.percentage,
        "status": share.status,
        "paid_at": share.paid_at,
        "created_at": share.created_at,
        "user_name": user_name,
    }


def _serialize_payment(sp: TeamSplitPayment, shares: Optional[List[dict]] = None) -> dict:
    data = {
        "id": sp.id,
        "team_id": sp.team_id,
        "game_id": sp.game_id,
        "booking_id": sp.booking_id,
        "amount": sp.amount,
        "currency": sp.currency,
        "method": sp.method,
        "status": sp.status,
        "deadline": sp.deadline,
        "created_by": sp.created_by,
        "created_at": sp.created_at,
        "updated_at": sp.updated_at,
        "note": sp.note,
    }
    if shares is not None:
        data["shares"] = shares
        data["total_paid"] = sp.paid_amount
        data["remaining"] = sp.remaining_amount
    return data


# ─────────────────────────── Endpoints ───────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_split_payment(
    data: SplitPaymentCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create a split payment among ACTIVE team members.

    EQUAL divides the amount equally; CUSTOM/PERCENTAGE require explicit
    share lists whose sums must match the total (422 otherwise).
    """
    team = session.get(Team, data.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="تیم یافت نشد")
    _require_member(session, data.team_id, current_user.id)

    if data.game_id is not None and not session.get(Game, data.game_id):
        raise HTTPException(status_code=404, detail="بازی یافت نشد")

    member_ids = _active_member_ids(session, data.team_id)
    if not member_ids:
        raise HTTPException(status_code=400, detail="تیم عضو فعالی ندارد")

    if data.deadline is not None and data.deadline <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="مهلت باید در آینده باشد")

    share_rows: List[dict] = []
    if data.method == SplitMethod.EQUAL:
        base = data.amount // len(member_ids)
        remainder = data.amount % len(member_ids)
        for i, uid in enumerate(member_ids):
            share_rows.append({
                "user_id": uid,
                "amount": base + (1 if i < remainder else 0),
                "percentage": None,
            })
    elif data.method == SplitMethod.CUSTOM:
        if not data.custom_shares:
            raise HTTPException(status_code=422, detail="برای تقسیم سفارشی، سهم‌ها لازم است")
        custom_total = sum(s.amount for s in data.custom_shares)
        if custom_total != data.amount:
            raise HTTPException(
                status_code=422,
                detail=f"مجموع سهم‌ها ({custom_total}) با مبلغ کل ({data.amount}) برابر نیست",
            )
        for s in data.custom_shares:
            if s.user_id not in member_ids:
                raise HTTPException(status_code=422, detail="سهم باید متعلق به عضو تیم باشد")
            share_rows.append({"user_id": s.user_id, "amount": s.amount, "percentage": None})
    else:  # PERCENTAGE
        if not data.percentage_shares:
            raise HTTPException(status_code=422, detail="برای تقسیم درصدی، درصد سهم‌ها لازم است")
        pct_total = sum(s.percentage for s in data.percentage_shares)
        if round(pct_total) != 100:
            raise HTTPException(
                status_code=422,
                detail=f"مجموع درصدها باید ۱۰۰ باشد (الان {pct_total:g})",
            )
        for s in data.percentage_shares:
            if s.user_id not in member_ids:
                raise HTTPException(status_code=422, detail="سهم باید متعلق به عضو تیم باشد")
            share_rows.append({
                "user_id": s.user_id,
                "amount": int(data.amount * s.percentage / 100),
                "percentage": s.percentage,
            })

    if len({r["user_id"] for r in share_rows}) != len(share_rows):
        raise HTTPException(status_code=422, detail="هر عضو فقط یک سهم می‌تواند داشته باشد")

    sp = TeamSplitPayment(
        team_id=data.team_id,
        game_id=data.game_id,
        booking_id=data.booking_id,
        created_by=current_user.id,
        amount=data.amount,
        currency=data.currency,
        method=data.method,
        deadline=data.deadline,
        note=data.note,
    )
    session.add(sp)
    session.flush()

    for r in share_rows:
        session.add(SplitPaymentShare(
            split_payment_id=sp.id,
            user_id=r["user_id"],
            amount=r["amount"],
            percentage=r["percentage"],
            status=ShareStatus.PENDING,
        ))
    session.add(SplitPaymentAuditEvent(
        split_payment_id=sp.id,
        user_id=current_user.id,
        performed_by=current_user.phone,
        action="CREATED",
        data=json.dumps(
            {"method": data.method.value, "amount": data.amount, "members": len(share_rows)},
            ensure_ascii=False,
        ),
    ))
    session.commit()
    session.refresh(sp)

    names = _user_names(session, sp.id)
    shares = session.exec(
        select(SplitPaymentShare)
        .where(SplitPaymentShare.split_payment_id == sp.id)
        .order_by(SplitPaymentShare.id)
    ).all()
    return _serialize_payment(sp, [_serialize_share(s, names.get(s.user_id)) for s in shares])


@router.get("/team/{team_id}")
async def list_team_split_payments(
    team_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List a team's split payments, newest first."""
    _require_member(session, team_id, current_user.id)

    total = session.exec(
        select(func.count()).select_from(TeamSplitPayment).where(TeamSplitPayment.team_id == team_id)
    ).one()
    payments = session.exec(
        select(TeamSplitPayment)
        .where(TeamSplitPayment.team_id == team_id)
        .order_by(TeamSplitPayment.created_at.desc(), TeamSplitPayment.id.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return {"items": [_serialize_payment(p) for p in payments], "total": total}


@router.get("/{payment_id}")
async def get_split_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get split payment details with all shares (team members only)."""
    sp = session.get(TeamSplitPayment, payment_id)
    if not sp:
        raise HTTPException(status_code=404, detail="پرداخت اشتراکی یافت نشد")

    if sp.team_id is not None:
        _require_member(session, sp.team_id, current_user.id)
    elif sp.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="فقط اعضای تیم به پرداخت اشتراکی دسترسی دارند")

    names = _user_names(session, sp.id)
    shares = session.exec(
        select(SplitPaymentShare)
        .where(SplitPaymentShare.split_payment_id == sp.id)
        .order_by(SplitPaymentShare.id)
    ).all()
    return _serialize_payment(sp, [_serialize_share(s, names.get(s.user_id)) for s in shares])


@router.post("/{payment_id}/shares/{share_id}/pay")
async def pay_share(
    payment_id: int,
    share_id: int,
    payload: Optional[PayShareIn] = Body(default=None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Mark the current user's share as paid."""
    sp = session.get(TeamSplitPayment, payment_id)
    if not sp:
        raise HTTPException(status_code=404, detail="پرداخت اشتراکی یافت نشد")

    share = session.get(SplitPaymentShare, share_id)
    if not share or share.split_payment_id != payment_id:
        raise HTTPException(status_code=404, detail="سهم یافت نشد")

    if share.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="فقط سهم خودتان را می‌توانید بپردازید")

    if share.status == ShareStatus.PAID:
        raise HTTPException(status_code=400, detail="این سهم قبلاً پرداخت شده است")

    share.status = ShareStatus.PAID
    share.paid_at = datetime.now(timezone.utc)
    if payload and payload.note:
        share.note = payload.note

    sp.paid_amount += share.amount
    sp.updated_at = datetime.now(timezone.utc)

    all_shares = session.exec(
        select(SplitPaymentShare).where(SplitPaymentShare.split_payment_id == payment_id)
    ).all()
    if all(s.status == ShareStatus.PAID for s in all_shares):
        sp.status = SplitPaymentStatus.COMPLETED
    elif any(s.status == ShareStatus.PAID for s in all_shares):
        sp.status = SplitPaymentStatus.PARTIAL

    session.add(SplitPaymentAuditEvent(
        split_payment_id=payment_id,
        user_id=current_user.id,
        performed_by=current_user.phone,
        action="SHARE_PAID",
        data=json.dumps({"share_id": share.id, "amount": share.amount}, ensure_ascii=False),
    ))
    session.commit()
    session.refresh(share)
    session.refresh(sp)

    names = _user_names(session, sp.id)
    return _serialize_share(share, names.get(share.user_id))
