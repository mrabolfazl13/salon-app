"""membership plans & purchases for gyms

Revision ID: c3i003membership
Revises: b2h002phonenull
Create Date: 2026-09-06

REPAIR (2026-09-15): make this revision idempotent against a create_all-built
schema — previously op.create_table crashed with "table already exists" when
the whole chain was run over a DB whose tables came from SQLModel metadata
(also relevant for d4j004baseline interplay / partial upgrades). Every table
and index is now created only when missing; downgrade drops only what exists.
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "c3i003membership"
down_revision: Union[str, None] = "b2h002phonenull"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _insp():
    return sa.inspect(op.get_bind())


def _has_table(name: str) -> bool:
    return name in _insp().get_table_names()


def _idx(name: str, table: str, cols) -> None:
    existing = {i["name"] for i in _insp().get_indexes(table)}
    if name in existing:
        return
    op.create_index(name, table, cols)


def upgrade() -> None:
    if not _has_table("membership_plans"):
        op.create_table(
            "membership_plans",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("venue_id", sa.Integer(), nullable=False),
            sa.Column("title", sa.VARCHAR(length=100), nullable=False),
            sa.Column("plan_type", sa.VARCHAR(length=20), nullable=False),
            sa.Column("price", sa.Integer(), nullable=False),
            sa.Column("sessions_count", sa.Integer(), nullable=True),
            sa.Column("duration_days", sa.Integer(), nullable=True),
            sa.Column("description", sa.VARCHAR(length=300), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    _idx("ix_membership_plans_venue_id", "membership_plans", ["venue_id"])
    _idx("ix_membership_plans_plan_type", "membership_plans", ["plan_type"])
    _idx("ix_membership_plans_is_active", "membership_plans", ["is_active"])

    if not _has_table("membership_purchases"):
        op.create_table(
            "membership_purchases",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("plan_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("venue_id", sa.Integer(), nullable=False),
            sa.Column("amount", sa.Integer(), nullable=False),
            sa.Column("status", sa.VARCHAR(length=20), nullable=False),
            sa.Column("transaction_id", sa.VARCHAR(), nullable=True),
            sa.Column("card_pan", sa.VARCHAR(), nullable=True),
            sa.Column("sessions_remaining", sa.Integer(), nullable=True),
            sa.Column("starts_at", sa.DateTime(), nullable=True),
            sa.Column("expires_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("paid_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["plan_id"], ["membership_plans.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    _idx("ix_membership_purchases_plan_id", "membership_purchases", ["plan_id"])
    _idx("ix_membership_purchases_user_id", "membership_purchases", ["user_id"])
    _idx("ix_membership_purchases_venue_id", "membership_purchases", ["venue_id"])
    _idx("ix_membership_purchases_status", "membership_purchases", ["status"])
    _idx("ix_membership_purchases_transaction_id", "membership_purchases", ["transaction_id"])
    _idx("ix_membership_purchases_expires_at", "membership_purchases", ["expires_at"])


def downgrade() -> None:
    if _has_table("membership_purchases"):
        op.drop_table("membership_purchases")
    if _has_table("membership_plans"):
        op.drop_table("membership_plans")
