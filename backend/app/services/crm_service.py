# backend/app/services/crm_service.py
"""سرویس CRM سالن (brief §4) — محاسبه ردیف مشتری از داده‌های مشتق.

هیچ شمارنده‌ای کش نمی‌شود: bookings_count/spend/last_visit از رزرو و دفتر کل
حساب می‌شوند؛ VenueCustomer فقط پرچم‌های انسانی (VIP، برچسب، یادداشت، consent)
را نگه می‌دارد. segment:
    vip       ← is_vip
    dormant   ← ≥۹۰ روز بی‌فعالیتی
    at_risk   ← ≥۴۵ روز
    new       ← <۳ رزرو و آشنایی <۳۰ روز
    regular   ← بقیه
»غنی‌سازی مبلغ پرداختی رزروها برای reception حذف نشد (suppress نکردن — مستند:
دریافت payment_amount برای نقش‌های بدون finance.view در پاسخ رزرو حفظ می‌شود؛
 suppression侵入vasive بود و تصمیم: SKIP.)
"""
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional

from sqlalchemy import func as sa_func, or_
from sqlmodel import Session, col, select

from app.models.booking import Booking, BookingStatus
from app.models.customer import VenueCustomer
from app.models.loyalty import LoyaltyPoint
from app.models.slot import Slot
from app.models.transaction import (
    FinancialTransaction, TransactionDirection, TransactionStatus, TransactionType,
)
from app.models.user import User
from app.repositories.staff_repository import StaffAssignmentRepository  # noqa: F401
from app.unit_of_work import UnitOfWork

AT_RISK_DAYS = 45
DORMANT_DAYS = 90
NEW_WINDOW_DAYS = 30
NEW_MAX_BOOKINGS = 3


def _as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def days_since(dt: Optional[datetime]) -> Optional[int]:
    dt = _as_utc(dt)
    if dt is None:
        return None
    return max(0, (datetime.now(timezone.utc) - dt).days)


def segment_for(row: dict) -> str:
    if row["is_vip"]:
        return "vip"
    inactive = row["inactive_days"]
    if inactive is None:
        inactive = 9999
    if inactive >= DORMANT_DAYS:
        return "dormant"
    if inactive >= AT_RISK_DAYS:
        return "at_risk"
    first_age = row.get("customer_since_days")
    if (row["bookings_count"] < NEW_MAX_BOOKINGS
            and first_age is not None and first_age < NEW_WINDOW_DAYS):
        return "new"
    return "regular"


def loyalty_balances_for(uow: UnitOfWork, user_ids: List[int]) -> Dict[int, int]:
    """موجودی وفاداری (=SUM(points)) برای گروه کاربری — تک‌کوئری، بدون N+1."""
    if not user_ids:
        return {}
    stmt = (
        select(LoyaltyPoint.user_id,
               sa_func.coalesce(sa_func.sum(LoyaltyPoint.points), 0))
        .where(col(LoyaltyPoint.user_id).in_(list(user_ids)))
        .group_by(LoyaltyPoint.user_id)
    )
    return {int(uid): int(total or 0) for uid, total in uow.session.exec(stmt).all()}


