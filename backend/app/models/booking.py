from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime, timezone
from enum import Enum

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class Booking(SQLModel, table=True):
    __tablename__ = "bookings"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    slot_id: int = Field(foreign_key="slots.id")
    user_id: int = Field(foreign_key="users.id")
    booked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: BookingStatus = Field(default=BookingStatus.CONFIRMED)
    payment_amount: int
    payment_transaction_id: Optional[str] = None
    
    slot: "Slot" = Relationship(back_populates="bookings")
    user: "User" = Relationship(back_populates="bookings")
