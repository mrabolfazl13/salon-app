"""staff RBAC, security audit, venue CRM — staff_assignments, security_audit_events, venue_customers, crm_campaigns

Revision ID: j0p010staffcrm
Revises: i9o009teams
Create Date: 2026-09-15

الگوی idempotent همان i9o009teams: هر جدول/ستون فقط در صورت نبود ساخته می‌شود
تا روی دیتابیس تازه (create_all از مدل) no-op بماند. ستون‌های enum به‌صورت
VARCHAR نوشته می‌شوند (تصمیم مستند از a1g001؛ بدون CREATE TYPE).
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "j0p010staffcrm"
down_revision: Union[str, None] = "i9o009teams"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _insp():
    return sa.inspect(op.get_bind())


def _has_table(name: str) -> bool:
    return name in _insp().get_table_names()


def _idx(name: str, table: str, cols, unique: bool = False) -> None:
    existing = {i["name"] for i in _insp().get_indexes(table)}
    if name in existing:
        return
    op.create_index(name, table, cols, unique=unique)


def upgrade() -> None:
    # ── ۱) staff_assignments ──
    if not _has_table("staff_assignments"):
        op.create_table(
            "staff_assignments",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("venue_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("position", sqlmodel.VARCHAR(length=20), nullable=False),
            sa.Column("permissions", sqlmodel.VARCHAR(length=2000), nullable=False,
                      server_default="[]"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("removed_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], name="fk_staff_assignments_venue"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_staff_assignments_user"),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], name="fk_staff_assignments_created_by"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("venue_id", "user_id", name="uq_staff_active_user_venue"),
        )
    _idx("ix_staff_assignments_venue_id", "staff_assignments", ["venue_id"])
    _idx("ix_staff_assignments_user_id", "staff_assignments", ["user_id"])
    _idx("ix_staff_assignments_position", "staff_assignments", ["position"])
    _idx("ix_staff_assignments_is_active", "staff_assignments", ["is_active"])

    # ── ۲) security_audit_events ──
    if not _has_table("security_audit_events"):
        op.create_table(
            "security_audit_events",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("actor_id", sa.Integer(), nullable=True),
            sa.Column("action", sqlmodel.VARCHAR(length=60), nullable=False),
            sa.Column("target_type", sqlmodel.VARCHAR(length=40), nullable=True),
            sa.Column("target_id", sa.Integer(), nullable=True),
            sa.Column("venue_id", sa.Integer(), nullable=True),
            sa.Column("data", sqlmodel.VARCHAR(length=4000), nullable=False,
                      server_default="{}"),
            sa.Column("ip", sqlmodel.VARCHAR(length=45), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["actor_id"], ["users.id"], name="fk_security_audit_actor"),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], name="fk_security_audit_venue"),
            sa.PrimaryKeyConstraint("id"),
        )
    _idx("ix_security_audit_events_actor_id", "security_audit_events", ["actor_id"])
    _idx("ix_security_audit_events_action", "security_audit_events", ["action"])
    _idx("ix_security_audit_events_venue_id", "security_audit_events", ["venue_id"])
    _idx("ix_security_audit_events_created_at", "security_audit_events", ["created_at"])

    # ── ۳) venue_customers ──
    if not _has_table("venue_customers"):
        op.create_table(
            "venue_customers",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("venue_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("is_vip", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("tags", sqlmodel.VARCHAR(length=500), nullable=False, server_default=""),
            sa.Column("notes", sqlmodel.VARCHAR(length=2000), nullable=True),
            sa.Column("marketing_consent", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("consent_updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("marked_by", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], name="fk_venue_customers_venue"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_venue_customers_user"),
            sa.ForeignKeyConstraint(["marked_by"], ["users.id"], name="fk_venue_customers_marked_by"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("venue_id", "user_id", name="uq_venue_customer_venue_user"),
        )
    _idx("ix_venue_customers_venue_id", "venue_customers", ["venue_id"])
    _idx("ix_venue_customers_user_id", "venue_customers", ["user_id"])
    _idx("ix_venue_customers_is_vip", "venue_customers", ["is_vip"])
    _idx("ix_venue_customers_marketing_consent", "venue_customers", ["marketing_consent"])

    # ── ۴) crm_campaigns ──
    if not _has_table("crm_campaigns"):
        op.create_table(
            "crm_campaigns",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("venue_id", sa.Integer(), nullable=False),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("title", sqlmodel.VARCHAR(length=200), nullable=False),
            sa.Column("message", sqlmodel.VARCHAR(length=1500), nullable=False),
            sa.Column("discount_code", sqlmodel.VARCHAR(length=40), nullable=True),
            sa.Column("segment", sqlmodel.VARCHAR(length=30), nullable=True),
            sa.Column("customer_ids", sqlmodel.VARCHAR(length=2000), nullable=False,
                      server_default="[]"),
            sa.Column("sent_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("skipped_no_consent", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], name="fk_crm_campaigns_venue"),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], name="fk_crm_campaigns_created_by"),
            sa.PrimaryKeyConstraint("id"),
        )
    _idx("ix_crm_campaigns_venue_id", "crm_campaigns", ["venue_id"])
    _idx("ix_crm_campaigns_created_at", "crm_campaigns", ["created_at"])


def downgrade() -> None:
    for table in ("crm_campaigns", "venue_customers",
                  "security_audit_events", "staff_assignments"):
        if _has_table(table):
            op.drop_table(table)