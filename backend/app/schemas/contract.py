from pydantic import BaseModel, Field
from datetime import date, time
from typing import Optional
from enum import Enum

class RecurrenceType(str, Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"

class ContractCreate(BaseModel):
    venue_id: int
    start_date: date
    end_date: date
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: time
    recurrence: RecurrenceType = RecurrenceType.WEEKLY
    discounted_price: int = Field(..., gt=0)
    description: Optional[str] = None

class ContractResponse(BaseModel):
    id: int
    venue_id: int
    start_date: date
    end_date: date
    day_of_week: int
    start_time: time
    recurrence: RecurrenceType
    original_price: int
    discounted_price: int
    total_amount: int
    status: str
    description: Optional[str]
    
    class Config:
        from_attributes = True

class ContractSessionCancel(BaseModel):
    contract_id: int
    session_date: date
    reason: str
