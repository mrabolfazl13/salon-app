# backend/app/schemas/customer.py
"""اسکیمای ورودی CRM — پاسخ‌ها دیکشنری ساختارمند (الگوی manager_rows قراردادها)."""
from typing import List, Optional

from pydantic import BaseModel, Field


class CrmCustomerUpdate(BaseModel):
    is_vip: Optional[bool] = None
    tags: Optional[List[str]] = Field(default=None, description="حداکثر ۱۰ برچسب")
    notes: Optional[str] = Field(default=None, max_length=2000)


class ConsentUpdate(BaseModel):
    marketing_consent: bool
    venue_id: Optional[int] = Field(
        default=None, description="None ⇒ روی همه رکوردهای کاربر")


class CampaignCreate(BaseModel):
    venue_id: int
    segment: Optional[str] = Field(
        default=None, max_length=30,
        description="new|regular|vip|at_risk|dormant — یا customer_ids")
    customer_ids: Optional[List[int]] = Field(default=None, max_length=2000)
    title: str = Field(..., min_length=3, max_length=200)
    message: str = Field(..., min_length=3, max_length=1500)
    discount_code: Optional[str] = Field(default=None, max_length=40)