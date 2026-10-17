from celery import Celery
from celery.schedules import crontab
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
        'app.tasks.waitlist_tasks',
        'app.tasks.loyalty_tasks',
        'app.tasks.competition_tasks',
        'app.tasks.contract_tasks',
        'app.tasks.team_dues_tasks',
        'app.tasks.split_payment_tasks',
        'app.tasks.crm_tasks',
        'app.tasks.reconciliation_tasks',
        'app.tasks.backup_tasks',
    ],
    beat_schedule={
        # تنها منبع زمان‌بندی: تسک‌ها در ماژول‌های دامنه تعریف می‌شوند ولی
        # schedule همین‌جا نگه داشته می‌شود (قبلاً هم worker و هم ماژول‌ها
        # entry داشتند و نیمی از نام‌ها ثبت‌نشده بودند ⇒ job بی‌صدا دور ریخته می‌شد)
        # هر ۱۰ دقیقه رزروهای معلق منقضی‌شده را آزاد کن
        "cleanup-expired-pending-bookings": {
            "task": "app.tasks.cleanup_expired_pending_bookings",
            "schedule": crontab(minute="*/10"),
        },
        # هر ۱۰ دقیقه نفر اول صف انتظارِ پنجره‌اش گذشته را رزرو (معلق) کن
        "convert-expired-waitlist-entries": {
            "task": "app.tasks.convert_expired_waitlist",
            "schedule": crontab(minute="*/10"),
        },
        # هر ساعت یادآوری رزروهای ۲ ساعت آینده
        "send-booking-reminders": {
            "task": "app.tasks.send_booking_reminders",
            "schedule": crontab(minute=0),  # hourly
        },
        # هر نیم‌سال مسابقات (رقابت قیمت) منقضی‌شده را ببند
        "resolve-expired-competitions": {
            "task": "app.tasks.resolve_expired_competitions",
            "schedule": crontab(minute="*/30"),
        },
        # هر روز ساعت ۲ صبح قراردادهای منقضی‌شده را بررسی کن
        "check-expired-contracts": {
            "task": "app.tasks.check_expired_contracts",
            "schedule": crontab(hour=2, minute=0),
        },
        # هر روز ساعت ۳ صبح اقساط معوق را علامت بزن و به کاربر و مدیر اطلاع بده
        "notify-overdue-contract-payments": {
            "task": "app.tasks.notify_overdue_contract_payments",
            "schedule": crontab(hour=3, minute=0),
        },
        # هر روز ساعت ۱:۳۰ سهم ماهانه تیم‌های خودکار را بساز (idempotent با برچسب دوره)
        "generate-monthly-team-dues": {
            "task": "app.tasks.generate_monthly_team_dues",
            "schedule": crontab(hour=1, minute=30),
        },
        # هر روز ساعت ۱:۴۵ جریمه دیرکرد سهم‌های معوق (حداکثر یک ردیف برای هر سهم)
        "apply-team-dues-late-fees": {
            "task": "app.tasks.apply_team_dues_late_fees",
            "schedule": crontab(hour=1, minute=45),
        },
        # هر ساعت سهمِ پرداخت‌نشدهٔ گذشته از مهلت را OVERDUE و پرداخت اشتراکیِ
        # ناقص را EXPIRED کن (راند ۲۶: تا پیش از این هیچ کدی EXPIRED نمی‌ساخت)
        "mark-overdue-split-payments": {
            "task": "app.tasks.mark_overdue_split_payments",
            "schedule": crontab(minute=20),  # hourly
        },
        # هر روز ساعت ۳:۳۰ رزروهای تمام‌شده را کامل کن و امتیاز وفاداری بده
        "complete-past-bookings": {
            "task": "app.tasks.complete_past_bookings",
            "schedule": crontab(hour=3, minute=30),
        },
        # هر روز ساعت ۴ عصر یادآور تمدید قرارداد بفرست
        "send-contract-renewal-reminders": {
            "task": "app.tasks.send_contract_renewal_reminders",
            "schedule": crontab(hour=4, minute=0),
        },
        # سه‌شنبه‌ها ساعت ۴ کاربران غیرفعال با ارزش بالا را گزارش کن
        "notify-dormant-high-value-customers": {
            "task": "app.tasks.notify_dormant_high_value_customers",
            "schedule": crontab(hour=4, minute=0, day_of_week="tuesday"),
        },
        # هر روز نیمه‌شب مغایرگیری دفتر کل با درگاه
        "daily-ledger-reconciliation": {
            "task": "app.tasks.reconcile_ledger_with_gateway",
            "schedule": crontab(hour=0, minute=0),
        },
        # هر روز ساعت ۲ صبح بکاپ خودکار دیتابیس
        "daily-database-backup": {
            "task": "app.tasks.perform_database_backup",
            "schedule": crontab(hour=2, minute=0),
        },
    },
)
