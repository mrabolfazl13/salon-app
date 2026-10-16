# backend/app/models/coach.py
"""نقش مربی (P004) — جلسات تمرینی مربی/شاگرد با ثبت حضور و غیاب و شهریه.

روش‌های طراحی (مستند، چون بقیهٔ فیچرها این انتخاب‌ها را دارند):
- `coach_id` و `client_id` هر دو به `users.id` می‌چسبند؛ مربی یک *کاربر* با
  `role=coach` است (نه موجودیت جدا) ⇒ لاگین/توکن/پروفایل از همین مسیرِ موجود
  می‌آید و مهاجرت جدا برای «حساب مربی» لازم نیست.
- `slot_id` اختیاری است: اگر جلسه روی یک سانس واقعیِ سالن رزرو شده باشد، لینک
  می‌خورد تا تقویم مربی با رزرو هم‌خوان بماند؛ ولی جلسه می‌تواند خارج از
  سیستم رزرو (مثلاً زمین بیرونی) ثبت شود.
- تضاد زمانی (یک مربی هم‌زمان دو جلسه) در سرویس چک می‌شود، نه با قید یکتایی:
  بازه‌های زمانی با هم هم‌پوشانی دارند و این در DB قابل‌بیان نیست. برای همین
  `ends_at` یک ستون واقعی است که سرویس با `set_window()` می‌سازد (نه computed
  ستون: حساب `+ INTERVAL` روی SQLite و PostgreSQL یکی نیست).
- `status` فقط چهار مقدار بسته؛ `attended_at`/`marked_by` ممیزی ثبت حضور است
  (چه کسی و چه زمانی حضور/غیبت را علامت زده).
- تاریخ‌ها همیشه tz-aware (SQLModel `UTCDateTime` با naive مقدار می‌سوزد).
"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, timedelta, timezone
from enum import Enum


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class CoachSessionStatus(str, Enum):
    SCHEDULED = "scheduled"
    ATTENDED = "attended"
    ABSENT = "absent"
    CANCELLED = "cancelled"


class CoachSession(SQLModel, table=True):
    __tablename__ = "coach_sessions"

    id: Optional[int] = Field(default=None, primary_key=True)
    coach_id: int = Field(foreign_key="users.id", index=True)
    client_id: int = Field(foreign_key="users.id", index=True)
    venue_id: Optional[int] = Field(default=None, foreign_key="venues.id", index=True)
    slot_id: Optional[int] = Field(default=None, foreign_key="slots.id", index=True)

    starts_at: datetime = Field(index=True)
    ends_at: datetime = Field(index=True,
                              description="تاریخ پایان؛ با set_window به‌روز می‌شود "
                                          "(ستون واقعی تا هم SQLite و هم PG بتوانند "
                                          "هم‌پوشانی را در SQL مقایسه کنند)")
    duration_min: int = Field(default=60, ge=15, le=480)
    status: CoachSessionStatus = Field(default=CoachSessionStatus.SCHEDULED, index=True)

    fee: int = Field(default=0, ge=0, description="شهریه به ریال")
    fee_settled: bool = Field(default=False)
    notes: Optional[str] = Field(default=None, max_length=500)

    attended_at: Optional[datetime] = Field(default=None)
    marked_by: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    def set_window(self, starts_at: datetime, duration_min: int) -> None:
        """تک‌منبع تنظیم بازه: `ends_at` هیچ‌جا جدا از `starts_at` نوشته نمی‌شود."""
        self.starts_at = starts_at
        self.duration_min = duration_min
        self.ends_at = starts_at + timedelta(minutes=duration_min)
