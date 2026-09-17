from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
from app.models.user import User

# روش پرداخت سالن — الگوی VARCHAR-with-Enum-name (مانند finance/teams/games):
# ستون در DB به‌صورت VARCHAR ساخته می‌شود و اپلیکیشن مقدار را بر اساس NAME عضو
# می‌نویسد؛ در پاسخ‌های API بر اساس value خارج می‌شود (gateway|bank_receipt|pay_in_place).
class VenuePaymentMode(str, Enum):
    GATEWAY = "gateway"              # پرداخت آنلاین از درگاه (رفتار فعلی)
    BANK_RECEIPT = "bank_receipt"    # فیش واریزی (پیش‌فرض)
    PAY_IN_PLACE = "pay_in_place"    # پرداخت نقدی در محل


class Venue(SQLModel, table=True):
    __tablename__ = "venues"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, max_length=100)
    category: str = Field(default="futsal", index=True, max_length=20)  # futsal | gym
    address: str
    latitude: float
    longitude: float
    phone: Optional[str] = Field(default=None, max_length=11)
    description: Optional[str] = None
    amenities: str = Field(default="[]")
    images: str = Field(default="[]")
    is_verified: bool = Field(default=False)
    manager_id: int = Field(foreign_key="users.id")
    club_id: Optional[int] = Field(foreign_key="clubs.id", default=None)
    # مبنای پیش‌فرض قیمت سانس برای تولید خودکار + موتور قیمت (null ⇒ config.DEFAULT_SLOT_PRICE)
    default_slot_price: Optional[int] = Field(default=None)
    payment_mode: VenuePaymentMode = Field(default=VenuePaymentMode.BANK_RECEIPT)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    manager: "User" = Relationship(back_populates="managed_venues")
    slots: List["Slot"] = Relationship(back_populates="venue")
    contracts: List["Contract"] = Relationship(back_populates="venue")
    club: Optional["Club"] = Relationship(back_populates="venues")
    reviews: List["Review"] = Relationship(back_populates="venue")
    plans: List["MembershipPlan"] = Relationship(back_populates="venue")

class Club(SQLModel, table=True):
    __tablename__ = "clubs"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, max_length=100)
    owner_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    venues: List[Venue] = Relationship(back_populates="club")
    owner: User = Relationship()