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
    beat_schedule={
        # هر ۱۰ دقیقه رزروهای معلق منقضی‌شده را آزاد کن
        "cleanup-expired-pending-bookings": {
            "task": "app.tasks.cleanup_expired_pending_bookings",
            "schedule": 600.0,
        },
    },
)

celery_app.autodiscover_tasks(['app.tasks'])
