# backend/app/models/staff_shift.py
"""شیفت پرسنل (P020) — برنامه‌ریزی زمان‌بندی به‌جای دفتر دستی.

تصمیم‌های طراحی (مستند، چون بقیهٔ فیچرها این انتخاب‌ها را دارند):
- کلید تضاد **شخص** است نه سالن: `user_id` بدون محدودیت به `venue_id`. یک نفر
  می‌تواند در دو سالن انتصاب فعال داشته باشد و واقعاً نمی‌تواند هم‌زمان در هر دو
  حاضر شود ⇒ تضاد در سرویس روی `user_id` سراسری چک می‌شود.
- هیچ FK به `staff_assignments` نداریم: شیفت باید بعد از حذف نرم انتصاب هم باقی
  بماند (سابقهٔ کاری/حقوق). به‌جای FK، سرویس هنگام ساخت «انتصاب فعال در همان
  سالن» را با `uow.staff.get_active()` الزامی می‌کند.
- مدت ذخیره نمی‌شود: مثل `CoachSession.set_window` فقط `starts_at`/`ends_at`
  نوشته می‌شوند و `duration_min` از همان بازه خوانده می‌شود ⇒ هرگز دو منبع
  هم‌زمان ندارند.
- `ends_at` ستون واقعی است نه computed: مقایسهٔ هم‌پوشانی باید در SQL کار کند
  و `+ INTERVAL` روی SQLite و PostgreSQL یکی نیست (الگوی coach.py).
- تضاد با قید یکتایی در DB قابل‌بیان نیست (بازه‌ها)، پس همان راه مربی: four-way
  comparison در سرویس + ایندکس روی دو ستون بازه.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ShiftStatus(str, Enum):
    SCHEDULED = "scheduled"
    DONE = "done"
    CANCELLED = "cancelled"


class StaffShift(SQLModel, table=True):
    __tablename__ = "staff_shifts"

    id: Optional[int] = Field(default=None, primary_key=True)
    venue_id: int = Field(foreign_key="venues.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    starts_at: datetime = Field(index=True)
    ends_at: datetime = Field(index=True,
                              description="پایان شیفت؛ همیشه بعد از starts_at "
                                          "(تضاد در SQL مقایسه می‌شود)")
    status: ShiftStatus = Field(default=ShiftStatus.SCHEDULED, index=True)

    notes: Optional[str] = Field(default=None, max_length=500)
    created_by: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    @property
    def duration_min(self) -> int:
        """دقیقهٔ کاری از همان بازهٔ ذخیره‌شده (منبع تکی: starts_at/ends_at)."""
        return int((self.ends_at - self.starts_at).total_seconds() // 60)
