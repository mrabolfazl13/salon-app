# backend/app/repositories/team_repository.py
"""ریپازیتوری‌های سیستم تیم — الگوی game_repository (چند ریپازیتوری در یک فایل).

قانون: شمارش اعضا همیشه سمت DB با COUNT انجام می‌شود (بدون کش member_count).
"""
import json
from datetime import date, datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import and_, case, func as sa_func, or_
from sqlmodel import Session, col, select

from app.models.team import (
    Team, TeamMember, TeamInvitation, TeamJoinRequest, TeamBooking, TeamDues,
    TeamAuditEvent, TeamMessage, TeamAuditAction, TeamMemberStatus, TeamInvitationStatus,
    TeamJoinRequestStatus,
)
from app.models.user import User
from app.repositories.base import BaseRepository


class TeamRepository(BaseRepository[Team]):

    def __init__(self, session: Session):
        super().__init__(Team, session)

    def get_by_id_with_lock(self, team_id: int) -> Optional[Team]:
        return super().get_by_id_with_lock(team_id)

    def get_one_by_name_for_captain(self, captain_id: int, name: str) -> Optional[Team]:
        stmt = select(Team).where(Team.captain_id == captain_id, Team.name == name)
        return self.session.exec(stmt).first()

    def list_by_member(self, user_id: int,
                       statuses: Tuple[TeamMemberStatus, ...] = (
                           TeamMemberStatus.ACTIVE, TeamMemberStatus.PENDING,
                       )) -> List[Tuple[Team, TeamMember]]:
        """تیم‌های کاربر (قطعی + در انتظار پاسخ) با ردیف عضویت متناظر."""
        stmt = (
            select(Team, TeamMember)
            .join(TeamMember, col(TeamMember.team_id) == col(Team.id))
            .where(TeamMember.user_id == user_id, col(TeamMember.status).in_(list(statuses)))
            .order_by(col(Team.created_at).desc())
        )
        return list(self.session.exec(stmt).all())

    def list_discover(self, search: Optional[str], sport: Optional[str],
                      limit: int, offset: int) -> Tuple[List[Team], int]:
        """تیم‌های publicِ فعال برای کاوش."""
        conds = [Team.is_active == True,  # noqa: E712
                 Team.visibility == "public"]
        if sport:
            conds.append(Team.sport == sport)
        if search:
            conds.append(col(Team.name).ilike(f"%{search.strip()}%"))
        stmt = select(Team).where(and_(*conds)).order_by(col(Team.created_at).desc())
        total = self.session.exec(
            select(sa_func.count()).select_from(stmt.subquery())).one()
        rows = self.session.exec(stmt.offset(offset).limit(limit)).all()
        return list(rows), int(total)


class TeamMemberRepository(BaseRepository[TeamMember]):

    def __init__(self, session: Session):
        super().__init__(TeamMember, session)

    def get_by_team_and_user(self, team_id: int, user_id: int) -> Optional[TeamMember]:
        return self.get_one(team_id=team_id, user_id=user_id)

    def list_by_team(self, team_id: int,
                     statuses: Optional[List[TeamMemberStatus]] = None,
                     ) -> List[Tuple[TeamMember, Optional[str], Optional[str]]]:
        conds = [TeamMember.team_id == team_id]
        if statuses:
            conds.append(col(TeamMember.status).in_([s.value for s in statuses]))
        stmt = (
            select(TeamMember, User.full_name, User.phone)
            .join(User, col(TeamMember.user_id) == col(User.id))
            .where(and_(*conds))
            .order_by(col(TeamMember.joined_at))
        )
        return list(self.session.exec(stmt).all())

    def count_by_status(self, team_id: int,
                        statuses: List[TeamMemberStatus]) -> int:
        stmt = select(sa_func.count()).select_from(TeamMember).where(
            TeamMember.team_id == team_id,
            col(TeamMember.status).in_([s.value for s in statuses]))
        return int(self.session.exec(stmt).one())

    def list_admins(self, team_id: int) -> List[TeamMember]:
        """مدیران فعال: captain + admin — دریافت‌کنندگان اعلان‌های دامنه."""
        stmt = select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.status == TeamMemberStatus.ACTIVE,
            col(TeamMember.role).in_(["captain", "admin"]),
        )
        return list(self.session.exec(stmt).all())

    def count_active_by_team(self, team_ids: List[int]) -> dict:
        """member_count گروهی (بدون N+1) — فقط active."""
        if not team_ids:
            return {}
        stmt = (
            select(TeamMember.team_id, sa_func.count())
            .where(col(TeamMember.team_id).in_(team_ids),
                   TeamMember.status == TeamMemberStatus.ACTIVE)
            .group_by(TeamMember.team_id)
        )
        return {int(tid): int(cnt) for tid, cnt in self.session.exec(stmt).all()}

    def active_user_ids_by_team(self, team_ids: List[int]) -> dict:
        if not team_ids:
            return {}
        stmt = (
            select(TeamMember.team_id, TeamMember.user_id)
            .where(col(TeamMember.team_id).in_(team_ids),
                   TeamMember.status == TeamMemberStatus.ACTIVE)
        )
        out: dict = {}
        for tid, uid in self.session.exec(stmt).all():
            out.setdefault(int(tid), set()).add(int(uid))
        return out

    def teams_of_active_users(self, user_ids: List[int]) -> dict:
        """user_id → set(team_id) برای عضوهای فعال — دامنه تجمیع شریک سالن."""
        if not user_ids:
            return {}
        stmt = (select(TeamMember.user_id, TeamMember.team_id)
                .where(col(TeamMember.user_id).in_(user_ids),
                       TeamMember.status == TeamMemberStatus.ACTIVE))
        out: dict = {}
        for uid, tid in self.session.exec(stmt).all():
            out.setdefault(int(uid), set()).add(int(tid))
        return out

    def active_user_ids(self, team_id: int) -> List[int]:
        stmt = select(TeamMember.user_id).where(
            TeamMember.team_id == team_id,
            TeamMember.status == TeamMemberStatus.ACTIVE,
        )
        return [int(uid) for uid in self.session.exec(stmt).all()]


