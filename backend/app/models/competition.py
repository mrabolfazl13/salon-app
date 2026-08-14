from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum

class CompetitionStatus(str, Enum):
    ACTIVE = "active"
    WON = "won"
    LOST = "lost"
    EXPIRED = "expired"

class PriceCompetition(SQLModel, table=True):
    __tablename__ = "price_competitions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    slot_id: int = Field(foreign_key="slots.id")
    venue_id: int = Field(foreign_key="venues.id")
    venue_manager_id: int = Field(foreign_key="users.id")
    offered_price: int
    status: CompetitionStatus = Field(default=CompetitionStatus.ACTIVE)
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    slot: "Slot" = Relationship(
        back_populates="competitions",
        sa_relationship_kwargs={"foreign_keys": "[PriceCompetition.slot_id]"}
    )
    venue: "Venue" = Relationship()
    venue_manager: "User" = Relationship(back_populates="competitions")
    winning_slots: List["Slot"] = Relationship(
        back_populates="competition_winner",
        sa_relationship_kwargs={"foreign_keys": "[Slot.competition_winner_id]"}
    )
