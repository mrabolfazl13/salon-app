# backend/app/repositories/coach_repository.py
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime

from app.models.coach import CoachSession, CoachSessionStatus
from app.repositories.base import BaseRepository

# لغو‌شده هیچ‌جا در «تضاد زمانی» و «درآمد» شمرده نمی‌شود
_NOT_CANCELLED = (
    CoachSessionStatus.SCHEDULED,
    CoachSessionStatus.ATTENDED,
    CoachSessionStatus.ABSENT,
)


class CoachSessionRepository(BaseRepository[CoachSession]):

    def __init__(self, session: Session):
        super().__init__(CoachSession, session)

    def _window(self, stmt, date_from: Optional[datetime], date_to: Optional[datetime]):
        if date_from is not None:
            stmt = stmt.where(CoachSession.starts_at >= date_from)
        if date_to is not None:
            stmt = stmt.where(CoachSession.starts_at <= date_to)
        return stmt

    def for_coach(self, coach_id: int, status: Optional[CoachSessionStatus] = None,
                  date_from: Optional[datetime] = None, date_to: Optional[datetime] = None,
                  limit: int = 50, offset: int = 0) -> List[CoachSession]:
        stmt = select(CoachSession).where(CoachSession.coach_id == coach_id)
        if status is not None:
            stmt = stmt.where(CoachSession.status == status)
        stmt = self._window(stmt, date_from, date_to)
        stmt = stmt.order_by(CoachSession.starts_at.desc()).offset(offset).limit(limit)
        return self.session.exec(stmt).all()

    def count_for_coach(self, coach_id: int, status: Optional[CoachSessionStatus] = None,
                        date_from: Optional[datetime] = None,
                        date_to: Optional[datetime] = None) -> int:
        from sqlalchemy import func
        stmt = select(func.count()).select_from(CoachSession).where(
            CoachSession.coach_id == coach_id)
        if status is not None:
            stmt = stmt.where(CoachSession.status == status)
        stmt = self._window(stmt, date_from, date_to)
        return self.session.exec(stmt).one()

    def for_client(self, client_id: int, limit: int = 50, offset: int = 0) -> List[CoachSession]:
        stmt = (select(CoachSession)
                .where(CoachSession.client_id == client_id)
                .order_by(CoachSession.starts_at.desc())
                .offset(offset).limit(limit))
        return self.session.exec(stmt).all()

    def count_for_client(self, client_id: int) -> int:
        from sqlalchemy import func
        stmt = select(func.count()).select_from(CoachSession).where(
            CoachSession.client_id == client_id)
        return self.session.exec(stmt).one()


    def overlapping(self, coach_id: int, starts_at: datetime, ends_at: datetime,
                    exclude_id: Optional[int] = None) -> List[CoachSession]:
        """جلساتِ غیرلغوشدهٔ مربی که بازه‌شان با [starts_at, ends_at) هم‌پوشانی دارد."""
        stmt = select(CoachSession).where(
            CoachSession.coach_id == coach_id,
            CoachSession.status.in_(_NOT_CANCELLED),
            CoachSession.starts_at < ends_at,
            CoachSession.ends_at > starts_at,
        )
        if exclude_id is not None:
            stmt = stmt.where(CoachSession.id != exclude_id)
        return self.session.exec(stmt.order_by(CoachSession.starts_at)).all()

    def upcoming(self, coach_id: int, now: datetime, limit: int = 10) -> List[CoachSession]:
        stmt = (select(CoachSession)
                .where(CoachSession.coach_id == coach_id,
                       CoachSession.status == CoachSessionStatus.SCHEDULED,
                       CoachSession.starts_at >= now)
                .order_by(CoachSession.starts_at)
                .limit(limit))
        return self.session.exec(stmt).all()

    def search(self, coach_id: Optional[int] = None, status: Optional[CoachSessionStatus] = None,
               date_from: Optional[datetime] = None, date_to: Optional[datetime] = None,
               limit: int = 50, offset: int = 0) -> List[CoachSession]:
        """جستجوی سراسری (مدیر سیستم) — همان فیلترها بدون مالکیت."""
        stmt = select(CoachSession)
        if coach_id is not None:
            stmt = stmt.where(CoachSession.coach_id == coach_id)
        if status is not None:
            stmt = stmt.where(CoachSession.status == status)
        stmt = self._window(stmt, date_from, date_to)
        stmt = stmt.order_by(CoachSession.starts_at.desc()).offset(offset).limit(limit)
        return self.session.exec(stmt).all()

    def count_search(self, coach_id: Optional[int] = None,
                     status: Optional[CoachSessionStatus] = None,
                     date_from: Optional[datetime] = None,
                     date_to: Optional[datetime] = None) -> int:
        from sqlalchemy import func
        stmt = select(func.count()).select_from(CoachSession)
        if coach_id is not None:
            stmt = stmt.where(CoachSession.coach_id == coach_id)
        if status is not None:
            stmt = stmt.where(CoachSession.status == status)
        stmt = self._window(stmt, date_from, date_to)
        return self.session.exec(stmt).one()

    def client_ids_of(self, coach_id: int) -> List[int]:
        from sqlalchemy import func
        stmt = (select(CoachSession.client_id, func.count().label("n"))
                .where(CoachSession.coach_id == coach_id)
                .group_by(CoachSession.client_id)
                .order_by(func.count().desc()))
        return [row[0] for row in self.session.exec(stmt).all()]