class TeamInvitationRepository(BaseRepository[TeamInvitation]):

    def __init__(self, session: Session):
        super().__init__(TeamInvitation, session)

    def get_by_team_user(self, team_id: int, user_id: int) -> Optional[TeamInvitation]:
        return self.get_one(team_id=team_id, invitee_user_id=user_id)

    def list_pending_for_user(self, user_id: int) -> List[Tuple[TeamInvitation, str]]:
        """دعوت‌های باز کاربر + نام تیم (برای /teams/invitations/me)."""
        now = datetime.now(timezone.utc)
        stmt = (
            select(TeamInvitation, Team.name)
            .join(Team, col(TeamInvitation.team_id) == col(Team.id))
            .where(
                TeamInvitation.invitee_user_id == user_id,
                TeamInvitation.status == TeamInvitationStatus.PENDING,
                Team.is_active == True,  # noqa: E712
                or_(col(TeamInvitation.expires_at).is_(None),
                    col(TeamInvitation.expires_at) > now),
            )
            .order_by(col(TeamInvitation.created_at).desc())
        )
        return list(self.session.exec(stmt).all())

    def list_by_team(self, team_id: int) -> List[TeamInvitation]:
        stmt = (select(TeamInvitation)
                .where(TeamInvitation.team_id == team_id)
                .order_by(col(TeamInvitation.created_at).desc()))
        return list(self.session.exec(stmt).all())

    def revoke_pending(self, team_id: int, user_id: int) -> None:
        inv = self.get_by_team_user(team_id, user_id)
        if inv and inv.status == TeamInvitationStatus.PENDING:
            inv.status = TeamInvitationStatus.REVOKED
            inv.answered_at = datetime.now(timezone.utc)
            self.session.add(inv)
            self.session.flush()


class TeamJoinRequestRepository(BaseRepository[TeamJoinRequest]):

    def __init__(self, session: Session):
        super().__init__(TeamJoinRequest, session)

    def get_pending_by_user(self, team_id: int, user_id: int) -> Optional[TeamJoinRequest]:
        return self.get_one(team_id=team_id, user_id=user_id,
                            status=TeamJoinRequestStatus.PENDING)

    def list_for_team(self, team_id: int,
                      status: Optional[TeamJoinRequestStatus] = None,
                      ) -> List[Tuple[TeamJoinRequest, Optional[str]]]:
        conds = [TeamJoinRequest.team_id == team_id]
        if status:
            conds.append(TeamJoinRequest.status == status)
        stmt = (
            select(TeamJoinRequest, User.full_name)
            .join(User, col(TeamJoinRequest.user_id) == col(User.id))
            .where(and_(*conds))
            .order_by(TeamJoinRequest.created_at)
        )
        return list(self.session.exec(stmt).all())


