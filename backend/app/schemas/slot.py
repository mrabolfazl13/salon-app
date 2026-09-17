from pydantic import BaseModel
from datetime import date, datetime, time
from enum import Enum
from typing import Optional

class SlotStatus(str, Enum):
    AVAILABLE = "available"
    BOOKED = "booked"
    BLOCKED = "blocked"
    IN_COMPETITION = "in_competition"
    RESERVED = "reserved"

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
    is_contract_slot: bool = False
    # Open-slot deal (bazar-e lahze-avvali) — frontend deal chips
    is_deal: bool = False
    deal_price: Optional[int] = None
    deal_expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class SlotBlockResponse(BaseModel):
    """پایان block/unblock سانس — پاسخ تایپ‌شده یکسان برای هر دو مسیر."""
    slot_id: int
    venue_id: int
    status: SlotStatus
