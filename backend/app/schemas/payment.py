from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class PaymentCreate(BaseModel):
    booking_id: int


class PaymentPayRequest(BaseModel):
    card_number: str = Field(..., description="شماره کارت ۱۶ رقمی")
    cvv: str = Field(..., description="CVV2")
    month: Optional[int] = Field(default=None, ge=1, le=12)
    year: Optional[int] = Field(default=None, ge=1300, le=1500)


class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    user_id: int
    amount: int
    status: str
    gateway: str
    authority: Optional[str] = None
    transaction_id: Optional[str] = None
    card_pan: Optional[str] = None
    created_at: datetime
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True
