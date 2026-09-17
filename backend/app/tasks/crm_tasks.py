# backend/app/tasks/crm_tasks.py
"""تسک‌های CRM (brief §4 بند RENEWAL REMINDERS):

- send_contract_renewal_reminders (روزانه ۰۴:۰۰): قراردادهای ACTIVE که دقیقاً
  ۷ روز آینده تمام می‌شوند → اعلان به مالک قرارداد + مدیر سالن.
  ضدتکرار با «پنجره‌ی تک‌روز» (end_date == today+7) — هر قرارداد فقط یک بار
  داخل بازه‌ی ۷ روزه هدف می‌گیرد (state جدا لازم ندارد؛ مستند).
- notify_dormant_high_value_customers (هفتگی): پرسرف‌هزینه‌های ≥۹۰ روز بی‌فعال
  → اعلان خلاصه به مدیر همان سالن (هفته‌ای یک‌بار — خودِ beat مبنای ضدتکرار).
الگوی تست: تابع‌ها مستقیم قابل صدا هستند (مانند تسک‌های قرارداد).
"""
import asyncio
from datetime import date, timedelta

from celery.schedules import crontab
from sqlmodel import select

from app.tasks.worker import celery_app

RENEWAL_TARGET_DAYS = 7
DORMANT_DAYS_MIN = 90
TOP_SPENDERS_PER_VENUE = 5


@celery_app.task(name="send_contract_renewal_reminders")
def send_contract_renewal_reminders():
    from app.models.contract import Contract, ContractStatus
    from app.services.notification_service import notification_service
    from app.unit_of_work import UnitOfWork

    target = date.today() + timedelta(days=RENEWAL_TARGET_DAYS)
    with UnitOfWork() as uow:
        contracts = list(uow.session.exec(
            select(Contract).where(Contract.status == ContractStatus.ACTIVE,
                                   Contract.end_date == target)).all())

        async def _notify_all():
            for c in contracts:
                venue = uow.venues.get_by_id(c.venue_id)
                owner = uow.users.get_by_id(c.user_id)
                await notification_service.send_to_user(
                    c.user_id, "🔁 زمان تمدید قرارداد فرا رسید",
                    f"قرارداد #{c.id} در سالن {venue.name if venue else ''} "
                    f"در {c.end_date} (۷ روز دیگر) تمام می‌شود؛ برای تمدید "
                    "با سالن هماهنگی کنید.",
                    {"contract_id": c.id, "venue_id": c.venue_id,
                     "end_date": str(c.end_date)},
                    notif_type="contract_renewal")
                if venue and venue.manager_id and venue.manager_id != c.user_id:
                    await notification_service.send_to_user(
                        venue.manager_id, "🔁 قرارداد در آستانه‌ی انقضا",
                        f"قرارداد #{c.id} (مالک: {owner.full_name if owner else '—'}) "
                        f"در سالن {venue.name} در {c.end_date} تمام می‌شود.",
                        {"contract_id": c.id, "user_id": c.user_id},
                        notif_type="contract_renewal")

        if contracts:
            try:
                asyncio.run(_notify_all())
            except RuntimeError:  # pragma: no cover — داخل event loop سلری
                loop = asyncio.new_event_loop()
                loop.run_until_complete(_notify_all())
                loop.close()
        return {"notified_contracts": len(contracts)}


@celery_app.task(name="notify_dormant_high_value_customers")
def notify_dormant_high_value_customers():
    from app.models.venue import Venue
    from app.services.crm_service import DORMANT_DAYS, compute_customer_rows
    from app.services.notification_service import notification_service
    from app.unit_of_work import UnitOfWork

    with UnitOfWork() as uow:
        venues = list(uow.session.exec(select(Venue)).all())

        async def _notify_all():
            notified_users = 0
            for venue in venues:
                cutoff = date.today() - timedelta(days=DORMANT_DAYS_MIN)
                rows = [r for r in compute_customer_rows(uow, venue.id)
                        if r["total_spend"] > 0
                        and r["last_booking_date"] is not None
                        and r["last_booking_date"] <= cutoff]
                rows.sort(key=lambda r: -r["total_spend"])
                rows = rows[:TOP_SPENDERS_PER_VENUE]
                if not rows:
                    continue
                names = "، ".join(r["full_name"] for r in rows)
                await notification_service.send_to_user(
                    venue.manager_id, "🕰 مشتریان پرسرف بدون مراجعه",
                    f"{len(rows)} مشتری پرسرف‌هزینه در {venue.name} بیش از "
                    f"{DORMANT_DAYS_MIN} روز مراجعه نکرده‌اند: {names}",
                    {"venue_id": venue.id, "user_ids": [r["user_id"] for r in rows],
                     "weekly_dormant_notice": True},
                    notif_type="crm_dormant_weekly")
                notified_users += len(rows)
            return notified_users

        notified = 0
        try:
            notified = asyncio.run(_notify_all())
        except RuntimeError:  # pragma: no cover
            loop = asyncio.new_event_loop()
            notified = loop.run_until_complete(_notify_all())
            loop.close()
        return {"dormant_high_value": notified}


celery_app.conf.beat_schedule.update({
    "send-contract-renewal-reminders": {
        "task": "send_contract_renewal_reminders",
        "schedule": crontab(hour=4, minute=0),
    },
    "notify-dormant-high-value-customers": {
        "task": "notify_dormant_high_value_customers",
        "schedule": crontab(hour=4, minute=0, day_of_week="tuesday"),
    },
})