# backend/app/tasks/pending_booking_tasks.py
"""تمیزکاری رزروهای معلق منقضی‌شده (بدون تأیید/رد توسط مدیر)"""
import logging

from sqlmodel import Session

from app.database import engine
from app.models.slot import Slot, SlotStatus
from app.models.coupon import ReleaseVia
from app.services.pending_booking_service import pending_booking_service
from app.services.booking_service import BookingService
from app.tasks.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.cleanup_expired_pending_bookings")
def cleanup_expired_pending_bookings():
    """رزروهای معلق منقضی‌شده را پاک کرده و سانس آن‌ها را آزاد می‌کند"""
    from app.unit_of_work import UnitOfWork

    expired = pending_booking_service.all_expired()
    released = 0
    for record in expired:
        slot_id = record["slot_id"]
        pending_booking_service.remove(record["id"])
        if record.get("coupon_redemption_id"):
            # کوپن رزرو معلقِ سوخته نشود — با rollback خودِ UoW در خطا امن است.
            # عاملِ انسانی ندارد ⇒ `actor_id=None` و `via=PENDING_EXPIRED`؛ تاریخچه
            # باید بگوید «خودکار» نه «مجهول» (گرهٔ C24.3).
            try:
                with UnitOfWork() as uow:
                    BookingService.release_pending_promotions(
                        uow, record, via=ReleaseVia.PENDING_EXPIRED)
                    uow.commit()
            except Exception:
                # گرهٔ C24.4: `pass` یعنی ظرفیت برنگشته و هیچ‌کس نمی‌داند.
                logger.warning("expiry sweep could not release redemption %s of pending %s",
                               record.get("coupon_redemption_id"), record.get("id"),
                               exc_info=True)
        try:
            with Session(engine) as session:
                slot = session.get(Slot, slot_id)
                if slot and slot.status == SlotStatus.BOOKED:
                    # سانس قرارداد به حالت RESERVED برمی‌گردد
                    slot.status = SlotStatus.RESERVED if slot.is_contract_slot else SlotStatus.AVAILABLE
                    session.add(slot)
                    session.commit()
                    released += 1
        except Exception:
            pass
    return {"expired": len(expired), "released": released}
