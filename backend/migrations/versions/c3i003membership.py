"""membership plans & purchases for gyms

Revision ID: c3i003membership
Revises: b2h002phonenull
Create Date: 2026-09-06
"""
import sqlalchemy as sa
import sqlmodel
from alembic import op

revision = "c3i003membership"
down_revision = "b2h002phonenull"
branch_labels = None
depends_on = None


def upgrade() -> None:
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
    op.create_index("ix_membership_plans_venue_id", "membership_plans", ["venue_id"])
    op.create_index("ix_membership_plans_plan_type", "membership_plans", ["plan_type"])
    op.create_index("ix_membership_plans_is_active", "membership_plans", ["is_active"])

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
    op.create_index("ix_membership_purchases_plan_id", "membership_purchases", ["plan_id"])
    op.create_index("ix_membership_purchases_user_id", "membership_purchases", ["user_id"])
    op.create_index("ix_membership_purchases_venue_id", "membership_purchases", ["venue_id"])
    op.create_index("ix_membership_purchases_status", "membership_purchases", ["status"])
    op.create_index("ix_membership_purchases_transaction_id", "membership_purchases", ["transaction_id"])
    op.create_index("ix_membership_purchases_expires_at", "membership_purchases", ["expires_at"])


def downgrade() -> None:
    op.drop_table("membership_purchases")
    op.drop_table("membership_plans")
