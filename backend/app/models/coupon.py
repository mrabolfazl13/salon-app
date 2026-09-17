# backend/app/models/coupon.py
"""کد تخفیف — اعتبارسنجی/اعمال در موتور قیمت سمت سرور.

- code به‌صورت یکپارچه upper-store می‌شود ⇒ یکتایی case-insensitive (unique).
- venue_id=null یعنی روی همه‌ی سالن‌ها؛ در غیر این صورت فقط همان سالن.
- استفاده با رزرو در لحظه‌ی ساخت رزرو معلق (pending) ثبت می‌شود و
  در لحظه‌ی تأیید به booking متصل می‌گردد؛ در لغو/رد آزاد می‌شود.
"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, timezone
from enum import Enum


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class CouponType(str, Enum):
    PERCENT = "percent"   # value = درصد×100
    FIXED = "fixed"       # value = ریال


class Coupon(SQLModel, table=True):
    __tablename__ = "coupons"

    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True, max_length=40)
    venue_id: Optional[int] = Field(default=None, foreign_key="venues.id", index=True)
    discount_type: CouponType = Field(default=CouponType.PERCENT)
    value: int = Field(description="percent×100 (مثبت) یا ریالِ تخفیف (مثبت)")
    max_uses: Optional[int] = Field(default=None)
    uses_count: int = Field(default=0)
    per_user_limit: Optional[int] = Field(default=1)
    min_booking_amount: Optional[int] = Field(default=None)
    valid_from: Optional[datetime] = Field(default=None)
    valid_until: Optional[datetime] = Field(default=None)
    is_active: bool = Field(default=True, index=True)
    created_by: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class CouponRedemption(SQLModel, table=True):
    """ردیف مصرف کوپن — با booking_id=null یعنی رزرو معلقِ در انتظار تأیید."""
    __tablename__ = "coupon_redemptions"

    id: Optional[int] = Field(default=None, primary_key=True)
    coupon_id: int = Field(foreign_key="coupons.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    booking_id: Optional[int] = Field(default=None, foreign_key="bookings.id", index=True)
    amount_discounted: int = Field(default=0)
    created_at: datetime = Field(default_factory=_utcnow)