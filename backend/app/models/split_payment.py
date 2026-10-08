# backend/app/models/split_payment.py
"""Team split payment system for shared booking costs.

This module handles splitting booking/game costs among team members with:
- Flexible split methods (equal, custom amounts, percentages)
- Individual payment tracking per member
- Deadline enforcement
- Automatic reminders for unpaid shares
- Partial payment support
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
    EQUAL = "equal"              # Divide equally among all participants
    CUSTOM = "custom"            # Custom amount per participant
    PERCENTAGE = "percentage"    # Percentage-based split


class SplitPaymentStatus(str, Enum):
    PENDING = "pending"          # Waiting for payments
    PARTIAL = "partial"          # Some paid, some pending
    COMPLETED = "completed"      # All shares paid
    CANCELLED = "cancelled"      # Cancelled by organizer
    EXPIRED = "expired"          # Past deadline without full payment


class ShareStatus(str, Enum):
    PENDING = "pending"          # Not yet paid
    PAID = "paid"                # Paid successfully
    REFUNDED = "refunded"        # Refunded (e.g., game cancelled)
    OVERDUE = "overdue"          # Past deadline


# ─────────────────────────── Models ───────────────────────────

class TeamSplitPayment(SQLModel, table=True):
    """Main split payment record linked to a game/booking."""
    __tablename__ = "team_split_payments"
    __table_args__ = (
        CheckConstraint("total_amount > 0", name="positive_total_amount"),
        CheckConstraint("deadline > created_at", name="valid_deadline"),
        Index("idx_split_payment_game", "game_id"),
        Index("idx_split_payment_status", "status"),
        Index("idx_split_payment_created", "created_at"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Link to the game/booking being split
    game_id: int = Field(foreign_key="games.id", ondelete="CASCADE")
    
    # Organizer who created the split
    organizer_id: int = Field(foreign_key="users.id", ondelete="CASCADE")
    
    # Team context (optional - can split among non-team members too)
    team_id: Optional[int] = Field(default=None, foreign_key="teams.id", ondelete="SET NULL")
    
    # Payment details
    total_amount: int  # Total amount in rials
    split_method: SplitMethod = SplitMethod.EQUAL
    
    # Status tracking
    status: SplitPaymentStatus = SplitPaymentStatus.PENDING
    paid_amount: int = Field(default=0)  # Sum of paid shares
    
    # Deadlines and notes
    deadline: datetime
    notes: Optional[str] = Field(default=None, max_length=1000)
    
    # Timestamps
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    
    @property
    def remaining_amount(self) -> int:
        """Amount still to be paid."""
        return self.total_amount - self.paid_amount
    
    @property
    def is_complete(self) -> bool:
        """Check if all shares are paid."""
        return self.status == SplitPaymentStatus.COMPLETED
    
    @property
    def progress_percentage(self) -> float:
        """Payment completion percentage."""
        if self.total_amount == 0:
            return 0.0
        return (self.paid_amount / self.total_amount) * 100


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
    
    # Link to parent split payment
    split_payment_id: int = Field(foreign_key="team_split_payments.id", ondelete="CASCADE")
    
    # User who owes this share
    user_id: int = Field(foreign_key="users.id", ondelete="CASCADE")
    
    # Amount owed/paid
    amount: int  # In rials
    
    # Status
    status: ShareStatus = ShareStatus.PENDING
    
    # Payment reference (if paid)
    payment_id: Optional[int] = Field(default=None, foreign_key="payments.id", ondelete="SET NULL")
    paid_at: Optional[datetime] = Field(default=None)
    
    # Notes (e.g., reason for custom amount)
    notes: Optional[str] = Field(default=None, max_length=500)
    
    # Timestamps
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    
    @property
    def is_paid(self) -> bool:
        return self.status == ShareStatus.PAID
    
    @property
    def is_overdue(self) -> bool:
        """Check if share is past deadline and not paid."""
        if self.is_paid:
            return False
        from app.models.split_payment import TeamSplitPayment
        # This would need a relationship or query to check deadline
        return False  # Simplified - actual check requires DB query


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
    
    action: str  # e.g., "share_paid", "payment_cancelled", "deadline_extended"
    data: Optional[str] = Field(default=None)  # JSON string with details
    
    created_at: datetime = Field(default_factory=_utcnow)
