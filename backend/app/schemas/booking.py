from pydantic import BaseModel
from datetime import datetime, date, time
from enum import Enum
from typing import Optional, List

from app.schemas.payment import PaymentResponse

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class BookingCreate(BaseModel):
    slot_id: int
    # هیچ فیلد قیمتی از کلاینت پذیرفته نمی‌شود — فقط ارجاع به کوپن/امتیاز
    discount_code: Optional[str] = None
    use_loyalty_points: bool = False

class BookingResponse(BaseModel):
    id: int
    slot_id: int
    user_id: int
    booked_at: datetime
    status: BookingStatus
    payment_amount: int

    # اطلاعات تکمیلی سانس و سالن (اختیاری؛ برای نمایش بهتر در فرانت‌ند)
    venue_name: Optional[str] = None
    venue_images: List[str] = []
    slot_date: Optional[date] = None
    start_time: Optional[time] = None
    duration: Optional[int] = None

    # اجزای تخفیف سمت سرور
    discount_amount: int = 0
    coupon_code: Optional[str] = None
    loyalty_points_used: int = 0
    pricing_breakdown: Optional[List[dict]] = None

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
    venue_images: List[str] = []
    slot_date: Optional[date] = None
    start_time: Optional[time] = None
    duration: Optional[int] = None

    discount_amount: int = 0
    coupon_code: Optional[str] = None
    loyalty_points_used: int = 0
    pricing_breakdown: Optional[List[dict]] = None

    class Config:
        from_attributes = True
