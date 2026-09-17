# backend/app/schemas/loyalty.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class LoyaltyPointResponse(BaseModel):
    id: int
    points: int
    reason: str
    source_type: Optional[str] = None
    source_id: Optional[int] = None
    created_at: datetime


class LoyaltyHistoryResponse(BaseModel):
    user_id: int
    balance: int
    point_value_rial: int
    history: List[LoyaltyPointResponse]


class LoyaltyAdjustRequest(BaseModel):
    points: int = Field(description="مثبت=هدیه/شارژ، منفی=کسر دستی")
    note: str = Field(default="", max_length=200)