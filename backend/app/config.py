from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://futsal:secret@postgres:5432/futsal_db"
    REDIS_URL: str = "redis://redis:6379/0"
    JWT_SECRET: str = "your-super-secret-jwt-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24
    ADMIN_PHONE: str = "09123456789"
    ADMIN_PASSWORD: str = "admin123"
    PENDING_BOOKING_TTL_HOURS: int = 4
    # موتور قیمت — مبنای پیش‌فرض تولید سانس (null بودن venue.default_slot_price)
    DEFAULT_SLOT_PRICE: int = 200000
    # وفاداری: هر LOYALTY_RIALS_PER_POINT ریالِ پرداختی = ۱ امتیاز؛
    # ارزش هر امتیاز در خرج هم همین ریال است (سرعت ۱:۱ ساده و قابل تنظیم از env)
    LOYALTY_RIALS_PER_POINT: int = 10000
    # تیم: سقف اعضای (قطعی + در انتظار پاسخ) هر تیم
    TEAM_MAX_MEMBERS: int = 50
    # سقف خرج امتیاز: حداکثر چند درصد قیمت نهایی (قبل کوپن) با امتیاز تخفیف بگیرد
    LOYALTY_REDEEM_MAX_PERCENT: int = 50
    # CRM: سقف کمپین بازاریابی به‌ازای هر سالن در هر روز (brief §4)
    CRM_CAMPAIGN_DAILY_LIMIT: int = 1

    # محیط اجرا — در production فقط Alembic اسکیما را می‌سازد (create_all غیرفعال)
    APP_ENV: str = "development"
    # ساخت خودکار جداول هنگام استارت — فقط مسیر توسعه؛ با false کاملاً خاموش می‌شود
    AUTO_CREATE_ALL: bool = True
    # لاگ کوئری‌های SQL (به‌جای مقدار هاردکدشده‌ی قدیمی)
    DB_ECHO: bool = False
    # افشای کد توسعه‌ای (dev_code) در پاسخ API — فقط وقتی روشن باشد؛ وگرنه کد فقط در لاگ سرور
    DEBUG_ALLOW_DEV_CODE: bool = False

    # SMTP برای ارسال کد تأیید ایمیل — اگر خالی باشد، کد فقط لاگ می‌شود
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "futsal-booking@no-reply.local"
    ALLOWED_ORIGINS: str = (
        "http://localhost:3000,http://localhost:3001,http://localhost:5173,"
        "http://127.0.0.1:3000,http://127.0.0.1:5173,"
        "http://tauri.localhost,tauri://localhost"
    )

    # MinIO - object storage
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "futsal-minio-secret"
    MINIO_BUCKET: str = "futsal-venues"
    MINIO_SECURE: bool = False
    MINIO_PUBLIC_URL: str = ""  # اگر خالی باشد از MINIO_ENDPOINT ساخته می‌شود

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

    @property
    def allowed_origins_list(self) -> list:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

settings = Settings()
