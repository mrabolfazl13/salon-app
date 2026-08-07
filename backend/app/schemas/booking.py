from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class BookingCreate(BaseModel):
    slot_id: int

class BookingResponse(BaseModel):
    id: int
    slot_id: int
    user_id: int
    booked_at: datetime
    status: BookingStatus
    payment_amount: int
    
    class Config:
        from_attributes = True
