# backend/app/repositories/loyalty_repository.py
from sqlmodel import Session, select, func
from typing import List, Optional

from app.models.loyalty import LoyaltyPoint, LoyaltyReason
from app.repositories.base import BaseRepository


class LoyaltyRepository(BaseRepository[LoyaltyPoint]):

    def __init__(self, session: Session):
        super().__init__(LoyaltyPoint, session)

    def balance(self, user_id: int) -> int:
        stmt = select(func.coalesce(func.sum(LoyaltyPoint.points), 0)).where(
            LoyaltyPoint.user_id == user_id)
        return int(self.session.exec(stmt).one())

    def history(self, user_id: int, limit: int = 50, offset: int = 0) -> List[LoyaltyPoint]:
        return self.get_all(user_id=user_id, limit=limit, offset=offset,
                            order_by="created_at", order_desc=True)

    def has_source(self, user_id: int, reason: LoyaltyReason,
                   source_type: str, source_id: int) -> bool:
        """چک یکتایی منبع — پایه‌ی idempotency جایزه‌ی تکمیل رزرو."""
        stmt = select(LoyaltyPoint).where(
            LoyaltyPoint.user_id == user_id,
            LoyaltyPoint.reason == reason,
            LoyaltyPoint.source_type == source_type,
            LoyaltyPoint.source_id == source_id,
        )
        return self.session.exec(stmt).first() is not None

    def add_points(self, user_id: int, points: int, reason: LoyaltyReason,
                   source_type: Optional[str] = None,
                   source_id: Optional[int] = None) -> Optional[LoyaltyPoint]:
        """درج ردیف با ضدتکرار منبع؛ اگر ردیفی با همان منبع موجود باشد None برمی‌گردد."""
        if points == 0:
            return None
        if source_type and source_id is not None:
            if self.has_source(user_id, reason, source_type, source_id):
                return None
        return self.create({
            "user_id": user_id, "points": points, "reason": reason,
            "source_type": source_type, "source_id": source_id,
        })