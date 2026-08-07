from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from app.models.user import User

class Venue(SQLModel, table=True):
    __tablename__ = "venues"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, max_length=100)
    address: str
    latitude: float
    longitude: float
    phone: str = Field(max_length=11)
    description: Optional[str] = None
    amenities: str = Field(default="[]")
    images: str = Field(default="[]")
    is_verified: bool = Field(default=False)
    manager_id: int = Field(foreign_key="users.id")
    club_id: Optional[int] = Field(foreign_key="clubs.id", default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    manager: "User" = Relationship(back_populates="managed_venues")
    slots: List["Slot"] = Relationship(back_populates="venue")
    contracts: List["Contract"] = Relationship(back_populates="venue")
    club: Optional["Club"] = Relationship(back_populates="venues")

class Club(SQLModel, table=True):
    __tablename__ = "clubs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, max_length=100)
    owner_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    venues: List[Venue] = Relationship(back_populates="club")
    owner: User = Relationship()
