# backend/app/schemas/deal.py
from pydantic import BaseModel, Field
from datetime import date, datetime, time
from typing import List, Optional


class DealPublishRequest(BaseModel):
    venue_id: int
    slot_ids: Optional[List[int]] = Field(default=None, description="سانس‌های مشخص")
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    discount_percent: Optional[int] = Field(default=None, ge=1, le=99)
    deal_price: Optional[int] = Field(default=None, gt=0, description="قیمت نهایی ریالی (جایگزین discount_percent)")
    expires_in_minutes: Optional[int] = Field(default=None, ge=1, le=10080)


class DealPublishResponse(BaseModel):
    published: int
    skipped: int
    slot_ids: List[int]
    deal_expires_at: Optional[datetime] = None


class DealAvailableItem(BaseModel):
    slot_id: int
    venue_id: int
    venue_name: str
    slot_date: date
    start_time: time
    duration: int
    original_price: int
    deal_price: int
    savings: int
    discount_percent: int
    deal_expires_at: Optional[datetime] = None
    distance_km: Optional[float] = None