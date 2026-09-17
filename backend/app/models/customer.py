# backend/app/models/customer.py
"""CRM سالن (brief §4) — رکورد مشتری per-venue + کمپین‌های بازاریابی.

- VenueCustomer: حداکثر یک ردیف per (venue_id, user_id)؛ upsert با همان کلید.
  last_visit هرگز ذخیره نمی‌شود — همیشه از رزروها مشتق می‌گردد (table minimal).
- CrmCampaign: تاریخچه‌ی کمپین‌های in-app؛ strict privacy: ارسال فقط به کاربرانِ
  دارای marketing_consent همان سالن؛ سقف روزانه هر سالن از config.
"""
from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint
from typing import Optional
from datetime import datetime, timezone


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class VenueCustomer(SQLModel, table=True):
    __tablename__ = "venue_customers"
    __table_args__ = (
        UniqueConstraint("venue_id", "user_id", name="uq_venue_customer_venue_user"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    venue_id: int = Field(foreign_key="venues.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    is_vip: bool = Field(default=False, index=True)
    tags: str = Field(default="", max_length=500, description="CSV کوچک برچسب‌ها")
    notes: Optional[str] = Field(default=None, max_length=2000)
    marketing_consent: bool = Field(default=False, index=True)
    consent_updated_at: Optional[datetime] = None
    marked_by: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class CrmCampaign(SQLModel, table=True):
    """کمپین بازاریابی سالن — notification این‌اپ نوع crm_campaign."""
    __tablename__ = "crm_campaigns"

    id: Optional[int] = Field(default=None, primary_key=True)
    venue_id: int = Field(foreign_key="venues.id", index=True)
    created_by: Optional[int] = Field(default=None, foreign_key="users.id")
    title: str = Field(max_length=200)
    message: str = Field(max_length=1500)
    discount_code: Optional[str] = Field(default=None, max_length=40)
    segment: Optional[str] = Field(default=None, max_length=30)
    customer_ids: str = Field(default="[]", max_length=2000,
                              description="JSON list مخاطبین انتخابی (اختیاری)")
    sent_count: int = Field(default=0)
    skipped_no_consent: int = Field(default=0)
    created_at: datetime = Field(default_factory=_utcnow, index=True)