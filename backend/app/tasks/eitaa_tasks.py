# backend/app/tasks/eitaa_tasks.py
"""انتشار جدول سانسها در کانال ایتا.

- post_daily_eitaa_schedules: هر روز یکبار (beat ساعت ۰۷ تهران) جدول سانسها را پست میکند.
- repost_eitaa_schedule_with_check: بلافاصله بعد از تأیید رزرو، همان جدول را دوباره
  با ✅ روی سانس مربوطه ارسال میکند (API ایتا editMessageText ندارد).

هر دو تسک خطاهای ایتا را لاگ کرده و بلع میکنند: تأیید رزرو نباید به خاطر قطعی
سرویس ایتا شکست بخورد.
"""
import logging

from sqlmodel import select

from app.tasks.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.post_daily_eitaa_schedules")
def post_daily_eitaa_schedules():
    from app.models.eitaa import EitaaChannel
    from app.services.eitaa_service import EitaaError, publish_schedule, today_tehran
    from app.unit_of_work import UnitOfWork

    day = today_tehran()
    posted = skipped = failed = 0
    with UnitOfWork() as uow:
        channels = uow.session.exec(
            select(EitaaChannel).where(EitaaChannel.is_active == True)  # noqa: E712
        ).all()
        for channel in channels:
            if channel.last_post_date == day:
                skipped += 1  # idempotency: هر سالن هر روز فقط یک پست اصلی
                continue
            try:
                publish_schedule(uow, channel.venue_id, day=day, is_update=False)
                posted += 1
            except EitaaError as exc:
                failed += 1
                logger.warning("Eitaa daily post failed venue=%s: %s", channel.venue_id, exc)
            except Exception:  # noqa: BLE001 — یک کانال نباید بقیه را متوقف کند
                failed += 1
                logger.exception("Unexpected Eitaa daily post failure venue=%s", channel.venue_id)

    return {"posted": posted, "skipped": skipped, "failed": failed, "day": day.isoformat()}


@celery_app.task(name="app.tasks.repost_eitaa_schedule_with_check")
def repost_eitaa_schedule_with_check(venue_id: int, slot_id: int):
    from app.models.eitaa import EitaaChannel
    from app.services.eitaa_service import EitaaError, publish_schedule, today_tehran
    from app.unit_of_work import UnitOfWork

    day = today_tehran()
    with UnitOfWork() as uow:
        slot = uow.slots.get_by_id(slot_id)
        if slot is None or slot.slot_date != day:
            return {"skipped": "slot_not_today"}
        channel = uow.session.exec(
            select(EitaaChannel).where(EitaaChannel.venue_id == venue_id)
        ).first()
        if channel is None or not channel.is_active:
            return {"skipped": "not_configured"}

        try:
            return publish_schedule(uow, venue_id, day=day, is_update=True)
        except EitaaError as exc:
            logger.warning("Eitaa repost failed venue=%s slot=%s: %s", venue_id, slot_id, exc)
            return {"error": str(exc)}
        except Exception:  # noqa: BLE001
            logger.exception("Unexpected Eitaa repost failure venue=%s slot=%s", venue_id, slot_id)
            return {"error": "unexpected"}
