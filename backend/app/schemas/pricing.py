# backend/app/schemas/pricing.py
from pydantic import BaseModel, Field
from datetime import date, time
from typing import List, Optional

from app.models.pricing_rule import ModifierType


class PricingRuleCreate(BaseModel):
    venue_id: int
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)  # date.weekday(): 0=دوشنبه…6=یکشنبه
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    holiday_applies: bool = False
    modifier_type: ModifierType = ModifierType.PERCENT
    value: int
    priority: int = 0
    label: str = Field(default="", max_length=120)
    is_active: bool = True


class PricingRuleUpdate(BaseModel):
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    holiday_applies: Optional[bool] = None
    modifier_type: Optional[ModifierType] = None
    value: Optional[int] = None
    priority: Optional[int] = None
    label: Optional[str] = Field(default=None, max_length=120)
    is_active: Optional[bool] = None


class PricingRuleResponse(BaseModel):
    id: int
    venue_id: int
    day_of_week: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    holiday_applies: bool
    modifier_type: str
    value: int
    priority: int
    is_active: bool
    label: str

    class Config:
        from_attributes = True


class PricingPreviewRequest(BaseModel):
    venue_id: int
    slot_date: date
    start_time: time
    base_price: Optional[int] = Field(default=None, ge=0)
    duration: int = Field(default=90, ge=15, le=240)


class PricingPreviewResponse(BaseModel):
    venue_id: int
    slot_date: date
    start_time: time
    base_price: int
    final_price: int
    is_holiday: bool
    rules: List[dict]