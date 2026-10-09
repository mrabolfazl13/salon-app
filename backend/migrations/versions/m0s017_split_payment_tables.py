"""team split payments: create missing split-payment tables (FEAT-001)

Revision ID: m0s017splitpayment
Revises: m0s016weeklyquiz
Create Date: 2026-10-09

جداول split-payment (مدل‌های app/models/split_payment.py) هرگز روی production
ساخته نشده بودند: baseline (d4j004) قبل از افزوده‌شدن این مدل‌ها اجرا شده بود و
هیچ migration بعدی آن‌ها را نمی‌ساخت. این migration همان جداول را ایدپوتنت
می‌سازد (الگوی f6l006). روی دیتابیس تازه‌ای که baseline از مدل ساخته، no-op است.

enumهای native (splitmethod/splitpaymentstatus/sharestatus) خودکار توسط
create_table ساخته می‌شوند؛ برچسب‌ها NAME عضو هستند (رفتار SQLAlchemy؛ الگوی e5k005).
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "m0s017splitpayment"
down_revision: Union[str, None] = "m0s016weeklyquiz"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _insp():
    return sa.inspect(op.get_bind())


def _has_table(name: str) -> bool:
    return name in _insp().get_table_names()


def upgrade() -> None:
    if not _has_table("team_split_payments"):
        op.create_table(
            "team_split_payments",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("game_id", sa.Integer(), nullable=True),
            sa.Column("booking_id", sa.Integer(), nullable=True),
            sa.Column("team_id", sa.Integer(), nullable=True),
            sa.Column("created_by", sa.Integer(), nullable=False),
            sa.Column("amount", sa.Integer(), nullable=False),
            sa.Column("currency", sa.String(length=10), nullable=False),
            sa.Column("method", sa.Enum("EQUAL", "CUSTOM", "PERCENTAGE", name="splitmethod"), nullable=False),
            sa.Column("status", sa.Enum("PENDING", "PARTIAL", "COMPLETED", "CANCELLED", "EXPIRED", name="splitpaymentstatus"), nullable=False),
            sa.Column("paid_amount", sa.Integer(), nullable=False),
            sa.Column("deadline", sa.DateTime(timezone=True), nullable=True),
            sa.Column("note", sa.String(length=1000), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["game_id"], ["games.id"], name="fk_tsp_game_id", ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], name="fk_tsp_booking_id", ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["team_id"], ["teams.id"], name="fk_tsp_team_id", ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], name="fk_tsp_created_by", ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.CheckConstraint("amount > 0", name="positive_amount"),
        )
        op.create_index("idx_split_payment_team", "team_split_payments", ["team_id"])
        op.create_index("idx_split_payment_game", "team_split_payments", ["game_id"])
        op.create_index("idx_split_payment_status", "team_split_payments", ["status"])
        op.create_index("idx_split_payment_created", "team_split_payments", ["created_at"])

    if not _has_table("split_payment_shares"):
        op.create_table(
            "split_payment_shares",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("split_payment_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("amount", sa.Integer(), nullable=False),
            sa.Column("percentage", sa.Float(), nullable=True),
            sa.Column("status", sa.Enum("PENDING", "PAID", "REFUNDED", "OVERDUE", name="sharestatus"), nullable=False),
            sa.Column("payment_id", sa.Integer(), nullable=True),
            sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("note", sa.String(length=500), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["split_payment_id"], ["team_split_payments.id"],
                                    name="fk_share_split_payment_id", ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_share_user_id", ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["payment_id"], ["booking_payments.id"],
                                    name="fk_share_payment_id", ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
            sa.CheckConstraint("amount > 0", name="positive_share_amount"),
            sa.UniqueConstraint("split_payment_id", "user_id", name="uq_payment_user"),
        )
        op.create_index("idx_share_payment", "split_payment_shares", ["split_payment_id"])
        op.create_index("idx_share_user", "split_payment_shares", ["user_id"])
        op.create_index("idx_share_status", "split_payment_shares", ["status"])

    if not _has_table("split_payment_audit_events"):
        op.create_table(
            "split_payment_audit_events",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("split_payment_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("performed_by", sa.String(length=20), nullable=True),
            sa.Column("action", sa.String(), nullable=False),
            sa.Column("data", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["split_payment_id"], ["team_split_payments.id"],
                                    name="fk_audit_split_payment_id", ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_audit_user_id", ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("idx_audit_payment", "split_payment_audit_events", ["split_payment_id"])
        op.create_index("idx_audit_user", "split_payment_audit_events", ["user_id"])
        op.create_index("idx_audit_action", "split_payment_audit_events", ["action"])
        op.create_index("idx_audit_created", "split_payment_audit_events", ["created_at"])


def downgrade() -> None:
    for table in ("split_payment_audit_events", "split_payment_shares", "team_split_payments"):
        if _has_table(table):
            op.drop_table(table)
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        for enum_name in ("sharestatus", "splitpaymentstatus", "splitmethod"):
            op.execute(f"DROP TYPE IF EXISTS {enum_name}")
