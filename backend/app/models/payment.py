from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, timezone
from enum import Enum


class BookingPaymentStatus(str, Enum):
    """وضعیت پرداخت یک رزرو (مستقل از PaymentStatus قراردادها)"""
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


class BookingPayment(SQLModel, table=True):
    __tablename__ = "booking_payments"

    id: Optional[int] = Field(default=None, primary_key=True)
    booking_id: int = Field(foreign_key="bookings.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    amount: int
    status: BookingPaymentStatus = Field(default=BookingPaymentStatus.PENDING, index=True)
    gateway: str = Field(default="mock")
    authority: Optional[str] = Field(default=None, index=True)
    transaction_id: Optional[str] = Field(default=None, index=True)
    card_pan: Optional[str] = Field(default=None)  # ۴ رقم آخر کارت
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    paid_at: Optional[datetime] = Field(default=None)
