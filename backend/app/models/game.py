# backend/app/models/game.py
"""مدل‌های سیستم بازی گروهی (Group Booking / Open Game).

قانون معماری: Game یک موجودیت مستقل است که روی یک Booking تأییدشده سوار می‌شود.
Booking = رزرو زمین | Game = رویداد گروهی روی آن رزرو. این دو هرگز قاطی نمی‌شوند.
"""
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import CheckConstraint, UniqueConstraint
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ─────────────────────────── Enumها ───────────────────────────

class GameVisibility(str, Enum):
    PRIVATE = "private"              # فقط با لینک دعوت / دعوت مستقیم
    PUBLIC = "public"                # در Explore، Join مستقیم
    PUBLIC_APPROVAL = "public_approval"  # در Explore، Join با تأیید ارگانایزر


class GameStatus(str, Enum):
    DRAFT = "draft"
    OPEN = "open"
    FULL = "full"
    STARTED = "started"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    PRO = "pro"


class PaymentMode(str, Enum):
    ORGANIZER_PAYS = "organizer_pays"
    SPLIT_PAYMENT = "split_payment"
    FREE = "free"


class JoinPolicy(str, Enum):
    OPEN = "open"
    APPROVAL = "approval"


class ParticipantRole(str, Enum):
    ORGANIZER = "organizer"
    ADMIN = "admin"
    MEMBER = "member"


class ParticipantStatus(str, Enum):
    INVITED = "invited"
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    LEFT = "left"
    REMOVED = "removed"


class JoinRequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    REVOKED = "revoked"


class WaitlistStatus(str, Enum):
    WAITLISTED = "waitlisted"
    PROMOTED = "promoted"
    LEFT = "left"


class GamePaymentStatus(str, Enum):
    """وضعیت پرداخت سهم هر بازیکن — مستقل از BookingPayment (پرداخت زمین)."""
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


# ─────────────────────────── Game ───────────────────────────

