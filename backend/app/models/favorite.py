# backend/app/models/favorite.py
"""علاقه‌مندی‌های سمت سرور — جای‌گزین localStorage (فرانت‌اند در اولین بارگذاری
سابقه‌ی محلی خود را POST می‌کند؛ مهاجرت داده لازم نیست)."""
from sqlmodel import SQLModel, Field, UniqueConstraint
from typing import Optional
from datetime import datetime, timezone


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class FavoriteVenue(SQLModel, table=True):
    __tablename__ = "favorite_venues"
    __table_args__ = (
        UniqueConstraint("user_id", "venue_id", name="uq_favorite_user_venue"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    venue_id: int = Field(foreign_key="venues.id", index=True)
    created_at: datetime = Field(default_factory=_utcnow)