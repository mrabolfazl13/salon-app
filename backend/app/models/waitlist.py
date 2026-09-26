"""Waitlist model for fully-booked slots."""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class WaitlistEntry(SQLModel, table=True):
    """User waiting for a slot to become available."""
    __tablename__ = "waitlist_entries"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    slot_id: int = Field(foreign_key="slots.id", index=True)
    venue_id: int = Field(foreign_key="venues.id", index=True)
    
    # Position in queue (lower = higher priority)
    position: int = Field(default=0)
    
    # Status: PENDING/NOTIFIED/BOOKED/CANCELLED
    status: str = Field(default="pending")
    
    # When user was notified that slot became available
    notified_at: Optional[datetime] = None
    
    # Expiry time for notification (user has X hours to book)
    expires_at: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
