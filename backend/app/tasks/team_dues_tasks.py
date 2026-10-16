# backend/app/tasks/team_dues_tasks.py
"""تسک‌های حق‌عضویت تیم:
- generate_monthly_team_dues (روزانه ۰۱:۳۰): سهم همان ماه را برای تیم‌های
  dues_auto می‌سازد. روزانه بودن عمدی است: هم تیمی که وسط ماه خودکار می‌شود
  سهم همان ماه را می‌گیرد، هم عضو جدیدِ اضافه‌شده در میانه ماه جا نمی‌ماند —
  ضدتکرار با عنوانِ برچسب‌دارِ دوره + سررسید انجامش می‌دهد.
- apply_team_dues_late_fees (روزانه ۰۱:۴۵): جریمه دیرکرد برای سهم بازِ گذشته
  از سررسید + TEAM_DUES_LATE_FEE_GRACE_DAYS (حداکثر یک ردیف برای هر سهم).
"""
import asyncio

from app.tasks.worker import celery_app


def _dispatch(uow, notifications):
    """ارسال اعلان از worker؛ خرابی شبکهٔ اعلان نباید job را بشکند (داده ثبت شده)."""
    if not notifications:
        return 0
    from app.services.team_service import TeamService
    try:
        asyncio.run(TeamService.dispatch_notifications(uow, notifications))
    except RuntimeError:  # pragma: no cover — حلقه‌ای از قبل در جریان است
        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(TeamService.dispatch_notifications(uow, notifications))
        finally:
            loop.close()
    except Exception as e:  # pragma: no cover — SQLite/Redis در دسترس نیست
        print(f"[team_dues_tasks] notification dispatch failed: {e}")
    return len(notifications)


@celery_app.task(name="app.tasks.generate_monthly_team_dues")
def generate_monthly_team_dues():
    from app.services.team_service import TeamService
    from app.unit_of_work import UnitOfWork

    with UnitOfWork() as uow:
        result, notifications = TeamService.run_monthly_dues(uow)
        uow.commit()
        result["notified"] = _dispatch(uow, notifications)
        return result


@celery_app.task(name="app.tasks.apply_team_dues_late_fees")
def apply_team_dues_late_fees():
    from app.services.team_service import TeamService
    from app.unit_of_work import UnitOfWork

    with UnitOfWork() as uow:
        result, notifications = TeamService.run_late_fees(uow)
        uow.commit()
        result["notified"] = _dispatch(uow, notifications)
        return result
