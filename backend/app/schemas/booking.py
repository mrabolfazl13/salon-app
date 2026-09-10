from pydantic import BaseModel
from datetime import datetime, date, time
from enum import Enum
from typing import Optional

from app.schemas.payment import PaymentResponse

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class BookingCreate(BaseModel):
    slot_id: int

class BookingResponse(BaseModel):
    id: int
    slot_id: int
    user_id: int
    booked_at: datetime
    status: BookingStatus
    payment_amount: int

    # اطلاعات تکمیلی سانس و سالن (اختیاری؛ برای نمایش بهتر در فرانت‌ند)
    venue_name: Optional[str] = None
    slot_date: Optional[date] = None
    start_time: Optional[time] = None
    duration: Optional[int] = None

    class Config:
        from_attributes = True


class BookingDetailResponse(BookingResponse):
    """جزئیات یک رزرو + آخرین فاکتور پرداخت"""
    payment: Optional[PaymentResponse] = None


class PendingBookingResponse(BaseModel):
    """رزرو در انتظار تأیید مدیر سالن (در Redis نگه داشته می‌شود)"""
    id: str
    slot_id: int
    user_id: int
    booked_at: datetime
    status: str = "pending"
    payment_amount: int
    expires_at: Optional[datetime] = None

    # اطلاعات تکمیلی سانس و سالن
    venue_name: Optional[str] = None
    slot_date: Optional[date] = None
    start_time: Optional[time] = None
    duration: Optional[int] = None

    class Config:
        from_attributes = True
