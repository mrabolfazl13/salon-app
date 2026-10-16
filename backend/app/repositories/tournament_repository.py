# backend/app/repositories/tournament_repository.py
"""دسترسی دادهٔ تورنمنت (P005).

سؤال‌هایی که عمداً در SQL پاسخ می‌شوند (نه در Python):
- براکت یک تورنمنت ← دیدارها با ترتیب (مرحله، position) تا رندر RTL پایدار بماند؛
- «برنده به کدام دیدار می‌رود» ← `next_match_id` از پیش ذخیره شده، پس انتشار
  نتیجه یک UPDATE است نه بازچینی براکت؛
- دیدارهای آماده (دو تیم دارد ولی بازی نشده) تا API لیست «بازی‌های امروز» را
  بدون پیمایش کل جدول بسازد.
"""
from typing import List, Optional

from sqlalchemy import func
from sqlmodel import select

from app.models.tournament import (
    MatchStatus, Tournament, TournamentMatch, TournamentParticipant,
    TournamentParticipantStatus, TournamentRound, TournamentStatus,
)
from app.repositories.base import BaseRepository


class TournamentRepository(BaseRepository[Tournament]):

    def __init__(self, session):
        super().__init__(Tournament, session)

    def search(self, status: Optional[TournamentStatus] = None,
               organizer_id: Optional[int] = None,
               limit: int = 50, offset: int = 0) -> List[Tournament]:
        stmt = select(Tournament)
        if status is not None:
            stmt = stmt.where(Tournament.status == status)
        if organizer_id is not None:
            stmt = stmt.where(Tournament.organizer_id == organizer_id)
        stmt = stmt.order_by(Tournament.starts_at.desc().nulls_last(),
                             Tournament.id.desc()).offset(offset).limit(limit)
        return self.session.exec(stmt).all()

    def count_search(self, status: Optional[TournamentStatus] = None,
                     organizer_id: Optional[int] = None) -> int:
        stmt = select(func.count()).select_from(Tournament)
        if status is not None:
            stmt = stmt.where(Tournament.status == status)
        if organizer_id is not None:
            stmt = stmt.where(Tournament.organizer_id == organizer_id)
        return self.session.exec(stmt).one()


class TournamentParticipantRepository(BaseRepository[TournamentParticipant]):

    def __init__(self, session):
        super().__init__(TournamentParticipant, session)

    def of_tournament(self, tournament_id: int,
                      only_registered: bool = False) -> List[TournamentParticipant]:
        stmt = select(TournamentParticipant).where(
            TournamentParticipant.tournament_id == tournament_id)
        if only_registered:
            stmt = stmt.where(TournamentParticipant.status == TournamentParticipantStatus.REGISTERED)
        stmt = stmt.order_by(TournamentParticipant.seed.asc().nulls_last(),
                             TournamentParticipant.id)
        return self.session.exec(stmt).all()

    def count_registered(self, tournament_id: int) -> int:
        stmt = select(func.count()).select_from(TournamentParticipant).where(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.status == TournamentParticipantStatus.REGISTERED)
        return self.session.exec(stmt).one()

    def get_by_team(self, tournament_id: int, team_id: int) -> Optional[TournamentParticipant]:
        stmt = select(TournamentParticipant).where(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.team_id == team_id)
        return self.session.exec(stmt).first()


class TournamentRoundRepository(BaseRepository[TournamentRound]):

    def __init__(self, session):
        super().__init__(TournamentRound, session)

    def of_tournament(self, tournament_id: int) -> List[TournamentRound]:
        stmt = (select(TournamentRound)
                .where(TournamentRound.tournament_id == tournament_id)
                .order_by(TournamentRound.number))
        return self.session.exec(stmt).all()


class TournamentMatchRepository(BaseRepository[TournamentMatch]):

    def __init__(self, session):
        super().__init__(TournamentMatch, session)

    def bracket(self, tournament_id: int) -> List[TournamentMatch]:
        """کل براکت با ترتیب نمایش: مرحله (پایین→بالا) سپس position (چپ→راست)."""
        stmt = (select(TournamentMatch)
                .join(TournamentRound, TournamentMatch.round_id == TournamentRound.id)
                .where(TournamentMatch.tournament_id == tournament_id)
                .order_by(TournamentRound.number, TournamentMatch.position))
        return self.session.exec(stmt).all()

    def of_round(self, round_id: int) -> List[TournamentMatch]:
        stmt = (select(TournamentMatch)
                .where(TournamentMatch.round_id == round_id)
                .order_by(TournamentMatch.position))
        return self.session.exec(stmt).all()

    def feeders_of(self, match_id: int) -> List[TournamentMatch]:
        """دیدارهایی که برنده‌شان به این دیدار می‌آید (تعداد = ۲، یا ۱ با bye)."""
        stmt = (select(TournamentMatch)
                .where(TournamentMatch.next_match_id == match_id)
                .order_by(TournamentMatch.next_slot))
        return self.session.exec(stmt).all()

    def ready(self, tournament_id: int) -> List[TournamentMatch]:
        """دو تیم دارد و بازی نشده — همان‌هایی که organizer می‌تواند نتیجه ثبت کند."""
        stmt = (select(TournamentMatch)
                .where(TournamentMatch.tournament_id == tournament_id,
                       TournamentMatch.status.in_((MatchStatus.READY, MatchStatus.LIVE)))
                .order_by(TournamentMatch.round_id, TournamentMatch.position))
        return self.session.exec(stmt).all()

    def final_match(self, tournament_id: int) -> Optional[TournamentMatch]:
        """دیدار قهرمانی: بالاترین مرحله و `next_match_id = None`."""
        stmt = (select(TournamentMatch)
                .join(TournamentRound, TournamentMatch.round_id == TournamentRound.id)
                .where(TournamentMatch.tournament_id == tournament_id,
                       TournamentMatch.next_match_id.is_(None))
                .order_by(TournamentRound.number.desc()))
        return self.session.exec(stmt).first()