class Game(SQLModel, table=True):
    __tablename__ = "games"
    __table_args__ = (
        CheckConstraint("max_players > 0", name="ck_games_max_players_positive"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    # یک رزرو حداکثر یک بازی می‌تواند داشته باشد
    booking_id: int = Field(foreign_key="bookings.id", unique=True, index=True)
    organizer_id: int = Field(foreign_key="users.id", index=True)

    name: str = Field(max_length=100)
    description: Optional[str] = Field(default=None, max_length=1000)
    sport: str = Field(default="football", max_length=30, index=True)

    visibility: GameVisibility = Field(default=GameVisibility.PUBLIC, index=True)
    join_policy: JoinPolicy = Field(default=JoinPolicy.OPEN)
    max_players: int
    skill_level: SkillLevel = Field(default=SkillLevel.INTERMEDIATE)
    payment_mode: PaymentMode = Field(default=PaymentMode.SPLIT_PAYMENT)
    status: GameStatus = Field(default=GameStatus.OPEN, index=True)

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    booking: Optional["Booking"] = Relationship()
    participants: List["GameParticipant"] = Relationship(back_populates="game")
    join_requests: List["GameJoinRequest"] = Relationship(back_populates="game")
    invitations: List["GameInvitation"] = Relationship(back_populates="game")
    invite_links: List["GameInviteLink"] = Relationship(back_populates="game")
    waitlist_entries: List["GameWaitlist"] = Relationship(back_populates="game")
    payments: List["GamePayment"] = Relationship(back_populates="game")


# ─────────────────────────── Participants ───────────────────────────

class GameParticipant(SQLModel, table=True):
    __tablename__ = "game_participants"
    __table_args__ = (
        UniqueConstraint("game_id", "user_id", name="uq_game_participant_game_user"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    game_id: int = Field(foreign_key="games.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    role: ParticipantRole = Field(default=ParticipantRole.MEMBER)
    status: ParticipantStatus = Field(default=ParticipantStatus.ACCEPTED, index=True)
    joined_at: datetime = Field(default_factory=_utcnow)
    left_at: Optional[datetime] = None

    game: Optional[Game] = Relationship(back_populates="participants")
    user: Optional["User"] = Relationship()


# ─────────────────────────── Join Requests ───────────────────────────

class GameJoinRequest(SQLModel, table=True):
    __tablename__ = "game_join_requests"

    id: Optional[int] = Field(default=None, primary_key=True)
    game_id: int = Field(foreign_key="games.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    status: JoinRequestStatus = Field(default=JoinRequestStatus.PENDING, index=True)
    message: Optional[str] = Field(default=None, max_length=300)
    reviewed_by: Optional[int] = Field(default=None, foreign_key="users.id")
    reviewed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=_utcnow)

    game: Optional[Game] = Relationship(back_populates="join_requests")
    # دو FK به users (user_id و reviewed_by) → foreign_keys الزامی است
    user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[GameJoinRequest.user_id]"}
    )


# ─────────────────────────── Invitations (دعوت مستقیم کاربر) ───────────────────────────

class GameInvitation(SQLModel, table=True):
    __tablename__ = "game_invitations"
    __table_args__ = (
        UniqueConstraint("game_id", "invited_user_id", name="uq_game_invitation_game_user"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    game_id: int = Field(foreign_key="games.id", index=True)
    invited_user_id: int = Field(foreign_key="users.id", index=True)
    invited_by: int = Field(foreign_key="users.id")
    status: InvitationStatus = Field(default=InvitationStatus.PENDING, index=True)
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=_utcnow)

    game: Optional[Game] = Relationship(back_populates="invitations")
    # دو FK به users (invited_user_id و invited_by) → foreign_keys الزامی است
    invited_user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[GameInvitation.invited_user_id]"}
    )


# ─────────────────────────── Invite Links (توکن امن، بدون ID دایرکت) ───────────────────────────

class GameInviteLink(SQLModel, table=True):
    __tablename__ = "game_invite_links"

    id: Optional[int] = Field(default=None, primary_key=True)
    game_id: int = Field(foreign_key="games.id", index=True)
    token: str = Field(max_length=64, unique=True, index=True)
    created_by: int = Field(foreign_key="users.id")
    expires_at: Optional[datetime] = None
    max_uses: Optional[int] = Field(default=None)  # None = نامحدود
    uses_count: int = Field(default=0)
    is_active: bool = Field(default=True, index=True)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    game: Optional[Game] = Relationship(back_populates="invite_links")


# ─────────────────────────── Waitlist ───────────────────────────

class GameWaitlist(SQLModel, table=True):
    __tablename__ = "game_waitlist"
    __table_args__ = (
        UniqueConstraint("game_id", "user_id", name="uq_game_waitlist_game_user"),
        CheckConstraint("position > 0", name="ck_game_waitlist_position_positive"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    game_id: int = Field(foreign_key="games.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    position: int  # ۱-محور؛ ترتیب = id
    status: WaitlistStatus = Field(default=WaitlistStatus.WAITLISTED, index=True)
    created_at: datetime = Field(default_factory=_utcnow)

    game: Optional[Game] = Relationship(back_populates="waitlist_entries")
    user: Optional["User"] = Relationship()


# ─────────────────────────── Game Payments (سهم هر بازیکن) ───────────────────────────

class GamePayment(SQLModel, table=True):
    __tablename__ = "game_payments"

    id: Optional[int] = Field(default=None, primary_key=True)
    game_id: int = Field(foreign_key="games.id", index=True)
    participant_id: int = Field(foreign_key="game_participants.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    amount: int
    status: GamePaymentStatus = Field(default=GamePaymentStatus.PENDING, index=True)
    gateway: str = Field(default="mock")
    payment_reference: Optional[str] = Field(default=None, index=True)
    paid_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    game: Optional[Game] = Relationship(back_populates="payments")
    participant: Optional[GameParticipant] = Relationship()
