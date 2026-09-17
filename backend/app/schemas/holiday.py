# backend/app/schemas/holiday.py
from pydantic import BaseModel, Field
from datetime import date
from typing import List, Optional


class HolidayCreate(BaseModel):
    holiday_date: date
    name: str = Field(min_length=1, max_length=120)
    is_national: bool = True
    venue_id: Optional[int] = None


class HolidayBulkItem(BaseModel):
    date: date
    name: str = Field(min_length=1, max_length=120)
    is_national: bool = True
    venue_id: Optional[int] = None


class HolidayBulkCreate(BaseModel):
    items: List[HolidayBulkItem]


class HolidayResponse(BaseModel):
    id: int
    holiday_date: date
    name: str
    is_national: bool
    venue_id: Optional[int] = None

    class Config:
        from_attributes = True