def compute_customer_rows(uow: UnitOfWork, venue_id: int) -> List[dict]:
    """ردیف کامل مشتری‌های یک سالن (ساده — اندازه سالن کوچک فرض؛ مستند)."""
    bstats: Dict[int, dict] = {}
    stmt = (
        select(Booking.user_id,
               sa_func.count().label("cnt"),
               sa_func.min(Booking.booked_at).label("first_at"),
               sa_func.max(Slot.slot_date).label("last_visit"))
        .join(Slot, col(Booking.slot_id) == col(Slot.id))
        .where(Slot.venue_id == venue_id, Booking.status != BookingStatus.CANCELLED)
        .group_by(Booking.user_id)
    )
    for user_id, cnt, first_at, last_visit in uow.session.exec(stmt).all():
        bstats[int(user_id)] = {"bookings_count": int(cnt),
                                "first_at": _as_utc(first_at),
                                "last_visit": last_visit}

    spend: Dict[int, int] = {}
    sstmt = (
        select(FinancialTransaction.counterparty,
               sa_func.coalesce(sa_func.sum(FinancialTransaction.amount), 0))
        .where(FinancialTransaction.venue_id == venue_id,
               FinancialTransaction.direction == TransactionDirection.INCOME,
               FinancialTransaction.status != TransactionStatus.VOIDED,
               col(FinancialTransaction.type).in_(
                   [TransactionType.PAYMENT, TransactionType.CREDIT]),
               FinancialTransaction.counterparty.is_not(None))
        .group_by(FinancialTransaction.counterparty)
    )
    for uid, total in uow.session.exec(sstmt).all():
        spend[int(uid)] = int(total or 0)

    balances = uow.transactions.person_balances(venue_ids=[venue_id])
    vcs = {v.user_id: v for v in uow.customers.list_by_venue(venue_id)}

    user_ids = set(bstats) | set(spend) | set(vcs.keys())
    if not user_ids:
        return []
    users = {u.id: u for u in uow.session.exec(
        select(User).where(col(User.id).in_(list(user_ids)))).all()}
    loyalty = loyalty_balances_for(uow, list(user_ids))

    rows: List[dict] = []
    for uid in sorted(user_ids):
        user = users.get(uid)
        if user is None:
            continue
        b = bstats.get(uid, {})
        vc = vcs.get(uid)
        last_visit: Optional[date] = b.get("last_visit")
        first_candidates = [x for x in (b.get("first_at"),
                                        _as_utc(vc.created_at) if vc else None) if x]
        first_seen = min(first_candidates) if first_candidates else None
        inact_ref = last_visit or (first_seen.date() if first_seen else None)
        tags = [t.strip() for t in (vc.tags.split(",") if vc and vc.tags else [])
                if t.strip()]
        rows.append({
            "user_id": uid,
            "full_name": user.full_name,
            "phone": user.phone,
            "bookings_count": b.get("bookings_count", 0),
            "total_spend": spend.get(uid, 0),
            "balance_due": balances.get(uid, {}).get("balance", 0),
            "loyalty_balance": loyalty.get(uid, 0),
            "last_booking_date": last_visit,
            "first_seen": first_seen,
            "customer_since_days": days_since(first_seen),
            "is_vip": bool(vc.is_vip) if vc else False,
            "tags": tags,
            "notes": vc.notes if vc else None,
            "marketing_consent": bool(vc.marketing_consent) if vc else False,
            "inactive_days": days_since(
                datetime.combine(inact_ref, datetime.min.time()).replace(
                    tzinfo=timezone.utc)) if inact_ref else None,
        })
        rows[-1]["segment"] = segment_for(rows[-1])
    return rows


_FILTER_STATUS_ACTIVE = "active"


def filter_rows(rows: List[dict], search: Optional[str] = None,
                is_vip: Optional[bool] = None, tag: Optional[str] = None,
                status: str = "all", segment: Optional[str] = None) -> List[dict]:
    out = rows
    if search:
        q = search.strip().lower()
        out = [r for r in out
               if q in (r["full_name"] or "").lower() or q in (r["phone"] or "")]
    if is_vip is not None:
        out = [r for r in out if r["is_vip"] == is_vip]
    if tag:
        tl = tag.strip().lower()
        out = [r for r in out if any(tl == t.lower() for t in r["tags"])]
    if segment:
        out = [r for r in out if r["segment"] == segment]
    if status == _FILTER_STATUS_ACTIVE:
        out = [r for r in out if (r["inactive_days"] is not None
                                  and r["inactive_days"] < AT_RISK_DAYS)]
    elif status == "inactive":
        out = [r for r in out if (r["inactive_days"] is None
                                  or r["inactive_days"] >= AT_RISK_DAYS)]
    return out


def sort_rows(rows: List[dict], sort: str) -> List[dict]:
    if sort == "spend":
        return sorted(rows, key=lambda r: -r["total_spend"])
    if sort == "bookings":
        return sorted(rows, key=lambda r: -r["bookings_count"])
    return sorted(rows, key=lambda r: (r["last_booking_date"] is None,
                                       r["last_booking_date"]), reverse=True)


def stats_for(rows: List[dict]) -> dict:
    by_seg: Dict[str, int] = {}
    for r in rows:
        by_seg[r["segment"]] = by_seg.get(r["segment"], 0) + 1
    inactive = [r for r in rows
                if r["inactive_days"] is not None and r["inactive_days"] >= AT_RISK_DAYS]
    top = sorted(rows, key=lambda r: -r["total_spend"])[:5]
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_new = [r for r in rows if r["first_seen"] and r["first_seen"] >= week_ago]
    return {
        "total_customers": len(rows),
        "segments": by_seg,
        "inactive_count": len(inactive),
        "top_spenders": [{"user_id": r["user_id"], "full_name": r["full_name"],
                          "total_spend": r["total_spend"]} for r in top],
        "recent_new_customers": [{"user_id": r["user_id"], "full_name": r["full_name"],
                                  "first_seen": r["first_seen"].isoformat() if r["first_seen"] else None}
                                 for r in recent_new],
    }