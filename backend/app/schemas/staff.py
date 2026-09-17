# backend/app/schemas/staff.py
"""اسکیمای کارکنان + ممیزی امنیتی."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.utils.permissions import StaffPosition


class StaffCreate(BaseModel):
    phone: str = Field(..., min_length=8, max_length=15)
    venue_id: int
    position: StaffPosition
    permissions: Optional[List[str]] = Field(
        default=None, description="لیست کدها برای سفارشی‌سازی؛ خالی = پیش‌فرض موقعیت")


class StaffUpdate(BaseModel):
    position: Optional[StaffPosition] = None
    permissions: Optional[List[str]] = None


class StaffRow(BaseModel):
    id: int
    venue_id: int
    user_id: int
    user_name: Optional[str] = None
    user_phone: Optional[str] = None
    position: str
    permissions: List[str]
    is_custom_permissions: bool
    is_active: bool
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    removed_at: Optional[datetime] = None


class StaffMeRow(BaseModel):
    id: int
    venue_id: int
    venue_name: Optional[str] = None
    position: str
    permissions: List[str]
    is_active: bool


class StaffAuditRow(BaseModel):
    id: int
    actor_id: Optional[int]
    action: str
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    venue_id: Optional[int] = None
    data: dict = {}
    ip: Optional[str] = None
    created_at: Optional[datetime] = None


class StaffAuditListResponse(BaseModel):
    items: List[StaffAuditRow]
    total: int
    limit: int
    offset: int