class TeamBookingRepository(BaseRepository[TeamBooking]):

    def __init__(self, session: Session):
        super().__init__(TeamBooking, session)

    def get_by_booking_id(self, booking_id: int) -> Optional[TeamBooking]:
        return self.get_one(booking_id=booking_id)

    def list_by_team(self, team_id: int, limit: int, offset: int
                     ) -> Tuple[List[TeamBooking], int]:
        total = self.count(team_id=team_id)
        stmt = (select(TeamBooking)
                .where(TeamBooking.team_id == team_id)
                .order_by(col(TeamBooking.created_at).desc())
                .offset(offset).limit(limit))
        return list(self.session.exec(stmt).all()), int(total)

    def booking_ids_by_teams(self, team_ids: List[int],
                             booking_ids: List[int]) -> dict:
        """team_id → set(booking_id) محدود به رزروهای دامنه — تجمیع شریک سالن."""
        if not team_ids or not booking_ids:
            return {}
        stmt = (select(TeamBooking.team_id, TeamBooking.booking_id)
                .where(col(TeamBooking.team_id).in_(team_ids),
                       col(TeamBooking.booking_id).in_(booking_ids)))
        out: dict = {}
        for tid, bid in self.session.exec(stmt).all():
            out.setdefault(int(tid), set()).add(int(bid))
        return out


class TeamDuesRepository(BaseRepository[TeamDues]):

    def __init__(self, session: Session):
        super().__init__(TeamDues, session)

    def list_by_team(self, team_id: int, status: Optional[str],
                     user_id: Optional[int], limit: int, offset: int
                     ) -> Tuple[List[TeamDues], int]:
        """status: pending|paid|voided|overdue|None=all."""
        conds = [TeamDues.team_id == team_id]
        if user_id is not None:
            conds.append(TeamDues.user_id == user_id)
        if status == "paid":
            conds.append(TeamDues.is_paid == True)  # noqa: E712
        elif status == "voided":
            conds.append(TeamDues.is_voided == True)  # noqa: E712
        elif status == "overdue":
            conds.extend([
                TeamDues.is_paid == False,  # noqa: E712
                TeamDues.is_voided == False,  # noqa: E712
                col(TeamDues.due_date) < date.today(),
            ])
        elif status == "pending":
            conds.extend([
                TeamDues.is_paid == False,  # noqa: E712
                TeamDues.is_voided == False,  # noqa: E712
            ])
        stmt = (select(TeamDues).where(and_(*conds))
                .order_by(col(TeamDues.due_date), col(TeamDues.id)))
        total = int(self.session.exec(
            select(sa_func.count()).select_from(stmt.subquery())).one())
        rows = self.session.exec(stmt.offset(offset).limit(limit)).all()
        return list(rows), total

    def find_unpaid(self, team_id: int, user_id: int, title: str) -> Optional[TeamDues]:
        stmt = select(TeamDues).where(
            TeamDues.team_id == team_id,
            TeamDues.user_id == user_id,
            TeamDues.title == title,
            TeamDues.is_paid == False,  # noqa: E712
        )
        return self.session.exec(stmt).first()

    def status_sums(self, team_id: int) -> dict:
        """تجمیع یک‌کوئریِ مبلغی (ریال) — مبنای balance تیم."""
        active_cond = and_(TeamDues.is_voided == False)  # noqa: E712
        stmt = select(
            sa_func.coalesce(sa_func.sum(case(
                (active_cond, TeamDues.amount), else_=0)), 0),
            sa_func.coalesce(sa_func.sum(case(
                (and_(active_cond, TeamDues.is_paid == True),  # noqa: E712
                 TeamDues.amount), else_=0)), 0),
            sa_func.coalesce(sa_func.sum(case(
                (and_(active_cond, TeamDues.is_paid == False,  # noqa: E712
                      col(TeamDues.due_date) < date.today()),
                 TeamDues.amount), else_=0)), 0),
        ).where(TeamDues.team_id == team_id)
        total, paid, overdue = self.session.exec(stmt).one()
        total, paid = int(total or 0), int(paid or 0)
        return {
            "dues_total": total,
            "dues_paid": paid,
            "dues_unpaid": total - paid,
            "dues_overdue_amount": int(overdue or 0),
        }

    def count_open_for_team(self, team_id: int) -> int:
        """سهم تسویه‌نشده و غیرباطل — شرط صریح برای deactivate."""
        return int(self.session.exec(select(sa_func.count()).select_from(TeamDues).where(
            TeamDues.team_id == team_id,
            TeamDues.is_paid == False,  # noqa: E712
            TeamDues.is_voided == False,  # noqa: E712
        )).one())

    def sum_team_ledger(self, team_id: int) -> dict:
        """حساب تیم از دفتر کل: ردیف‌های counterparty_type=team با counterparty_ref=team_id."""
        from app.models.transaction import (
            CounterpartyType, FinancialTransaction,
            TransactionDirection, TransactionStatus,
        )
        base = [
            FinancialTransaction.counterparty_type == CounterpartyType.TEAM,
            FinancialTransaction.counterparty_ref == team_id,
        ]
        non_voided = and_(*base, FinancialTransaction.status != TransactionStatus.VOIDED)
        stmt = select(
            sa_func.coalesce(sa_func.sum(case(
                (and_(non_voided, FinancialTransaction.direction == TransactionDirection.INCOME),
                 FinancialTransaction.amount), else_=0)), 0),
            sa_func.coalesce(sa_func.sum(case(
                (and_(non_voided, FinancialTransaction.direction == TransactionDirection.EXPENSE),
                 FinancialTransaction.amount), else_=0)), 0),
            sa_func.count(),
        ).where(and_(*base))
        income, expense, count = self.session.exec(stmt).one()
        return {"team_income": int(income or 0), "team_expense": int(expense or 0),
                "team_ledger_rows": int(count or 0)}

    def find_duplicate(self, team_id: int, user_id: int, title: str,
                       due_date: Optional[date] = None) -> Optional[TeamDues]:
        """سهم بازِ هم‌عنوان (و در صورت ارسال، هم‌سررسید) — ضدتکرار generate."""
        conds = [TeamDues.team_id == team_id, TeamDues.user_id == user_id,
                 TeamDues.title == title,
                 TeamDues.is_paid == False,  # noqa: E712
                 TeamDues.is_voided == False]  # noqa: E712
        if due_date:
            conds.append(TeamDues.due_date == due_date)
        stmt = select(TeamDues).where(and_(*conds)).order_by(col(TeamDues.created_at).asc())
        return self.session.exec(stmt).first()


