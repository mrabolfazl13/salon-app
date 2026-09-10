# backend/app/schemas/membership.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class MembershipPlanCreate(BaseModel):
    venue_id: int
    title: str = Field(..., max_length=100, description="عنوان پلن، مثلاً «ماهانه» یا «پک ۱۰ جلسه»")
    plan_type: str = Field(default="session", description="session | sessions_pack | monthly")
    price: int = Field(..., gt=0, description="قیمت به تومان")
    sessions_count: Optional[int] = Field(default=None, ge=1, le=200)
    duration_days: Optional[int] = Field(default=None, ge=1, le=3650)
    description: Optional[str] = Field(default=None, max_length=300)


class MembershipPlanUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=100)
    price: Optional[int] = Field(default=None, gt=0)
    sessions_count: Optional[int] = Field(default=None, ge=1, le=200)
    duration_days: Optional[int] = Field(default=None, ge=1, le=3650)
    description: Optional[str] = Field(default=None, max_length=300)
    is_active: Optional[bool] = None


class MembershipPlanResponse(BaseModel):
    id: int
    venue_id: int
    title: str
    plan_type: str
    price: int
    sessions_count: Optional[int] = None
    duration_days: Optional[int] = None
    description: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MembershipPurchaseCreate(BaseModel):
    plan_id: int


class MembershipPayRequest(BaseModel):
    card_number: str = Field(..., description="شماره کارت ۱۶ رقمی")
    cvv: str = Field(..., description="CVV2")
    month: Optional[int] = Field(default=None, ge=1, le=12)
    year: Optional[int] = Field(default=None, ge=1300, le=1500)


class MembershipPurchaseResponse(BaseModel):
    id: int
    plan_id: int
    user_id: int
    venue_id: int
    plan_title: Optional[str] = None
    plan_type: Optional[str] = None
    venue_name: Optional[str] = None
    amount: int
    status: str
    transaction_id: Optional[str] = None
    card_pan: Optional[str] = None
    sessions_remaining: Optional[int] = None
    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True
