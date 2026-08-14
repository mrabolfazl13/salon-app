from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://futsal:secret@localhost:5432/futsal_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET: str = "your-super-secret-jwt-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24
    ADMIN_PHONE: str = "09123456789"
    ADMIN_PASSWORD: str = "admin123"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "tauri://localhost"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

    @classmethod
    def parse_env_var(cls, field_name: str, raw_val: str):
        if field_name == "ALLOWED_ORIGINS":
            return [origin.strip() for origin in raw_val.split(",")]
        return raw_val

settings = Settings()
