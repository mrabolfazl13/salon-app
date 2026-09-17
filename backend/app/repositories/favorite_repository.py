# backend/app/repositories/favorite_repository.py
from sqlmodel import Session, select
from typing import List, Optional

from app.models.favorite import FavoriteVenue
from app.repositories.base import BaseRepository


class FavoriteVenueRepository(BaseRepository[FavoriteVenue]):

    def __init__(self, session: Session):
        super().__init__(FavoriteVenue, session)

    def list_for_user(self, user_id: int) -> List[FavoriteVenue]:
        return self.get_all(user_id=user_id, limit=500, order_by="created_at")

    def get_entry(self, user_id: int, venue_id: int) -> Optional[FavoriteVenue]:
        stmt = select(FavoriteVenue).where(
            FavoriteVenue.user_id == user_id,
            FavoriteVenue.venue_id == venue_id,
        )
        return self.session.exec(stmt).first()

    def remove(self, user_id: int, venue_id: int) -> bool:
        entry = self.get_entry(user_id, venue_id)
        if not entry:
            return False
        self.session.delete(entry)
        self.session.flush()
        return True

    def user_ids_subscribed_for(self, venue_id: int) -> List[int]:
        """شنونده‌های فعال دیل‌ها — favorite ∧ notify_deals (fan-out اعلان)."""
        from app.models.user import User
        stmt = select(FavoriteVenue.user_id).join(
            User, User.id == FavoriteVenue.user_id
        ).where(FavoriteVenue.venue_id == venue_id,
                User.notify_deals == True)  # noqa: E712
        return list(self.session.exec(stmt).all())