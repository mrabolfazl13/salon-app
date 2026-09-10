from sqlmodel import Session, select
from typing import List, Optional

from app.models.payment import BookingPayment, BookingPaymentStatus
from app.repositories.base import BaseRepository


class BookingPaymentRepository(BaseRepository[BookingPayment]):

    def __init__(self, session: Session):
        super().__init__(BookingPayment, session)

    def get_by_user(self, user_id: int, limit: int = 50, offset: int = 0) -> List[BookingPayment]:
        stmt = (
            select(BookingPayment)
            .where(BookingPayment.user_id == user_id)
            .order_by(BookingPayment.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(self.session.exec(stmt).all())

    def get_pending_for_booking(self, booking_id: int) -> Optional[BookingPayment]:
        stmt = select(BookingPayment).where(
            BookingPayment.booking_id == booking_id,
            BookingPayment.status == BookingPaymentStatus.PENDING,
        )
        return self.session.exec(stmt).first()

    def has_paid_for_booking(self, booking_id: int) -> bool:
        stmt = select(BookingPayment).where(
            BookingPayment.booking_id == booking_id,
            BookingPayment.status == BookingPaymentStatus.PAID,
        )
        return self.session.exec(stmt).first() is not None

    def get_paid_for_booking(self, booking_id: int) -> Optional[BookingPayment]:
        """رکورد پرداخت موفق یک رزرو (برای بازگشت وجه هنگام لغو)"""
        stmt = select(BookingPayment).where(
            BookingPayment.booking_id == booking_id,
            BookingPayment.status == BookingPaymentStatus.PAID,
        )
        return self.session.exec(stmt).first()

    def get_latest_for_booking(self, booking_id: int) -> Optional[BookingPayment]:
        """آخرین فاکتور یک رزرو (هر وضعیتی) — برای نمایش در جزئیات رزرو"""
        stmt = (
            select(BookingPayment)
            .where(BookingPayment.booking_id == booking_id)
            .order_by(BookingPayment.created_at.desc())
        )
        return self.session.exec(stmt).first()
