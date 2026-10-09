from celery import Celery
from app.config import settings

celery_app = Celery(
    "futsal",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Tehran",
    enable_utc=True,
    # Import all task modules explicitly so they're discoverable
    imports=[
        'app.tasks.pending_booking_tasks',
        'app.tasks.reminder_tasks',
        'app.tasks.loyalty_tasks',
        'app.tasks.competition_tasks',
        'app.tasks.contract_tasks',
        'app.tasks.crm_tasks',
        'app.tasks.reconciliation_tasks',
    ],
    beat_schedule={
        # هر ۱۰ دقیقه رزروهای معلق منقضی‌شده را آزاد کن
        "cleanup-expired-pending-bookings": {
            "task": "app.tasks.cleanup_expired_pending_bookings",
            "schedule": 600.0,  # every 10 minutes
        },
        # هر ساعت یادآوری رزروهای ۲ ساعت آینده
        "send-booking-reminders": {
            "task": "app.tasks.send_booking_reminders",
            "schedule": 3600.0,  # every hour
        },
        # هر روز نیمه‌شب مسابقات منقضی‌شده را ببند
        "resolve-expired-competitions": {
            "task": "app.tasks.resolve_expired_competitions",
            "schedule": 86400.0,  # every day at midnight
        },
        # هر روز صبح قراردادهای منقضی‌شده را بررسی کن
        "check-expired-contracts": {
            "task": "app.tasks.check_expired_contracts",
            "schedule": 86400.0,  # daily
        },
        # هر هفته یکبار بازی‌های گذشته را تکمیل کن
        "complete-past-bookings-weekly": {
            "task": "app.tasks.complete_past_bookings",
            "schedule": 604800.0,  # weekly
        },
        # هر روز عصر یادآور تمدید قرارداد بفرست
        "send-contract-renewal-reminders": {
            "task": "app.tasks.send_contract_renewal_reminders",
            "schedule": 86400.0,  # daily
        },
        # هر هفته کاربران غیرفعال با ارزش بالا را شناسایی کن
        "notify-dormant-high-value-customers": {
            "task": "app.tasks.notify_dormant_high_value_customers",
            "schedule": 604800.0,  # weekly
        },
        # هر روز نیمه‌شب مغایرگیری دفتر کل با درگاه
        "daily-ledger-reconciliation": {
            "task": "app.tasks.reconcile_ledger_with_gateway",
            "schedule": 86400.0,  # daily at midnight
        },
    },
)
