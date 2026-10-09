# backend/app/models/split_payment.py
"""Team split payment system for shared costs among team members.

- Flexible split methods (equal, custom amounts, percentages)
- Individual payment tracking per member
- Optional deadline for unpaid shares
"""
from sqlmodel import SQLModel, Field
from sqlalchemy import CheckConstraint, Index, UniqueConstraint
from typing import Optional
from datetime import datetime, timezone
from enum import Enum


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ─────────────────────────── Enums ───────────────────────────

class SplitMethod(str, Enum):
    EQUAL = "EQUAL"              # Divide equally among all team members
    CUSTOM = "CUSTOM"            # Custom amount per member
    PERCENTAGE = "PERCENTAGE"    # Percentage-based split


class SplitPaymentStatus(str, Enum):
    PENDING = "PENDING"          # Waiting for payments
    PARTIAL = "PARTIAL"          # Some paid, some pending
    COMPLETED = "COMPLETED"      # All shares paid
    CANCELLED = "CANCELLED"      # Cancelled by organizer
    EXPIRED = "EXPIRED"          # Past deadline without full payment


class ShareStatus(str, Enum):
    PENDING = "PENDING"          # Not yet paid
    PAID = "PAID"                # Paid successfully
    REFUNDED = "REFUNDED"        # Refunded
    OVERDUE = "OVERDUE"          # Past deadline


# ─────────────────────────── Models ───────────────────────────

class TeamSplitPayment(SQLModel, table=True):
    """Split payment record linked to a team (optionally a game/booking)."""
    __tablename__ = "team_split_payments"
    __table_args__ = (
        CheckConstraint("amount > 0", name="positive_amount"),
        Index("idx_split_payment_team", "team_id"),
        Index("idx_split_payment_game", "game_id"),
        Index("idx_split_payment_status", "status"),
        Index("idx_split_payment_created", "created_at"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)

    # Optional links — a split is always team-scoped, game/booking optional
    game_id: Optional[int] = Field(default=None, foreign_key="games.id", ondelete="SET NULL")
    booking_id: Optional[int] = Field(default=None, foreign_key="bookings.id", ondelete="SET NULL")
    team_id: Optional[int] = Field(default=None, foreign_key="teams.id", ondelete="SET NULL")

    # Who created it
    created_by: int = Field(foreign_key="users.id", ondelete="CASCADE")

    # Payment details (amount in rials)
    amount: int
    currency: str = Field(default="IRR", max_length=10)
    method: SplitMethod = SplitMethod.EQUAL

    # Status tracking
    status: SplitPaymentStatus = SplitPaymentStatus.PENDING
    paid_amount: int = Field(default=0)  # Sum of paid shares

    deadline: Optional[datetime] = None
    note: Optional[str] = Field(default=None, max_length=1000)

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    @property
    def remaining_amount(self) -> int:
        return self.amount - self.paid_amount

    @property
    def is_complete(self) -> bool:
        return self.status == SplitPaymentStatus.COMPLETED

    @property
    def progress_percentage(self) -> float:
        if self.amount == 0:
            return 0.0
        return (self.paid_amount / self.amount) * 100


class SplitPaymentShare(SQLModel, table=True):
    """Individual share within a split payment."""
    __tablename__ = "split_payment_shares"
    __table_args__ = (
        CheckConstraint("amount > 0", name="positive_share_amount"),
        Index("idx_share_payment", "split_payment_id"),
        Index("idx_share_user", "user_id"),
        Index("idx_share_status", "status"),
        UniqueConstraint("split_payment_id", "user_id", name="uq_payment_user"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)

    split_payment_id: int = Field(foreign_key="team_split_payments.id", ondelete="CASCADE")
    user_id: int = Field(foreign_key="users.id", ondelete="CASCADE")

    amount: int  # In rials
    percentage: Optional[float] = None  # Only for PERCENTAGE method

    status: ShareStatus = ShareStatus.PENDING

    payment_id: Optional[int] = Field(default=None, foreign_key="booking_payments.id", ondelete="SET NULL")
    paid_at: Optional[datetime] = Field(default=None)

    note: Optional[str] = Field(default=None, max_length=500)

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    @property
    def is_paid(self) -> bool:
        return self.status == ShareStatus.PAID


# ─────────────────────────── Audit Log ───────────────────────────

class SplitPaymentAuditEvent(SQLModel, table=True):
    """Audit trail for split payment actions."""
    __tablename__ = "split_payment_audit_events"
    __table_args__ = (
        Index("idx_audit_payment", "split_payment_id"),
        Index("idx_audit_user", "user_id"),
        Index("idx_audit_action", "action"),
        Index("idx_audit_created", "created_at"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)

    split_payment_id: int = Field(foreign_key="team_split_payments.id", ondelete="CASCADE")
    user_id: int = Field(foreign_key="users.id", ondelete="CASCADE")
    performed_by: Optional[str] = Field(default=None, max_length=20)  # phone of actor

    action: str  # e.g., "CREATED", "SHARE_PAID", "CANCELLED"
    data: Optional[str] = Field(default=None)  # JSON string with details

    created_at: datetime = Field(default_factory=_utcnow)
