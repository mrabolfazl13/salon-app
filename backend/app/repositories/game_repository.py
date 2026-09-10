# backend/app/repositories/game_repository.py
"""ریپازیتوری‌های سیستم بازی گروهی.

الگو: چند ریپازیتوری در یک فایل (مثل contract_repository.py).
نکته کلیدی: شمارش شرکت‌کننده‌ها همیشه سمت سرور و داخل ترنزکشن انجام می‌شود؛
صفحه بازی هرگز به شمارش کلاینت اعتماد نمی‌کند.
"""
from sqlmodel import Session, select, func, col
from datetime import date, datetime, time, timezone
from typing import Optional, List, Tuple
from sqlalchemy import and_, or_

from app.models.game import (
    Game, GameParticipant, GameJoinRequest, GameInvitation,
    GameInviteLink, GameWaitlist, GamePayment,
    GameStatus, GameVisibility, ParticipantStatus, JoinRequestStatus,
    InvitationStatus, WaitlistStatus, GamePaymentStatus,
)
from app.models.booking import Booking
from app.models.slot import Slot
from app.models.venue import Venue
from app.models.user import User
from app.repositories.base import BaseRepository


class GameRepository(BaseRepository[Game]):

    def __init__(self, session: Session):
        super().__init__(Game, session)

    def get_by_booking_id(self, booking_id: int) -> Optional[Game]:
        return self.get_one(booking_id=booking_id)

    def get_by_id_with_lock(self, game_id: int) -> Optional[Game]:
        """SELECT ... FOR UPDATE — پایه‌ی ایمنی race condition در join/leave."""
        return super().get_by_id_with_lock(game_id)

    def count_accepted_players(self, game_id: int) -> int:
        """شمارش شرکت‌کننده‌های قطعی (accepted)."""
        statement = select(func.count()).select_from(GameParticipant).where(
            GameParticipant.game_id == game_id,
            GameParticipant.status == ParticipantStatus.ACCEPTED,
        )
        return self.session.exec(statement).one()

    def accepted_counts_by_game(self, game_ids: List[int]) -> dict:
        """شمارش گروهی accepted برای چند بازی (برای لیست explore — بدون N+1)."""
        if not game_ids:
            return {}
        statement = (
            select(GameParticipant.game_id, func.count())
            .where(
                col(GameParticipant.game_id).in_(game_ids),
                GameParticipant.status == ParticipantStatus.ACCEPTED,
            )
            .group_by(GameParticipant.game_id)
        )
        return {gid: cnt for gid, cnt in self.session.exec(statement).all()}

    def list_explore(
        self,
        sport: Optional[str] = None,
        skill_level: Optional[str] = None,
        venue_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        time_from: Optional[time] = None,
        time_to: Optional[time] = None,
        max_price_per_player: Optional[int] = None,
        availability_only: bool = False,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[Tuple[Game, Booking, Slot, Venue]], int]:
        """بازی‌های عمومی قابل‌کشف با فیلترها.

        بازگشت: ردیف‌های (Game, Booking, Slot, Venue) + تعداد کل.
        بازی‌های private هرگز در این لیست ظاهر نمی‌شوند.
        """
        conditions = [
            Game.visibility.in_([GameVisibility.PUBLIC, GameVisibility.PUBLIC_APPROVAL]),
            Game.status.in_([GameStatus.OPEN, GameStatus.FULL]),
        ]
        if sport:
            conditions.append(Game.sport == sport)
        if skill_level:
            conditions.append(Game.skill_level == skill_level)
        if venue_id:
            conditions.append(Slot.venue_id == venue_id)
        if date_from:
            conditions.append(Slot.slot_date >= date_from)
        if date_to:
            conditions.append(Slot.slot_date <= date_to)
        if time_from:
            conditions.append(Slot.start_time >= time_from)
        if time_to:
            conditions.append(Slot.start_time <= time_to)
        if max_price_per_player is not None:
            # سهم هر نفر = هزینه زمین / ظرفیت (سقفی؛ دقیق‌تر در سرویس)
            conditions.append(Booking.payment_amount <= max_price_per_player * Game.max_players)
        if availability_only:
            # فقط بازی‌های جا‌دار — با زیرکوئری شمارش accepted
            accepted_sq = (
                select(func.count()).select_from(GameParticipant)
                .where(
                    GameParticipant.game_id == col(Game.id),
                    GameParticipant.status == ParticipantStatus.ACCEPTED,
                )
                .correlate(Game)
                .scalar_subquery()
            )
            conditions.append(accepted_sq < Game.max_players)

        base = (
            select(Game, Booking, Slot, Venue)
            .join(Booking, col(Game.booking_id) == col(Booking.id))
            .join(Slot, col(Booking.slot_id) == col(Slot.id))
            .join(Venue, col(Slot.venue_id) == col(Venue.id))
            .where(and_(*conditions))
        )

        count_stmt = select(func.count()).select_from(base.subquery())
        total = self.session.exec(count_stmt).one()

        # مرتب‌سازی پیش‌فرض: نزدیک‌ترین زمان؛ مرتب‌سازی‌های دیگر در سرویس
        statement = base.order_by(col(Slot.slot_date), col(Slot.start_time)).offset(offset).limit(limit)
        rows = self.session.exec(statement).all()
        return list(rows), total

    def list_by_organizer(self, user_id: int) -> List[Game]:
        statement = (
            select(Game)
            .where(Game.organizer_id == user_id)
            .order_by(col(Game.created_at).desc())
        )
        return list(self.session.exec(statement).all())

    def list_by_participant(self, user_id: int) -> List[Game]:
        """بازی‌هایی که کاربر در آن‌ها شرکت‌کننده (غیر از left/removed) است."""
        statement = (
            select(Game)
            .join(GameParticipant, col(GameParticipant.game_id) == col(Game.id))
            .where(
                GameParticipant.user_id == user_id,
                GameParticipant.status.in_([
                    ParticipantStatus.INVITED,
                    ParticipantStatus.PENDING,
                    ParticipantStatus.ACCEPTED,
                ]),
            )
            .order_by(col(Game.created_at).desc())
        )
        return list(self.session.exec(statement).all())


