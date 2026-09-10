# backend/app/tasks/pending_booking_tasks.py
"""تمیزکاری رزروهای معلق منقضی‌شده (بدون تأیید/رد توسط مدیر)"""
from sqlmodel import Session

from app.database import engine
from app.models.slot import Slot, SlotStatus
from app.services.pending_booking_service import pending_booking_service
from app.tasks.worker import celery_app


@celery_app.task(name="app.tasks.cleanup_expired_pending_bookings")
def cleanup_expired_pending_bookings():
    """رزروهای معلق منقضی‌شده را پاک کرده و سانس آن‌ها را آزاد می‌کند"""
    expired = pending_booking_service.all_expired()
    released = 0
    for record in expired:
        slot_id = record["slot_id"]
        pending_booking_service.remove(record["id"])
        try:
            with Session(engine) as session:
                slot = session.get(Slot, slot_id)
                if slot and slot.status == SlotStatus.BOOKED:
                    slot.status = SlotStatus.AVAILABLE
                    session.add(slot)
                    session.commit()
                    released += 1
        except Exception:
            pass
    return {"expired": len(expired), "released": released}
