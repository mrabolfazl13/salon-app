from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, timezone


class Notification(SQLModel, table=True):
    """اعلان کاربران — ذخیره‌شده در دیتابیس + ارسال بلادرنگ عبری WebSocket"""
    __tablename__ = "notifications"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=200)
    message: str = Field(max_length=1000)
    data: Optional[str] = Field(default=None)  # JSON string
    type: str = Field(default="info", index=True)  # booking_confirmed, booking_cancelled, booking_rejected, new_booking, competition, contract, info
    is_read: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
