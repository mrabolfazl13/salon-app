from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    VENUE_MANAGER = "venue_manager"
    CLUB_ADMIN = "club_admin"
    SUPER_ADMIN = "super_admin"

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    phone: str = Field(unique=True, index=True, max_length=11)
    full_name: str = Field(max_length=100)
    hashed_password: str
    role: UserRole = Field(default=UserRole.USER)
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None
    
    managed_venues: List["Venue"] = Relationship(back_populates="manager")
    bookings: List["Booking"] = Relationship(back_populates="user")
    competitions: List["PriceCompetition"] = Relationship(back_populates="venue_manager")
    contracts: List["Contract"] = Relationship(back_populates="user")
