# backend/app/models/membership.py
"""اشتراک باشگاه‌های بدنسازی — چون کاربر سانس رزرو نمی‌کند، مدل «پلن» است:
جلسه‌ای / پک چندجلسه‌ای / ماهانه.
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


class PlanType(str, Enum):
    SESSION = "session"            # یک جلسه
    SESSIONS_PACK = "sessions_pack"  # پک چند جلسه‌ای
    MONTHLY = "monthly"            # ماهانه (مدت‌دار)


class PurchaseStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"


class MembershipPlan(SQLModel, table=True):
    __tablename__ = "membership_plans"

    id: Optional[int] = Field(default=None, primary_key=True)
    venue_id: int = Field(foreign_key="venues.id", index=True)
    title: str = Field(max_length=100)
    plan_type: PlanType = Field(default=PlanType.SESSION, index=True)
    price: int = Field(description="قیمت به تومان")
    sessions_count: Optional[int] = Field(default=None, description="تعداد جلسات برای پک")
    duration_days: Optional[int] = Field(default=None, description="اعتبار به روز (برای ماهانه ۳۰)")
    description: Optional[str] = Field(default=None, max_length=300)
    is_active: bool = Field(default=True, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    venue: "Venue" = Relationship(back_populates="plans")
    purchases: List["MembershipPurchase"] = Relationship(back_populates="plan")


class MembershipPurchase(SQLModel, table=True):
    __tablename__ = "membership_purchases"

    id: Optional[int] = Field(default=None, primary_key=True)
    plan_id: int = Field(foreign_key="membership_plans.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    venue_id: int = Field(foreign_key="venues.id", index=True)
    amount: int = Field(description="مبلغ به تومان")
    status: PurchaseStatus = Field(default=PurchaseStatus.PENDING, index=True)
    transaction_id: Optional[str] = Field(default=None, index=True)
    card_pan: Optional[str] = Field(default=None)
    sessions_remaining: Optional[int] = Field(default=None, description="جلسات باقی‌مانده (پک/تکی)")
    starts_at: Optional[datetime] = Field(default=None)
    expires_at: Optional[datetime] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    paid_at: Optional[datetime] = Field(default=None)

    plan: "MembershipPlan" = Relationship(back_populates="purchases")
    user: "User" = Relationship()
    venue: "Venue" = Relationship()
