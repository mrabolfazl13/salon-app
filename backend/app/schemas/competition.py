from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class CompetitionStatus(str, Enum):
    ACTIVE = "active"
    WON = "won"
    LOST = "lost"
    EXPIRED = "expired"

class CompetitionCreate(BaseModel):
    slot_id: int
    offered_price: int

class CompetitionBid(BaseModel):
    offered_price: int

class CompetitionResponse(BaseModel):
    id: int
    slot_id: int
    venue_id: int
    offered_price: int
    status: CompetitionStatus
    expires_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True
