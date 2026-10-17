# backend/app/schemas/coupon.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

from app.models.coupon import CouponType


class CouponCreate(BaseModel):
    code: str = Field(min_length=2, max_length=40)
    venue_id: Optional[int] = None
    discount_type: CouponType = CouponType.PERCENT
    value: int = Field(gt=0)
    max_uses: Optional[int] = Field(default=None, ge=1)
    per_user_limit: Optional[int] = Field(default=1, ge=1)
    min_booking_amount: Optional[int] = Field(default=None, ge=0)
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None


class CouponUpdate(BaseModel):
    # soft-disable با is_active=False
    discount_type: Optional[CouponType] = None
    value: Optional[int] = Field(default=None, gt=0)
    max_uses: Optional[int] = Field(default=None, ge=1)
    per_user_limit: Optional[int] = Field(default=None, ge=1)
    min_booking_amount: Optional[int] = Field(default=None, ge=0)
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: Optional[bool] = None


class CouponRedemptionResponse(BaseModel):
    """یک ردیف مصرف — «چه کسی، کِی، چقدر تخفیف گرفت» (گرهٔ C13.3.2).

    `status` از راند ۲۷ همراه می‌آید: `ACTIVE` یعنی مصرفِ زنده، `RELEASED` یعنی
    لغو شده ولی ردیف برای تاریخچه مانده (گرهٔ C22.1).
    """
    id: int
    coupon_id: int
    user_id: int
    user_phone: Optional[str] = None
    user_full_name: Optional[str] = None
    booking_id: Optional[int] = None
    amount_discounted: int
    status: str
    released_at: Optional[datetime] = None
    created_at: datetime

    @classmethod
    def from_row(cls, red, phone: Optional[str], full_name: Optional[str]
                 ) -> "CouponRedemptionResponse":
        return cls(
            id=red.id, coupon_id=red.coupon_id, user_id=red.user_id,
            user_phone=phone, user_full_name=full_name,
            booking_id=red.booking_id, amount_discounted=red.amount_discounted,
            status=str(red.status.value if hasattr(red.status, "value") else red.status),
            released_at=red.released_at,
            created_at=red.created_at,
        )


class CouponResponse(BaseModel):
    id: int
    code: str
    venue_id: Optional[int] = None
    discount_type: str
    value: int
    max_uses: Optional[int] = None
    uses_count: int
    per_user_limit: Optional[int] = None
    min_booking_amount: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: bool
    created_by: Optional[int] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_model(cls, c) -> "CouponResponse":
        return cls(
            id=c.id, code=c.code, venue_id=c.venue_id,
            discount_type=c.discount_type.value if hasattr(c.discount_type, "value") else str(c.discount_type),
            value=c.value, max_uses=c.max_uses, uses_count=c.uses_count,
            per_user_limit=c.per_user_limit, min_booking_amount=c.min_booking_amount,
            valid_from=c.valid_from, valid_until=c.valid_until,
            is_active=c.is_active, created_by=c.created_by,
        )