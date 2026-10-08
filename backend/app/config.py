from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://futsal:secret@postgres:5432/futsal_db"
    REDIS_URL: str = "redis://redis:6379/0"
    JWT_SECRET: str = ""  # MUST be set in production environment
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24
    JWT_REFRESH_EXPIRY_DAYS: int = 30  # Added for refresh tokens
    ADMIN_PHONE: str = "09123456789"
    ADMIN_PASSWORD: str = ""  # MUST be set in production environment
    PENDING_BOOKING_TTL_HOURS: int = 4
    # موتور قیمت — مبنای پیش‌فرض تولید سانس (null بودن venue.default_slot_price)
    DEFAULT_SLOT_PRICE: int = 200000
    # وفاداری: هر LOYALTY_RIALS_PER_POINT ریالِ پرداختی = ۱ امتیاز؛
    # ارزش هر امتیاز در خرج هم همین ریال است (سرعت ۱:۱ ساده و قابل تنظیم از env)
    LOYALTY_RIALS_PER_POINT: int = 10000
    # تیم: سقف اعضای (قطعی + در انتظار پاسخ) هر تیم
    TEAM_MAX_MEMBERS: int = 50
    # تیم: حدنصاب رسمی‌شدن — تعداد اعضای فعال لازم (قابل تنظیم از env)
    TEAM_MIN_MEMBERS: int = 5
    # سقف خرج امتیاز: حداکثر چند درصد قیمت نهایی (قبل کوپن) با امتیاز تخفیف بگیرد
    LOYALTY_REDEEM_MAX_PERCENT: int = 50
    # وفاداری — اهدای امتیاز به‌ازای برد در بازی گروهی و ثبت نظر (قابل تنظیم از env)
    LOYALTY_POINTS_PER_GAME_WIN: int = 500
    LOYALTY_POINTS_PER_REVIEW: int = 50
    # CRM: سقف کمپین بازاریابی به‌ازای هر سالن در هر روز (brief §4)
    CRM_CAMPAIGN_DAILY_LIMIT: int = 1

    # محیط اجرا — در production فقط Alembic اسکیما را می‌سازد (create_all غیرفعال)
    APP_ENV: str = "development"
    # ساخت خودکار جداول هنگام استارت — فقط مسیر توسعه؛ با false کاملاً خاموش می‌شود
    AUTO_CREATE_ALL: bool = False  # Changed to False for security
    # لاگ کوئری‌های SQL (به‌جای مقدار هاردکدشده‌ی قدیمی)
    DB_ECHO: False  # Disabled by default for performance
    # افشای کد توسعه‌ای (dev_code) در پاسخ API — فقط وقتی روشن باشد؛ وگرنه کد فقط در لاگ سرور
    DEBUG_ALLOW_DEV_CODE: bool = False
    
    # Rate limiting configuration
    RATE_LIMIT_PER_MINUTE: int = 60  # General rate limit
    AUTH_RATE_LIMIT_PER_HOUR: int = 10  # Login attempts per hour
    
    # Security headers
    ENABLE_HSTS: bool = True
    CONTENT_SECURITY_POLICY: str = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"

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
    
    def validate_production_config(self) -> list[str]:
        """Validate critical security settings for production environment."""
        errors = []
        
        if self.APP_ENV == "production":
            if not self.JWT_SECRET or self.JWT_SECRET == "your-super-secret-jwt-key-change-this-in-production":
                errors.append("JWT_SECRET must be set in production environment")
            
            if not self.ADMIN_PASSWORD:
                errors.append("ADMIN_PASSWORD must be set in production environment")
            
            if len(self.JWT_SECRET) < 32:
                errors.append("JWT_SECRET should be at least 32 characters long")
            
            if self.AUTO_CREATE_ALL:
                errors.append("AUTO_CREATE_ALL must be False in production")
        
        return errors

# Initialize settings
settings = Settings()

# Validate production configuration
_validation_errors = settings.validate_production_config()
if _validation_errors:
    import warnings
    for error in _validation_errors:
        warnings.warn(f"⚠️ SECURITY WARNING: {error}", stacklevel=1)
