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


class RedemptionStatus(str, Enum):
    """وضعیتِ ردیفِ مصرف — تا راند ۲۷ لغو یعنی **حذفِ ردیف** (گرهٔ C22.1)."""
    ACTIVE = "ACTIVE"        # مصرفِ زنده (رزرو معلق یا تأییدشده)
    RELEASED = "RELEASED"    # لغو/رد شده؛ ردیف می‌ماند تا تاریخچه کامل بماند


class ReleaseVia(str, Enum):
    """از کدام مسیرِ کد آزاد شد — گرهٔ C24.3: «لغو شد» بدونِ «چه کسی از کدام دکمه».

    هفت مسیرِ واقعیِ ship‌شده (grep روی `release_by_id`/`release_pending_promotions`):
    ردِ مدیر، لغوِ خودِ کاربر از رزرو معلق، جاروبِ انقضا (بی‌عامل)، سه دفاعِ
    `confirm_pending` و لغوِ رزروِ قطعی. اسم‌ها در DB به‌صورت varchar ذخیره می‌شوند،
    نه native enum — ارزششان در *خواندنِ* تاریخچه است نه در شمارش.
    """
    PENDING_REJECTED = "PENDING_REJECTED"              # مدیر/کارکنان رزرو معلق را رد کرد
    PENDING_CANCELLED = "PENDING_CANCELLED"            # خودِ کاربر پیش از تأیید لغو کرد
    PENDING_EXPIRED = "PENDING_EXPIRED"                # جاروبِ تسک (actor = None)
    CONFIRM_SLOT_LOST = "CONFIRM_SLOT_LOST"            # سانس دیگر نگه داشته نشده بود
    CONFIRM_ALREADY_BOOKED = "CONFIRM_ALREADY_BOOKED"  # روی آن سانس رزرو قطعی هست
    CONFIRM_CONTRACT_SLOT = "CONFIRM_CONTRACT_SLOT"    # سانسِ قراردادِ فعال
    BOOKING_CANCELLED = "BOOKING_CANCELLED"            # لغوِ رزروِ قطعی (بدون پرداخت موفق)


class CouponRedemption(SQLModel, table=True):
    """ردیف مصرف کوپن — با booking_id=null یعنی رزرو معلقِ در انتظار تأیید."""
    __tablename__ = "coupon_redemptions"

    id: Optional[int] = Field(default=None, primary_key=True)
    coupon_id: int = Field(foreign_key="coupons.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    booking_id: Optional[int] = Field(default=None, foreign_key="bookings.id", index=True)
    amount_discounted: int = Field(default=0)
    status: RedemptionStatus = Field(
        default=RedemptionStatus.ACTIVE,
        # همان server_defaultِ مهاجرت (m0s029): مسیری که ستون را نمی‌شناسد — مثل
        # INSERT خام — نباید با «NOT NULL بدون مقدار» بشکند.
        sa_column_kwargs={"server_default": "ACTIVE"},
    )
    released_at: Optional[datetime] = Field(default=None)
    # گرهٔ C24.3: `released_at` زمانِ سرور است و نمی‌گوید «مديرِ X از دکمهٔ رد».
    # `released_by` Nullable است چون جاروبِ انقضا عاملِ انسانی ندارد (None ≠ مجهولِ
    # مشکوک؛ با `released_via = PENDING_EXPIRED` خوانده می‌شود).
    released_by: Optional[int] = Field(default=None, foreign_key="users.id")
    released_via: Optional[str] = Field(default=None, max_length=32)
    created_at: datetime = Field(default_factory=_utcnow)