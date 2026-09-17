# backend/app/models/pricing_rule.py
"""قانون قیمت‌گذاری — موتور قیمت سمت سرور (منبع اقتدار قیمت).

قراردادها:
- day_of_week: همان مقدار date.weekday() پایتون (0=دوشنبه … 6=یکشنبه).
- holiday_applies=True: قانون فقط در روز تعطیل اجرا می‌شود و در آن روز شرط
  day_of_week نادیده گرفته می‌شود (تعطیل الگوی هفته را جابه‌جا می‌کند).
- holiday_applies=False: قانون در روز تعطیل هرگز اجرا نمی‌شود.
- پنجره‌ی زمانی: start_time/end_time با بازه‌ی سانس [start, start+duration)
  همپوشانی داشته باشند (peak/off-peak).
- modifier: percent = مقدار×۱۰۰ (۱۲٪ ⇒ 1200؛ منفی ⇒ تخفیف)،
  fixed = ریال با علامت، absolute = جایگزین کامل قیمت.
- اعمال: همه‌ی قوانین منطبق به ترتیب priority صعودی؛ اولویت بالاتر آخر
  اعمال می‌شود و برنده است.
"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import time, datetime, timezone
from enum import Enum


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ModifierType(str, Enum):
    PERCENT = "percent"
    FIXED = "fixed"
    ABSOLUTE = "absolute"


class PricingRule(SQLModel, table=True):
    __tablename__ = "pricing_rules"

    id: Optional[int] = Field(default=None, primary_key=True)
    venue_id: int = Field(foreign_key="venues.id", index=True)
    day_of_week: Optional[int] = Field(default=None)   # 0..6 (date.weekday) — null=هر روز
    start_time: Optional[time] = Field(default=None)   # پنجره‌ی زمانی سانس
    end_time: Optional[time] = Field(default=None)
    holiday_applies: bool = Field(default=False)
    modifier_type: ModifierType = Field(default=ModifierType.PERCENT)
    value: int = Field(description="percent×100 | fixed Rials (signed) | absolute Rials")
    priority: int = Field(default=0)
    is_active: bool = Field(default=True, index=True)
    label: str = Field(default="", max_length=120)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)