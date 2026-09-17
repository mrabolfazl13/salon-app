# backend/app/tasks/loyalty_tasks.py
"""تسک‌های وفاداری:

complete_past_bookings (روزانه ۰۳:۳۰):
- رزروهای CONFIRMED که سانسِ آن‌ها تمام شده → COMPLETED؛ همین لحظه جایزه
  امتیاز (payment_amount ÷ LOYALTY_RIALS_PER_POINT) با idempotency منبع ثبت می‌شود.
  تا پیش از این هیچ گذار COMPLETED در سامانه وجود نداشت — این تسک مبدأ آن است.
"""
from datetime import date, datetime, timedelta, timezone

from celery.schedules import crontab

from app.tasks.worker import celery_app


@celery_app.task(name="complete_past_bookings")
def complete_past_bookings():
    from sqlmodel import select

    from app.models.booking import Booking, BookingStatus
    from app.models.slot import Slot
    from app.services.loyalty_service import LoyaltyService
    from app.unit_of_work import UnitOfWork
    from app.utils.time_guard import slot_start_datetime

    completed = 0
    awarded = 0
    with UnitOfWork() as uow:
        today = date.today()
        stmt = select(Booking).join(Slot).where(
            Booking.status == BookingStatus.CONFIRMED,
            Slot.slot_date <= today,
        )
        for booking in uow.session.exec(stmt).all():
            slot = uow.slots.get_by_id(booking.slot_id)
            if slot is None:
                continue
            end = slot_start_datetime(slot.slot_date, slot.start_time) + timedelta(
                minutes=slot.duration or 90)
            if end > datetime.now():
                continue
            obj = uow.bookings.get_by_id(booking.id)
            obj.status = BookingStatus.COMPLETED
            uow.session.add(obj)
            uow.session.flush()
            row = LoyaltyService.award_for_booking(uow.session, obj)
            if row:
                awarded += 1
            completed += 1
        uow.commit()
    return {"completed": completed, "awarded": awarded}


celery_app.conf.beat_schedule.update({
    "complete-past-bookings": {
        "task": "complete_past_bookings",
        "schedule": crontab(hour=3, minute=30),
    },
})