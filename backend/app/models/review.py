from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime, timezone

if TYPE_CHECKING:  # فقط برای type-check؛ در runtime اجرا نمی‌شود
    from app.models.user import User
    from app.models.venue import Venue

class Review(SQLModel, table=True):
    __tablename__ = "reviews"

    id: Optional[int] = Field(default=None, primary_key=True)
    venue_id: int = Field(foreign_key="venues.id", index=True)
    user_id: int = Field(foreign_key="users.id")
    rating: int = Field(ge=1, le=5, index=True)
    comment: Optional[str] = Field(default=None, max_length=1000)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    venue: "Venue" = Relationship(back_populates="reviews")
    user: "User" = Relationship(back_populates="reviews")
