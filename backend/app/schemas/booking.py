from pydantic import BaseModel, field_serializer
from datetime import datetime, date, time
from enum import Enum
from typing import Optional, List

from app.schemas.payment import PaymentResponse
from app.models.venue import VenuePaymentMode
from app.models.booking import ReceiptStatus
from app.utils.date_helpers import format_persian_date, format_persian_datetime

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

    # روش پرداخت + وضعیت رسید (لیست‌ها سبک: فقط وضعیت + مبلغ)
    payment_mode: Optional[VenuePaymentMode] = None
    needs_receipt: bool = False
    receipt_status: ReceiptStatus = ReceiptStatus.NONE

    # فیلدهای محاسبه‌شده شمسی
    slot_date_persian: Optional[str] = None
    booked_at_persian: Optional[str] = None

    class Config:
        from_attributes = True

    @field_serializer('slot_date')
    def serialize_slot_date(self, slot_date: Optional[date]) -> Optional[str]:
        if slot_date is None:
            return None
        return format_persian_date(slot_date)

    @field_serializer('booked_at')
    def serialize_booked_at(self, booked_at: datetime) -> str:
        return format_persian_datetime(booked_at) or booked_at.isoformat()


class BookingDetailResponse(BookingResponse):
    """جزئیات یک رزرو + آخرین فاکتور پرداخت + فیلدهای کامل رسید"""
    payment: Optional[PaymentResponse] = None
    receipt_amount: Optional[int] = None
    receipt_reference: Optional[str] = None
    receipt_bank: Optional[str] = None
    receipt_image: Optional[str] = None
    receipt_submitted_at: Optional[datetime] = None
    receipt_reviewed_at: Optional[datetime] = None
    receipt_review_note: Optional[str] = None
    receipt_reviewed_by: Optional[int] = None


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

    # اسنپ‌شوت روش پرداخت + وضعیت رسید (برای نمایش در فرانت‌اند)
    payment_mode: Optional[VenuePaymentMode] = None
    needs_receipt: bool = False
    receipt_status: ReceiptStatus = ReceiptStatus.NONE

    class Config:
        from_attributes = True