class TeamAuditEventRepository(BaseRepository[TeamAuditEvent]):
    """مخزن رویدادهای ممیزی تیم — فقط‌افزودنی؛ خواندن کرونولوژیک (الگوی contract)."""

    def __init__(self, session: Session):
        super().__init__(TeamAuditEvent, session)

    def log(self, team_id: int, action: TeamAuditAction,
            actor_id: Optional[int] = None, data: Optional[dict] = None) -> TeamAuditEvent:
        return self.create({
            "team_id": team_id,
            "action": action,
            "actor_id": actor_id,
            "data": json.dumps(data or {}, ensure_ascii=False, default=str),
        })

    def list_by_team(self, team_id: int, limit: int, offset: int
                     ) -> Tuple[List[TeamAuditEvent], int]:
        total = self.count(team_id=team_id)
        stmt = (select(TeamAuditEvent)
                .where(TeamAuditEvent.team_id == team_id)
                .order_by(col(TeamAuditEvent.created_at).desc(), col(TeamAuditEvent.id).desc())
                .offset(offset).limit(limit))
        return list(self.session.exec(stmt).all()), int(total)


class TeamMessageRepository(BaseRepository[TeamMessage]):
    """چت تیم — کوئری‌های صفحه‌بندی cursor-based و شمارش خوانده‌نشده."""

    def __init__(self, session: Session):
        super().__init__(TeamMessage, session)

    def list_by_team(self, team_id: int, before_id: Optional[int],
                     limit: int) -> List[TeamMessage]:
        """جدیدترین‌ها اول (id desc)؛ cursor: پیام‌های با id < before_id."""
        conds = [TeamMessage.team_id == team_id]
        if before_id is not None:
            conds.append(col(TeamMessage.id) < before_id)
        stmt = (select(TeamMessage).where(and_(*conds))
                .order_by(col(TeamMessage.id).desc()).limit(limit))
        return list(self.session.exec(stmt).all())

    def unread_count(self, team_id: int, since: Optional[datetime],
                     exclude_user_id: Optional[int] = None) -> int:
        """پیام‌های بعد از since؛ since=None ⇒ همه پیام‌ها خوانده‌نشده."""
        conds = [TeamMessage.team_id == team_id]
        if since is not None:
            conds.append(col(TeamMessage.created_at) > since)
        if exclude_user_id is not None:
            conds.append(col(TeamMessage.user_id) != exclude_user_id)
        stmt = select(sa_func.count()).select_from(TeamMessage).where(and_(*conds))
        return int(self.session.exec(stmt).one())
