# backend/app/tasks/waitlist_tasks.py
"""Job تبدیل صف انتظار: هر ۱۰ دقیقه نفرِ اولِ سانس‌هایی که پنجرهٔ ۲ ساعته‌شان
تمام شده را رزرو معلق می‌کند (B5). اگر سانس در آن فاصله توسط نفر دیگری گرفته
شده باشد، ردیف «expired» می‌شود و اخطار می‌رود — نه رزرو تکراری."""
import asyncio

from app.tasks.worker import celery_app


def _dispatch(uow, notifications):
    """اعلان از worker؛ خرابی اعلان نباید تبدیلِ ثبت‌شده را واگرد کند."""
    if not notifications:
        return 0
    from app.services.waitlist_service import WaitlistService
    try:
        asyncio.run(WaitlistService.dispatch_notifications(uow, notifications))
    except RuntimeError:  # pragma: no cover — حلقه‌ای از قبل در جریان است
        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(WaitlistService.dispatch_notifications(uow, notifications))
        finally:
            loop.close()
    except Exception as e:  # pragma: no cover — ریدیس/شبکه در دسترس نیست
        print(f"[waitlist_tasks] notification dispatch failed: {e}")
    return len(notifications)


@celery_app.task(name="app.tasks.convert_expired_waitlist")
def convert_expired_waitlist_entries():
    from app.services.waitlist_service import WaitlistService
    from app.unit_of_work import UnitOfWork

    with UnitOfWork() as uow:
        result, notifications = WaitlistService.convert_expired(uow)
        uow.commit()
        result["notified"] = _dispatch(uow, notifications)
        return result
