from sqlmodel import Session, select, func, delete as sqlmodel_delete
from typing import Optional, List
from app.models.review import Review
from app.repositories.base import BaseRepository

class ReviewRepository(BaseRepository[Review]):

    def __init__(self, session: Session):
        super().__init__(Review, session)

    def get_by_venue(self, venue_id: int, limit: int = 100, offset: int = 0) -> List[Review]:
        return self.get_all(limit=limit, offset=offset, venue_id=venue_id, order_by="created_at", order_desc=True)

    def get_by_user(self, user_id: int, limit: int = 50) -> List[Review]:
        return self.get_all(limit=limit, user_id=user_id, order_by="created_at", order_desc=True)

    def get_user_venue_review(self, user_id: int, venue_id: int) -> Optional[Review]:
        """بررسی اینکه کاربر قبلاً برای این سالن نظر داده است"""
        return self.get_one(user_id=user_id, venue_id=venue_id)

    def get_rating_summary(self, venue_id: int) -> dict:
        """محاسبه میانگین امتیاز و تعداد نظرات یک سالن"""
        row = self.session.exec(
            select(
                func.count(Review.id),
                func.coalesce(func.avg(Review.rating), 0.0)
            ).where(Review.venue_id == venue_id)
        ).one()
        total = row[0]
        average = round(float(row[1]), 2) if row[1] is not None else 0.0
        return {"venue_id": venue_id, "average_rating": average, "total_reviews": total}

    def get_ratings_for_venues(self, venue_ids: List[int]) -> dict:
        """محاسبه میانگین امتیاز برای لیستی از سالن‌ها (برای لیست سالن‌ها)"""
        if not venue_ids:
            return {}
        rows = self.session.exec(
            select(Review.venue_id, func.count(Review.id), func.coalesce(func.avg(Review.rating), 0.0))
            .where(Review.venue_id.in_(venue_ids))
            .group_by(Review.venue_id)
        ).all()
        result = {}
        for venue_id, total, avg in rows:
            result[venue_id] = {"average_rating": round(float(avg), 2), "total_reviews": total}
        return result

    def delete(self, review_id: int) -> bool:
        """حذف یک نظر"""
        self.session.exec(sqlmodel_delete(Review).where(Review.id == review_id))
        return True