class GameParticipantRepository(BaseRepository[GameParticipant]):

    def __init__(self, session: Session):
        super().__init__(GameParticipant, session)

    def get_by_game_and_user(self, game_id: int, user_id: int) -> Optional[GameParticipant]:
        return self.get_one(game_id=game_id, user_id=user_id)

    def list_by_game(self, game_id: int) -> List[Tuple[GameParticipant, Optional[str]]]:
        """لیست شرکت‌کننده‌ها + نام کاربر (برای صفحه جزئیات)."""
        statement = (
            select(GameParticipant, User.full_name)
            .join(User, col(GameParticipant.user_id) == col(User.id))
            .where(GameParticipant.game_id == game_id)
            .order_by(GameParticipant.joined_at)
        )
        return list(self.session.exec(statement).all())

    def list_accepted(self, game_id: int) -> List[GameParticipant]:
        statement = select(GameParticipant).where(
            GameParticipant.game_id == game_id,
            GameParticipant.status == ParticipantStatus.ACCEPTED,
        )
        return list(self.session.exec(statement).all())

    def count_admins(self, game_id: int) -> int:
        statement = select(func.count()).select_from(GameParticipant).where(
            GameParticipant.game_id == game_id,
            GameParticipant.role == "admin",
            GameParticipant.status == ParticipantStatus.ACCEPTED,
        )
        return self.session.exec(statement).one()


class GameJoinRequestRepository(BaseRepository[GameJoinRequest]):

    def __init__(self, session: Session):
        super().__init__(GameJoinRequest, session)

    def get_pending_for_game(self, game_id: int) -> List[Tuple[GameJoinRequest, Optional[str]]]:
        statement = (
            select(GameJoinRequest, User.full_name)
            .join(User, col(GameJoinRequest.user_id) == col(User.id))
            .where(
                GameJoinRequest.game_id == game_id,
                GameJoinRequest.status == JoinRequestStatus.PENDING,
            )
            .order_by(GameJoinRequest.created_at)
        )
        return list(self.session.exec(statement).all())

    def get_pending_by_user(self, game_id: int, user_id: int) -> Optional[GameJoinRequest]:
        return self.get_one(game_id=game_id, user_id=user_id, status=JoinRequestStatus.PENDING)

    def has_pending_for_user(self, game_id: int, user_id: int) -> bool:
        return self.get_pending_by_user(game_id, user_id) is not None


class GameInvitationRepository(BaseRepository[GameInvitation]):

    def __init__(self, session: Session):
        super().__init__(GameInvitation, session)

    def get_by_game_and_user(self, game_id: int, user_id: int) -> Optional[GameInvitation]:
        return self.get_one(game_id=game_id, invited_user_id=user_id)

    def list_pending_for_user(self, user_id: int) -> List[Tuple[GameInvitation, Optional[str]]]:
        """دعوت‌های بازِ کاربر + نام بازی."""
        now = datetime.now(timezone.utc)
        statement = (
            select(GameInvitation, Game.name)
            .join(Game, col(GameInvitation.game_id) == col(Game.id))
            .where(
                GameInvitation.invited_user_id == user_id,
                GameInvitation.status == InvitationStatus.PENDING,
                Game.status.not_in([GameStatus.CANCELLED, GameStatus.STARTED, GameStatus.COMPLETED]),
                or_(col(GameInvitation.expires_at).is_(None), col(GameInvitation.expires_at) > now),
            )
            .order_by(col(GameInvitation.created_at).desc())
        )
        return list(self.session.exec(statement).all())

    def list_by_game(self, game_id: int) -> List[Tuple[GameInvitation, Optional[str]]]:
        statement = (
            select(GameInvitation, User.full_name)
            .join(User, col(GameInvitation.invited_user_id) == col(User.id))
            .where(GameInvitation.game_id == game_id)
            .order_by(col(GameInvitation.created_at).desc())
        )
        return list(self.session.exec(statement).all())


