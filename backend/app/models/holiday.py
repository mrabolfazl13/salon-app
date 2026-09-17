# backend/app/models/holiday.py
"""تقویم مناسبت‌ها — مبنای قوانین قیمت‌گذاری تعطیلی.

venue_id = null یعنی تعطی سراسری (روی همه‌ی سالن‌ها اثر دارد)؛
amount = سالن مشخص فقط همان سالن را درگیر می‌کند.
"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date, datetime, timezone


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Holiday(SQLModel, table=True):
    __tablename__ = "holidays"

    id: Optional[int] = Field(default=None, primary_key=True)
    holiday_date: date = Field(unique=True, index=True)
    name: str = Field(max_length=120)
    is_national: bool = Field(default=True)
    venue_id: Optional[int] = Field(default=None, foreign_key="venues.id", index=True)
    created_at: datetime = Field(default_factory=_utcnow)