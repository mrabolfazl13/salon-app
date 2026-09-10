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

    # SMTP برای ارسال کد تأیید ایمیل — اگر خالی باشد، حالت توسعه (کد در پاسخ/لاگ برمی‌گردد)
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