class GameInviteLinkRepository(BaseRepository[GameInviteLink]):

    def __init__(self, session: Session):
        super().__init__(GameInviteLink, session)

    def get_by_token(self, token: str, with_lock: bool = False) -> Optional[GameInviteLink]:
        if with_lock:
            statement = select(GameInviteLink).where(
                GameInviteLink.token == token
            ).with_for_update()
            return self.session.exec(statement).first()
        return self.get_one(token=token)

    def list_active_by_game(self, game_id: int) -> List[GameInviteLink]:
        statement = select(GameInviteLink).where(
            GameInviteLink.game_id == game_id,
            GameInviteLink.is_active == True,  # noqa: E712
        ).order_by(col(GameInviteLink.created_at).desc())
        return list(self.session.exec(statement).all())

    def deactivate_all(self, game_id: int) -> int:
        statement = (
            GameInviteLink.__table__.update()
            .where(
                GameInviteLink.__table__.c.game_id == game_id,
                GameInviteLink.__table__.c.is_active == True,  # noqa: E712
            )
            .values(is_active=False)
        )
        result = self.session.exec(statement)
        self.session.flush()
        return result.rowcount


class GameWaitlistRepository(BaseRepository[GameWaitlist]):

    def __init__(self, session: Session):
        super().__init__(GameWaitlist, session)

    def get_by_game_and_user(self, game_id: int, user_id: int) -> Optional[GameWaitlist]:
        return self.get_one(game_id=game_id, user_id=user_id, status=WaitlistStatus.WAITLISTED)

    def list_by_game(self, game_id: int) -> List[Tuple[GameWaitlist, Optional[str]]]:
        statement = (
            select(GameWaitlist, User.full_name)
            .join(User, col(GameWaitlist.user_id) == col(User.id))
            .where(
                GameWaitlist.game_id == game_id,
                GameWaitlist.status == WaitlistStatus.WAITLISTED,
            )
            .order_by(GameWaitlist.position, GameWaitlist.id)
        )
        return list(self.session.exec(statement).all())

    def next_position(self, game_id: int) -> int:
        statement = select(func.max(GameWaitlist.position)).where(
            GameWaitlist.game_id == game_id,
            GameWaitlist.status == WaitlistStatus.WAITLISTED,
        )
        current = self.session.exec(statement).one()
        return (current or 0) + 1

    def pop_first(self, game_id: int) -> Optional[GameWaitlist]:
        """اولین نفر در لیست انتظار (برای ارتقا پس از خالی شدن جا)."""
        statement = (
            select(GameWaitlist)
            .where(
                GameWaitlist.game_id == game_id,
                GameWaitlist.status == WaitlistStatus.WAITLISTED,
            )
            .order_by(GameWaitlist.position, GameWaitlist.id)
            .limit(1)
        )
        return self.session.exec(statement).first()

    def reorder(self, game_id: int) -> None:
        """بازچینش شماره‌ها پس از خروج/ارتقای یک نفر (۱-محور، پایدار)."""
        statement = (
            select(GameWaitlist)
            .where(
                GameWaitlist.game_id == game_id,
                GameWaitlist.status == WaitlistStatus.WAITLISTED,
            )
            .order_by(GameWaitlist.position, GameWaitlist.id)
        )
        for idx, entry in enumerate(self.session.exec(statement).all(), start=1):
            if entry.position != idx:
                entry.position = idx
                self.session.add(entry)
        self.session.flush()


class GamePaymentRepository(BaseRepository[GamePayment]):

    def __init__(self, session: Session):
        super().__init__(GamePayment, session)

    def list_by_game(self, game_id: int) -> List[GamePayment]:
        return self.get_all(game_id=game_id, order_by="created_at")

    def get_by_participant(self, participant_id: int) -> Optional[GamePayment]:
        return self.get_one(participant_id=participant_id)

    def get_paid_for_participant(self, participant_id: int) -> Optional[GamePayment]:
        return self.get_one(participant_id=participant_id, status=GamePaymentStatus.PAID)

    def count_by_status(self, game_id: int) -> dict:
        statement = (
            select(GamePayment.status, func.count())
            .where(GamePayment.game_id == game_id)
            .group_by(GamePayment.status)
        )
        return {status.value if hasattr(status, "value") else status: cnt
                for status, cnt in self.session.exec(statement).all()}
