# backend/app/models/loyalty.py
"""دفتر امتیاز وفاداری — فقط-افزودنی (append-only) هم‌را با دفتر کل مالی.

موجودی کاربر = SUM(points) روی ردیف‌ها؛ هیچ ردیفی حذف/دستکاری نمی‌شود.
تکمیل رزرو → امتیاز مثبت؛ خرج امتیاز در checkout → ردیف منفی با
source (booking) و بازگردت در لغو → ردیف جبرانی مثبت (idempotent).
"""
from sqlmodel import SQLModel, Field, UniqueConstraint
from typing import Optional
from datetime import datetime, timezone
from enum import Enum


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class LoyaltyReason(str, Enum):
    BOOKING_COMPLETED = "booking_completed"
    COST_SPLIT_REMAINDER = "cost_split_remainder"
    MANUAL_ADJUST = "manual_adjust"          # هدیه/تنظیم دستی مدیر
    COUPON_REDEMPTION = "coupon_redemption"  # امتیاز کنارِ مصرف کوپن (افقی در آینده)
    LOYALTY_REDEEM = "loyalty_redeem"        # خرج امتیاز در رزرو (منفی)
    LOYALTY_REFUND = "loyalty_refund"        # بازگشت امتیاز خرج‌شده در لغو (مثبت)
    GAME_WIN = "game_win"                    # برد در بازی گروهی (به‌ازای هر بازی/کاربر یکتا)
    REVIEW = "review"                        # ثبت نظر برای سالن (به‌ازای هر نظر یکتا)


class LoyaltyPoint(SQLModel, table=True):
    __tablename__ = "loyalty_points"
    __table_args__ = (
        # ضدتکرار جایزه/خرج هر رزرو: (user, reason, source) یکتا
        UniqueConstraint("user_id", "reason", "source_type", "source_id",
                         name="uq_loyalty_source_once"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    points: int = Field(description="مقدارِ امضا‌دار — مثبت جایزه، منفی خرج")
    reason: LoyaltyReason = Field(index=True)
    source_type: Optional[str] = Field(default=None, max_length=30)  # "booking"
    source_id: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=_utcnow)