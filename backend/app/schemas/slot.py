from pydantic import BaseModel
from datetime import date, time
from enum import Enum

class SlotStatus(str, Enum):
    AVAILABLE = "available"
    BOOKED = "booked"
    BLOCKED = "blocked"
    IN_COMPETITION = "in_competition"

class SlotBase(BaseModel):
    venue_id: int
    slot_date: date
    start_time: time
    duration: int = 90
    base_price: int
    current_price: int

class SlotCreate(SlotBase):
    pass

class SlotResponse(SlotBase):
    id: int
    status: SlotStatus
    is_competition_enabled: bool
    
    class Config:
        from_attributes = True
