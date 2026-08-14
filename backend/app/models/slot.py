from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import date, time, datetime, timezone
from enum import Enum

class SlotStatus(str, Enum):
    AVAILABLE = "available"
    BOOKED = "booked"
    BLOCKED = "blocked"
    IN_COMPETITION = "in_competition"

class Slot(SQLModel, table=True):
    __tablename__ = "slots"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    venue_id: int = Field(foreign_key="venues.id")
    slot_date: date
    start_time: time
    duration: int = Field(default=90)
    base_price: int
    current_price: int
    status: SlotStatus = Field(default=SlotStatus.AVAILABLE)
    is_competition_enabled: bool = Field(default=False)
    competition_winner_id: Optional[int] = Field(default=None, foreign_key="price_competitions.id", sa_column_kwargs={"nullable": True})
    is_contract_slot: bool = Field(default=False)
    contract_id: Optional[int] = Field(foreign_key="contracts.id", default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    venue: "Venue" = Relationship(back_populates="slots")
    bookings: List["Booking"] = Relationship(back_populates="slot")
    competitions: List["PriceCompetition"] = Relationship(back_populates="slot", sa_relationship_kwargs={"foreign_keys": "[PriceCompetition.slot_id]"})
    competition_winner: Optional["PriceCompetition"] = Relationship(
        back_populates="winning_slots",
        sa_relationship_kwargs={"foreign_keys": "[Slot.competition_winner_id]"}
    )
    contract_reference: Optional["ContractSlot"] = Relationship(back_populates="slot", )
