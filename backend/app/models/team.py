# backend/app/models/team.py
"""Permanent team entities (persistent) — Game is a one-off event, unlike Team.

Architecture rules:
- Team is a persistent entity (members, dues/history, accounting, bookings).
- Game/Booking do not change from this; TeamBooking only attributes an existing booking to a team.
- Role/status/invitation patterns are taken from game.py (captain=organizer, member admin, invitation, join request).
- Operations auditing via team_audit_events (pattern of contract_audit_events; data = JSON string).
- Team account = financial_transactions rows with counterparty_type=TEAM and
  counterparty_ref=team_id (counterparty column FKs to users, for a team it is null).
"""
from sqlmodel import SQLModel, Field
from sqlalchemy import CheckConstraint, UniqueConstraint, Index
from typing import Optional
from datetime import datetime, date, timezone
from enum import Enum

from app.config import settings


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ─────────────────────────── Enums ───────────────────────────

class TeamVisibility(str, Enum):
    PRIVATE = "private"          # Only members; joining by direct invitation only
    PUBLIC = "public"            # In Discover; joining via request + admin approval
    INVITE_ONLY = "invite_only"  # Viewable, joining only with direct invitation


class TeamMemberRole(str, Enum):
    CAPTAIN = "captain"          # Team owner (one per team, equivalent to game organizer)
    ADMIN = "admin"              # Team manager (equivalent to game admin)
    MEMBER = "member"


class TeamMemberStatus(str, Enum):
    PENDING = "pending"          # Invitation sent, unanswered
    ACTIVE = "active"
    REMOVED = "removed"          # Admin removal or self-exit (type in audit)
    DECLINED = "declined"


class TeamInvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    REVOKED = "revoked"


class TeamJoinRequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class TeamDuesMethod(str, Enum):
    CASH = "cash"
    GATEWAY = "gateway"
    CARD_TO_CARD = "card_to_card"


class TeamAuditAction(str, Enum):
    CREATED = "created"
    UPDATED = "updated"
    DEACTIVATED = "deactivated"
    MEMBER_INVITED = "member_invited"
    MEMBER_ACCEPTED = "member_accepted"
    MEMBER_DECLINED = "member_declined"
    MEMBER_REMOVED = "member_removed"
    MEMBER_LEFT = "member_left"
    ROLE_CHANGED = "role_changed"
    CAPTAIN_TRANSFERRED = "captain_transferred"
    JOIN_REQUESTED = "join_requested"
    JOIN_APPROVED = "join_approved"
    JOIN_REJECTED = "join_rejected"
    DUES_GENERATED = "dues_generated"
    DUES_PAID = "dues_paid"
    DUES_VOIDED = "dues_voided"
    BOOKING_LINKED = "booking_linked"
    TEAM_BECAME_OFFICIAL = "team_became_official"


# ─────────────────────────── Team ───────────────────────────

