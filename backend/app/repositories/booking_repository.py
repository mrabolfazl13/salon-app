from sqlmodel import Session, select, and_, func
from sqlalchemy import text
from datetime import date, datetime, timedelta
from typing import Optional, List
from app.models.booking import Booking, BookingStatus
from app.models.slot import Slot
from app.repositories.base import BaseRepository

class BookingRepository(BaseRepository[Booking]):
    
    def __init__(self, session: Session):
        super().__init__(Booking, session)
    
    def get_by_user(self, user_id: int, limit: int = 50) -> List[Booking]:
        return self.get_all(limit=limit, user_id=user_id, order_by="booked_at", order_desc=True)
    
    def get_by_slot(self, slot_id: int) -> Optional[Booking]:
        return self.get_one(slot_id=slot_id)
    
    def get_by_slot_with_lock(self, slot_id: int) -> Optional[Booking]:
        """بررسی رزرو با قفل دیتابیسی برای جلوگیری از race condition"""
        statement = select(Booking).where(
            Booking.slot_id == slot_id,
            Booking.status == BookingStatus.CONFIRMED
        ).with_for_update()
        return self.session.exec(statement).first()
    
    def get_by_venue(self, venue_id: int, start_date: date, end_date: date) -> List[Booking]:
        statement = select(Booking).join(Slot).where(
            Slot.venue_id == venue_id,
            Slot.slot_date >= start_date,
            Slot.slot_date <= end_date,
            Booking.status == BookingStatus.CONFIRMED
        ).order_by(Booking.booked_at.desc())
        return self.session.exec(statement).all()
    
    def get_user_upcoming_bookings(self, user_id: int, days_ahead: int = 7) -> List[Booking]:
        statement = select(Booking).join(Slot).where(
            Booking.user_id == user_id,
            Booking.status == BookingStatus.CONFIRMED,
            Slot.slot_date >= date.today(),
            Slot.slot_date <= date.today() + timedelta(days=days_ahead)
        ).order_by(Slot.slot_date, Slot.start_time)
        return self.session.exec(statement).all()
    
    def get_user_past_bookings(self, user_id: int, limit: int = 20) -> List[Booking]:
        statement = select(Booking).join(Slot).where(
            Booking.user_id == user_id,
            Booking.status == BookingStatus.CONFIRMED,
            Slot.slot_date < date.today()
        ).order_by(Slot.slot_date.desc()).limit(limit)
        return self.session.exec(statement).all()
    
    def realized_bucket_stats(self, venue_id: int, start_date: date, end_date: date) -> dict:
        """آمارِ محقق‌شدهٔ هر دستهٔ (روز هفته, ساعت) از روی رزروهای پرداخت‌شده.

        منبع سیگنال تقاضا «Booking» است نه status سانس: سانسِ لغوشده به AVAILABLE برمی‌گردد
        و status گذشته را نمی‌بیند، ولی رزروِ لغوشده هرگز شمارش نمی‌شود.
        فقط CONFIRMED/COMPLETED (pending هنوز پول نداده). payment_amount قیمت واقعی پرداختی است.
        خروجی: {(date.weekday(), hour): {"bookings": n, "revenue": sum}}
        """
        counted = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]
        statement = select(
            Slot.slot_date, Slot.start_time, Booking.payment_amount
        ).join(Slot, Booking.slot_id == Slot.id).where(
            Slot.venue_id == venue_id,
            Booking.status.in_(counted),
            Slot.slot_date >= start_date,
            Slot.slot_date <= end_date,
        )
        stats: dict = {}
        for slot_date, start_time, amount in self.session.exec(statement).all():
            key = (slot_date.weekday(), start_time.hour)
            bucket = stats.setdefault(key, {"bookings": 0, "revenue": 0})
            bucket["bookings"] += 1
            bucket["revenue"] += int(amount or 0)
        return stats

    def cancel_booking(self, booking_id: int, user_id: int) -> Optional[Booking]:
        booking = self.get_by_id(booking_id)
        if booking and booking.user_id == user_id and booking.status == BookingStatus.CONFIRMED:
            from app.repositories.slot_repository import SlotRepository
            slot_repo = SlotRepository(self.session)
            slot_repo.release_slot(booking.slot_id)
            return self.update(booking_id, {"status": BookingStatus.CANCELLED})
        return None
