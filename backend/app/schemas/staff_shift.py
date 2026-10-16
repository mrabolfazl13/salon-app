# backend/app/schemas/staff_shift.py
"""اسکیمای شیفت پرسنل (P020).

`starts_at`/`ends_at` روی سیم naive می‌رسند ⇒ سرویس همان مسیر مربی وقت تهران
می‌داند (app/services/shift_service.py). `duration_min` فقط خروجی است.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ShiftCreate(BaseModel):
    venue_id: int
    user_id: int
    starts_at: datetime
    ends_at: datetime
    notes: Optional[str] = Field(default=None, max_length=500)


class ShiftUpdate(BaseModel):
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    status: Optional[str] = Field(default=None, description="scheduled | done | cancelled")
    notes: Optional[str] = None


class ShiftRow(BaseModel):
    id: int
    venue_id: int
    user_id: int
    user_name: Optional[str] = None
    position: Optional[str] = None
    starts_at: datetime
    ends_at: datetime
    duration_min: int
    status: str
    notes: Optional[str] = None
    created_by: Optional[int] = None


class ShiftListResponse(BaseModel):
    items: List[ShiftRow]
    total: int


class ShiftStaffSummary(BaseModel):
    user_id: int
    user_name: Optional[str] = None
    position: Optional[str] = None
    shifts: int
    scheduled_min: int
    done_min: int
    cancelled: int


class ShiftSummaryResponse(BaseModel):
    venue_id: int
    date_from: datetime
    date_to: datetime
    total_shifts: int
    total_min: int
    per_staff: List[ShiftStaffSummary]
