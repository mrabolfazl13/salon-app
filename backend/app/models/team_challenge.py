# backend/app/models/team_challenge.py
"""چالش بازی بین دو تیم (P010 / C4.2).

چرا جدول تازه و نه `Game`: `Game` کاربرمحور است (`booking_id` یکتا، شرکت‌کننده‌ها
`user_id` و بدون `team_id`)؛ مسابقۀ تیم‌با‌تیم فقط در `TournamentMatch` وجود دارد که
به تورنمنت گره خورده. چالش پیش از آن می‌آید: توافق دو کاپیتان روی «بازی کنیم»، بعد
رزرو/بازی ساخته می‌شود.

تصمیم‌های طراحی:
- ردیفِ «در انتظار» برای هر جفت، در هر دو جهت، یکتاست؛ اما محدودیت SQL نمی‌تواند
  جهت را یکی بداند، پس قاعده در سرویس (`get_pending_between`) نگه داشته می‌شود — مثل
  تشخیص تعارض شیفت.
- `expires_at` تنبل منقضی می‌شود: همان لحظه که فهرست/پاسخ/read رخ می‌دهد وضعیت به
  `EXPIRED` می‌رود (job جدا نمی‌خواهد؛ پاسخ پس از مهلت ⇒ ۴۱۰).
- سالن/زمان پیشنهادی اسنپ‌شات‌اند و هیچ رزروی نمی‌سازند؛ پذیرش فقط توافق را ثبت می‌کند
  تا جریان رزرو (که پرداخت و ظرفیت دارد) مسئولش بماند.
- هر دو `team_id` FK به `teams` با نام‌های صریح، چون یک جدول دو ستون هم‌جدول دارد.
"""
from datetime import date, datetime, time, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ChallengeStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    CANCELLED = "cancelled"      # فرستنده پیش از پاسخ پس گرفت
    EXPIRED = "expired"          # بی‌پاسخ ماندن تا مهلت


class TeamChallenge(SQLModel, table=True):
    __tablename__ = "team_challenges"

    id: Optional[int] = Field(default=None, primary_key=True)
    from_team_id: int = Field(foreign_key="teams.id", index=True)
    to_team_id: int = Field(foreign_key="teams.id", index=True)

    # امضاکنندۀ چالش (کاپیتان/مدیر تیم فرستنده) — شناسه از توکن، نه body
    created_by: int = Field(foreign_key="users.id", index=True)
    accepted_by: Optional[int] = Field(default=None, foreign_key="users.id")
    responded_at: Optional[datetime] = None

    message: Optional[str] = Field(default=None, max_length=300)
    response_note: Optional[str] = Field(default=None, max_length=300)

    # پیشنهاد (غیرالزامی) — فقط برای گفت‌وگو؛ رزرو نمی‌سازد
    proposed_date: Optional[date] = None
    proposed_time: Optional[time] = None
    proposed_venue_id: Optional[int] = Field(default=None, foreign_key="venues.id")

    status: ChallengeStatus = Field(default=ChallengeStatus.PENDING, index=True)
    expires_at: datetime = Field(default_factory=_utcnow, index=True)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