class Team(SQLModel, table=True):
    __tablename__ = "teams"
    __table_args__ = (
        UniqueConstraint("captain_id", "name", name="uq_team_captain_name"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, index=True)
    description: Optional[str] = Field(default=None, max_length=1000)
    logo_url: Optional[str] = Field(default=None, max_length=500)
    captain_id: int = Field(foreign_key="users.id", index=True)
    sport: str = Field(default="futsal", max_length=30, index=True)
    visibility: TeamVisibility = Field(default=TeamVisibility.PRIVATE, index=True)
    is_active: bool = Field(default=True, index=True)
    # حدنصاب رسمی‌شدن (تعداد اعضای فعال لازم) — عمداً اسنپ‌شات در تیم
    min_members: int = Field(default=settings.TEAM_MIN_MEMBERS)
    is_official: bool = Field(default=False, index=True)
    official_since: Optional[datetime] = None

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


# ─────────────────────────── Members ───────────────────────────

class TeamMember(SQLModel, table=True):
    __tablename__ = "team_members"
    __table_args__ = (
        UniqueConstraint("team_id", "user_id", name="uq_team_member_team_user"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="teams.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    role: TeamMemberRole = Field(default=TeamMemberRole.MEMBER, index=True)
    status: TeamMemberStatus = Field(default=TeamMemberStatus.PENDING, index=True)
    invited_by: Optional[int] = Field(default=None, foreign_key="users.id")
    joined_at: datetime = Field(default_factory=_utcnow)
    left_at: Optional[datetime] = None
    # زمان آخرین خواندن چت تیم (پایه شمارش پیام‌های خوانده‌نشده)
    last_seen_message_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


# ─────────────────────────── Invitations (direct invitation of registered users) ───────────────────────────

class TeamInvitation(SQLModel, table=True):
    __tablename__ = "team_invitations"
    __table_args__ = (
        UniqueConstraint("team_id", "invitee_user_id", name="uq_team_invitation_team_user"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="teams.id", index=True)
    invitee_user_id: int = Field(foreign_key="users.id", index=True)
    # Phone snapshot at the time of invitation (without extra FK) - for display in notifications/history
    invitee_phone: Optional[str] = Field(default=None, max_length=11)
    invited_by: int = Field(foreign_key="users.id")
    status: TeamInvitationStatus = Field(default=TeamInvitationStatus.PENDING, index=True)
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=_utcnow)
    answered_at: Optional[datetime] = None


# ─────────────────────────── Join Requests (public teams) ───────────────────────────

class TeamJoinRequest(SQLModel, table=True):
    __tablename__ = "team_join_requests"

    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="teams.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    status: TeamJoinRequestStatus = Field(default=TeamJoinRequestStatus.PENDING, index=True)
    message: Optional[str] = Field(default=None, max_length=300)
    reviewed_by: Optional[int] = Field(default=None, foreign_key="users.id")
    reviewed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=_utcnow)


# ─────────────────────────── Team Bookings (team history + reference payment attribution) ───────────────────────────

class TeamBooking(SQLModel, table=True):
    __tablename__ = "team_bookings"
    __table_args__ = (
        # Each booking is attributed to a maximum of one team
        UniqueConstraint("booking_id", name="uq_team_booking_booking"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="teams.id", index=True)
    booking_id: int = Field(foreign_key="bookings.id", index=True)
    paid_by_user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=_utcnow)


# ─────────────────────────── Team Dues (membership/contribution - pattern of ContractPayment) ───────────────────────────

class TeamDues(SQLModel, table=True):
    __tablename__ = "team_dues"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_team_dues_amount_positive"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="teams.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=100)                 # "Friday hall share" / "Membership fee"
    amount: int = Field(description="Positive Rial amount")
    due_date: date = Field(index=True)
    is_paid: bool = Field(default=False, index=True)
    is_voided: bool = Field(default=False, index=True)
    void_reason: Optional[str] = Field(default=None, max_length=300)
    paid_at: Optional[datetime] = None
    paid_by: Optional[int] = Field(default=None, foreign_key="users.id")  # Payer / cash collector
    payment_method: Optional[TeamDuesMethod] = None
    payment_reference: Optional[str] = Field(default=None, max_length=120)
    transaction_id: Optional[int] = Field(default=None, description="Ledger row ID")

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


# ─────────────────────────── Audit ───────────────────────────

class TeamAuditEvent(SQLModel, table=True):
    """Team audit event — `data` JSON string (pattern of contract_audit_events)."""
    __tablename__ = "team_audit_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="teams.id", index=True)
    actor_id: Optional[int] = Field(default=None, foreign_key="users.id")
    action: TeamAuditAction
    data: str = Field(default="{}")
    created_at: datetime = Field(default_factory=_utcnow)


# ─────────────────────────── Chat (پیام‌های تیمی) ───────────────────────────

class TeamMessage(SQLModel, table=True):
    """پیام چت تیم — بدون ممیزی به‌ازای هر پیام (حجم بالا؛ عمداً audit نمی‌شود)."""
    __tablename__ = "team_messages"
    __table_args__ = (
        Index("ix_team_messages_team_created", "team_id", "created_at"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="teams.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    content: str = Field(max_length=2000)
    created_at: datetime = Field(default_factory=_utcnow)
