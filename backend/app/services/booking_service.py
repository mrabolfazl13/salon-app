from fastapi import HTTPException
from app.unit_of_work import UnitOfWork
from app.models.slot import SlotStatus
from app.models.booking import BookingStatus


class BookingService:

    @staticmethod
    def create_booking(uow: UnitOfWork, slot_id: int, user_id: int) -> dict:
        """ایجاد رزرو معلق (در انتظار تأیید مدیر سالن)

        رزرو در دیتابیس ثبت نمی‌شود؛ در Redis نگه داشته می‌شود و
        سانس تا زمان تأیید/رد توسط مدیر در حالت BOOKED (رزرو شده) می‌ماند.
        """
        from app.services.pending_booking_service import pending_booking_service

        # استفاده از قفل دیتابیسی (SELECT ... FOR UPDATE) برای جلوگیری از race condition
        slot = uow.slots.get_by_id_with_lock(slot_id)
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")

        if slot.status != SlotStatus.AVAILABLE:
            raise HTTPException(status_code=400, detail="Slot is not available")

        # بررسی رزرو تکراری با قفل - از race condition جلوگیری می‌کند
        existing = uow.bookings.get_by_slot_with_lock(slot_id)
        if existing:
            raise HTTPException(status_code=400, detail="Slot already booked")

        if pending_booking_service.has_pending_for_slot(slot_id):
            raise HTTPException(status_code=400, detail="Slot is already pending confirmation")

        # تا مدیر سالن تأیید یا رد کند، سانس رزرو شده می‌ماند تا کسی دیگر نتواند رزرو کند
        uow.slots.update(slot_id, {"status": SlotStatus.BOOKED})

        pending = pending_booking_service.create(
            slot_id=slot_id,
            venue_id=slot.venue_id,
            user_id=user_id,
            payment_amount=slot.current_price,
        )
        return pending

    @staticmethod
    def confirm_pending(uow: UnitOfWork, pending: dict) -> "Booking":
        """تبدیل رزرو معلق به رزرو قطعی در دیتابیس (فقط توسط مدیر سالن)"""
        from app.services.pending_booking_service import pending_booking_service

        slot = uow.slots.get_by_id(pending["slot_id"])
        if not slot:
            pending_booking_service.remove(pending["id"])
            raise HTTPException(status_code=404, detail="Slot not found")

        if slot.status != SlotStatus.BOOKED:
            # سانس دیگر در حالت رزرو نیست (مثلاً آزاد شده) — رکورد معلق را پاک کن
            pending_booking_service.remove(pending["id"])
            raise HTTPException(status_code=400, detail="Slot is no longer held for this booking")

        existing = uow.bookings.get_by_slot_with_lock(pending["slot_id"])
        if existing:
            pending_booking_service.remove(pending["id"])
            raise HTTPException(status_code=400, detail="Slot already has a confirmed booking")

        # حالا داخل دیتابیس می‌نشیند
        booking = uow.bookings.create({
            "slot_id": pending["slot_id"],
            "user_id": pending["user_id"],
            "payment_amount": pending["payment_amount"],
            "status": BookingStatus.CONFIRMED,
        })

        pending_booking_service.remove(pending["id"])
        return booking

    @staticmethod
    def cancel_booking(uow: UnitOfWork, booking_id: int, user_id: int):
        booking = uow.bookings.get_by_id(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if booking.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not your booking")
        
        if booking.status != BookingStatus.CONFIRMED:
            raise HTTPException(status_code=400, detail="Cannot cancel this booking")
        
        uow.slots.update(booking.slot_id, {"status": SlotStatus.AVAILABLE})
        cancelled = uow.bookings.update(booking_id, {"status": BookingStatus.CANCELLED})
        
        return cancelled

    @staticmethod
    def get_user_bookings(uow: UnitOfWork, user_id: int, limit: int = 50):
        return uow.bookings.get_by_user(user_id, limit)

    @staticmethod
    def get_upcoming_bookings(uow: UnitOfWork, user_id: int, days_ahead: int = 7):
        return uow.bookings.get_user_upcoming_bookings(user_id, days_ahead)

    @staticmethod
    def get_past_bookings(uow: UnitOfWork, user_id: int, limit: int = 20):
        return uow.bookings.get_user_past_bookings(user_id, limit)
