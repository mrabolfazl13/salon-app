from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime, timezone
from enum import Enum
from app.models.venue import VenuePaymentMode

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

# وضعیت رسید (فیش واریزی) — الگوی VARCHAR-with-Enum-name (مانند finance/teams/games)
class ReceiptStatus(str, Enum):
    NONE = "none"            # هنوز رسیدی ارسال نشده
    SUBMITTED = "submitted"  # کاربر رسید ارسال کرده (در انتظار بررسی مدیر)
    APPROVED = "approved"    # مدیر تأیید کرد و رزرو فعال/پرداخت‌شده شد
    REJECTED = "rejected"    # مدیر رد کرد (کاربر می‌تواند دوباره ارسال کند)


class Booking(SQLModel, table=True):
    __tablename__ = "bookings"

    id: Optional[int] = Field(default=None, primary_key=True)
    slot_id: int = Field(foreign_key="slots.id")
    user_id: int = Field(foreign_key="users.id")
    booked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: BookingStatus = Field(default=BookingStatus.CONFIRMED)
    payment_amount: int
    payment_transaction_id: Optional[str] = None
    # اجزای قیمت سمت سرور — ممیزی بازگشت وجه و گزارش تخفیف
    discount_amount: int = Field(default=0)
    coupon_code: Optional[str] = Field(default=None, max_length=40)
    loyalty_points_used: int = Field(default=0)
    pricing_breakdown: Optional[str] = Field(default=None)  # JSON رشته‌ای

    # روش پرداخت (اسنپ‌شوت از روش سالن در لحظه رزرو) + گردش رسید / پرداخت در محل
    payment_mode: Optional[VenuePaymentMode] = Field(default=None)
    needs_receipt: bool = Field(default=False)
    receipt_status: ReceiptStatus = Field(default=ReceiptStatus.NONE)
    receipt_amount: Optional[int] = Field(default=None)
    receipt_reference: Optional[str] = Field(default=None, max_length=120)
    receipt_bank: Optional[str] = Field(default=None, max_length=100)
    receipt_image: Optional[str] = Field(default=None, max_length=500)
    receipt_submitted_at: Optional[datetime] = Field(default=None)
    receipt_reviewed_at: Optional[datetime] = Field(default=None)
    receipt_review_note: Optional[str] = Field(default=None, max_length=500)
    receipt_reviewed_by: Optional[int] = Field(default=None, foreign_key="users.id")

    slot: "Slot" = Relationship(back_populates="bookings")
    user: "User" = Relationship(back_populates="bookings", sa_relationship_kwargs={"foreign_keys": lambda: [Booking.__table__.c.user_id]})