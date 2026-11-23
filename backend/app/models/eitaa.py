# backend/app/models/eitaa.py
"""کانال ایتای هر سالن + آخرین پست ارسال‌شده.

ایتا (API ایتایار) متد ویرایش/حذف پیام ندارد؛ تنها راه «بهروز کردن» جدول سانس
این است که همان متن دوباره ارسال شود. آخرین `message_id` ذخیره می‌شود تا پست
جدید بهصورت پاسخ (reply) به پست قبلی ارسال شود و دنباله‌ی پیامها قابل دنبال کردن
بماند.
"""
from datetime import date, datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class EitaaChannel(SQLModel, table=True):
    __tablename__ = "eitaa_channels"

    id: Optional[int] = Field(default=None, primary_key=True)
    venue_id: int = Field(foreign_key="venues.id", unique=True, index=True)
    # شناسهی کانال یا username بدون @ — همان چیزی که ایتایار در پنل نشان میدهد
    chat_id: str = Field(max_length=128)
    # توکن خصوصی ایتایار مربوط به پنل کاربر (هرگز در پاسخ API برگردانده نمیشود)
    bot_token: str = Field(max_length=512)
    is_active: bool = Field(default=True)
    pin_updates: bool = Field(default=True)

    # وضعیت آخرین پست موفق — مبنای idempotency تسک روزانه و reply به پست قبلی
    last_post_date: Optional[date] = Field(default=None)
    last_message_id: Optional[int] = Field(default=None)
    last_text: Optional[str] = Field(default=None)
    last_error: Optional[str] = Field(default=None, max_length=500)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
