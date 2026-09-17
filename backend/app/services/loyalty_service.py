# backend/app/services/loyalty_service.py
"""امتیاز وفاداری — دفتر فقط-افزودنی؛ موجودی از SUM محاسبه می‌شود.

جریان‌ها:
- جایزه تکمیل رزرو: تسک روزانه (loyalty_tasks) → award_for_booking (idempotent با منبع booking)
- خرج در checkout: redeem_for_booking — ردیف منفی با منبع رزرو (reason متفاوت؛ با جایزه تداخل یکتایی ندارد)
- بازگشت در لغو: refund_for_booking — ردیف جبرانی مثبت (idempotent)
- هدیه/تنظیم دستی: adjust (مدیر/سرپرست)
"""
from typing import Optional

from fastapi import HTTPException
from sqlmodel import Session

from app.config import settings
from app.models.booking import Booking
from app.models.loyalty import LoyaltyPoint, LoyaltyReason
from app.repositories.loyalty_repository import LoyaltyRepository

SOURCE_BOOKING = "booking"


class LoyaltyService:

    @staticmethod
    def balance(session: Session, user_id: int) -> int:
        return LoyaltyRepository(session).balance(user_id)

    @staticmethod
    def rials_per_point() -> int:
        return int(settings.LOYALTY_RIALS_PER_POINT) or 1

    @staticmethod
    def points_for_spending(amount_rial: int) -> int:
        """جایزه یک رزرو: floor(مبلغ ÷ ریال‌_per_امتیاز)."""
        return int(amount_rial) // LoyaltyService.rials_per_point()

    @staticmethod
    def award_for_booking(session: Session, booking: Booking) -> Optional[LoyaltyPoint]:
        """جایزه تکمیل — یک‌بار به‌ازای هر رزرو (ضدّتکرار با source)."""
        points = LoyaltyService.points_for_spending(booking.payment_amount)
        if points <= 0:
            return None
        return LoyaltyRepository(session).add_points(
            user_id=booking.user_id, points=points,
            reason=LoyaltyReason.BOOKING_COMPLETED,
            source_type=SOURCE_BOOKING, source_id=booking.id,
        )

    @staticmethod
    def redeem_for_booking(session: Session, user_id: int, points: int,
                           booking: Booking) -> Optional[LoyaltyPoint]:
        """کسر امتیاز خرج‌شده — ردیف منفی متصل به رزرو نهایی."""
        if points <= 0:
            return None
        repo = LoyaltyRepository(session)
        if repo.balance(user_id) < points:
            raise HTTPException(status_code=400, detail="موجودی امتیاز شما کافی نیست")
        return repo.add_points(
            user_id=user_id, points=-int(points), reason=LoyaltyReason.LOYALTY_REDEEM,
            source_type=SOURCE_BOOKING, source_id=booking.id,
        )

    @staticmethod
    def refund_for_booking(session: Session, booking: Booking) -> Optional[LoyaltyPoint]:
        """بازگشت امتیاز خرج‌شده هنگام لغو — ردیف جبرانی مثبت."""
        if not booking.loyalty_points_used:
            return None
        return LoyaltyRepository(session).add_points(
            user_id=booking.user_id, points=int(booking.loyalty_points_used),
            reason=LoyaltyReason.LOYALTY_REFUND,
            source_type=SOURCE_BOOKING, source_id=booking.id,
        )

    @staticmethod
    def adjust(session: Session, user_id: int, points: int,
               reason_label: str = "") -> LoyaltyPoint:
        """هدیه/تنظیم دستی (مدیر/سرپرست)."""
        return LoyaltyRepository(session).create({
            "user_id": user_id, "points": int(points),
            "reason": LoyaltyReason.MANUAL_ADJUST,
            "source_type": "manual" if reason_label else None,
            "source_id": None,
        })