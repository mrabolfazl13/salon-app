# backend/app/models/membership.py
"""اشتراک باشگاه‌های بدنسازی — چون کاربر سانس رزرو نمی‌کند، مدل «پلن» است:
جلسه‌ای / پک چندجلسه‌ای / ماهانه.
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional, TYPE_CHECKING
from datetime import datetime, timezone
from enum import Enum

if TYPE_CHECKING:  # فقط برای type-check؛ در runtime اجرا نمی‌شود
    from app.models.user import User
    from app.models.venue import Venue

class PlanType(str, Enum):
    SESSION = "session"            # یک جلسه
    SESSIONS_PACK = "sessions_pack"  # پک چند جلسه‌ای
    MONTHLY = "monthly"            # ماهانه (مدت‌دار)


class PurchaseStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"
    # «بازگشت وجه» یک وضعیتِ جدید است، نه تغییرِ ردیفِ درآمد: ردیفِ دفتر کل append-only
    # می‌ماند و یک ردیف refund/expense کنارش می‌نشیند (قراردادِ C7 در رزرو).
    # ستون `status` به‌صورت VARCHAR(20) ذخیره می‌شود، پس این مقدار مهاجرت نمی‌خواهد.
    REFUNDED = "refunded"


class SessionEventType(str, Enum):
    """نوعِ رویدادِ ممیزی — «چه کسی، کِی» برای شمارشِ جلسات و بازگشت وجه."""

    CONSUMED = "consumed"
    REFUNDED = "refunded"


class MembershipPlan(SQLModel, table=True):
    __tablename__ = "membership_plans"

    id: Optional[int] = Field(default=None, primary_key=True)
    venue_id: int = Field(foreign_key="venues.id", index=True)
    title: str = Field(max_length=100)
    plan_type: PlanType = Field(default=PlanType.SESSION, index=True)
    price: int = Field(description="قیمت به ریال (واحدِ همۀ ستون‌های پول در این پروژه)")
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
    amount: int = Field(description="مبلغ به ریال — عیناً در FinancialTransaction.amount می‌نشیند")
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


class MembershipSessionEvent(SQLModel, table=True):
    """ممیزیِ کسر جلسه و بازگشت وجه (گرهٔ C15.5.3).

    ستونِ `sessions_remaining` تنها با یک read-modify-write عوض می‌شد و هیچ‌جا ثبت
    نمی‌شد «چه کسی و کِی» — پس اختلاسِ جلسه قابل اثبات نبود. این جدول append-only است:
    یک ردیف به‌ازای هر اقدام، با actor و شمارندۀ بعد از اقدام.
    """

    __tablename__ = "membership_session_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    purchase_id: int = Field(foreign_key="membership_purchases.id", index=True)
    venue_id: int = Field(foreign_key="venues.id", index=True)
    actor_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    event_type: SessionEventType = Field(index=True)
    sessions_remaining_after: Optional[int] = Field(
        default=None, description="ارزشِ شمارنده بعد از این اقدام (برای بازگشت وجه: 0)")
    amount: Optional[int] = Field(default=None, description="ریال — فقط برای بازگشت وجه")
    detail: Optional[str] = Field(default=None, max_length=200)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
