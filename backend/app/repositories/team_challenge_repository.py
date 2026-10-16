# backend/app/repositories/team_challenge_repository.py
from datetime import datetime, timezone
from typing import List, Optional

from sqlmodel import Session, col, or_, select

from app.models.team_challenge import ChallengeStatus, TeamChallenge
from app.repositories.base import BaseRepository


class TeamChallengeRepository(BaseRepository[TeamChallenge]):

    def __init__(self, session: Session):
        super().__init__(TeamChallenge, session)

    def get_pending_between(self, team_a: int, team_b: int) -> Optional[TeamChallenge]:
        """یک چالش باز بین این دو تیم — در **هر دو جهت**.

        SQL نمی‌تواند «جهت‌ناپذیر» بودن را محدود کند، پس قاعده اینجا خوانده و در
        سرویس رد می‌شود (الگوی تشخیص تعارض شیفت).
        """
        stmt = select(TeamChallenge).where(
            TeamChallenge.status == ChallengeStatus.PENDING,
            or_(
                (col(TeamChallenge.from_team_id) == team_a)
                & (col(TeamChallenge.to_team_id) == team_b),
                (col(TeamChallenge.from_team_id) == team_b)
                & (col(TeamChallenge.to_team_id) == team_a),
            ),
        )
        return self.session.exec(stmt).first()

    def pending_between_any(self, team_ids: List[int]) -> List[TeamChallenge]:
        """چالش‌های بازِ این تیم‌ها (هر دو سمت) — پرچم «چالش باز» در فهرست پیشنهادها."""
        if not team_ids:
            return []
        stmt = select(TeamChallenge).where(
            TeamChallenge.status == ChallengeStatus.PENDING,
            or_(col(TeamChallenge.from_team_id).in_(team_ids),
                col(TeamChallenge.to_team_id).in_(team_ids)),
        )
        return list(self.session.exec(stmt).all())

    def list_for_team(self, team_id: int, status: Optional[ChallengeStatus] = None,
                      direction: str = "all") -> List[TeamChallenge]:
        """صندوق چالش‌های تیم: inbox = به تیم، outbox = از تیم، all = هر دو."""
        sides = {
            "inbox": [col(TeamChallenge.to_team_id) == team_id],
            "outbox": [col(TeamChallenge.from_team_id) == team_id],
            "all": [or_(col(TeamChallenge.to_team_id) == team_id,
                        col(TeamChallenge.from_team_id) == team_id)],
        }[direction]
        conds = list(sides)
        if status is not None:
            conds.append(TeamChallenge.status == status)
        stmt = (select(TeamChallenge).where(*conds)
                .order_by(col(TeamChallenge.created_at).desc(), col(TeamChallenge.id).desc()))
        return list(self.session.exec(stmt).all())

    def stale_pending(self, team_ids: Optional[List[int]] = None) -> List[TeamChallenge]:
        """چالش‌های بازِ گذشته از مهلت — برای انقضای تنبل.

        مقایسه در پایتون انجام می‌شود (الگوی `expires_at` دعوت‌نامه تیم). اندازه‌گیری
        شده: روی این استک SQLite برچسب UTC را **نگه می‌دارد** و مقدار آگاه برمی‌گردد،
        پس `.replace(tzinfo=utc)` فقط محافظ مقدار naive است (مقدار همیشه با
        `datetime.now(timezone.utc)` نوشته می‌شود).
        """
        conds = [TeamChallenge.status == ChallengeStatus.PENDING]
        if team_ids:
            conds.append(or_(col(TeamChallenge.from_team_id).in_(team_ids),
                             col(TeamChallenge.to_team_id).in_(team_ids)))
        rows = list(self.session.exec(select(TeamChallenge).where(*conds)).all())
        now = datetime.now(timezone.utc)
        return [r for r in rows
                if r.expires_at.replace(tzinfo=timezone.utc) < now]
