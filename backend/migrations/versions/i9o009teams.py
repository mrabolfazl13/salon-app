"""teams: persistent team subsystem — roster, invitations, join-requests, dues, ledger link

Revision ID: i9o009teams
Revises: h8n008pricingloyalty
Create Date: 2026-09-15

الگوی idempotent همان g7m007/h8n008: هر جدول/ستون فقط در صورت نبود ساخته
می‌شود تا روی دیتابیس تازه (create_all از مدل) no-op بماند.

استراتژی enum (مستند — همان قرارداد بازی‌ها در a1g001):
- ستون‌های enum مدل‌های جدید روی postgres به‌صورت/sqlmodel.VARCHAR ساخته
  می‌شوند (بدون CREATE TYPE)؛ اپلیکیشن (SQLModel Enum) مقدار را بر اساس
  NAME عضو می‌نویسد — خواندن/نوشتن روی varchar بدون مشکل کار می‌کند.
- استثنا: financial_transactions.source_type در دیتابیس‌های قدیمیِ PG ممکن
  است native enum «transactionsourcetype» باشد؛ مقدار جدید TEAM_DUES با
  الگوی e5k005 (autocommit_block + ADD VALUE IF NOT EXISTS) افزوده می‌شود.
  CounterpartyType.TEAM از قبل وجود دارد — نیازی به تغییر نبود.
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "i9o009teams"
down_revision: Union[str, None] = "h8n008pricingloyalty"
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
    bind = op.get_bind()
    is_pg = bind.dialect.name == "postgresql"

    # ── ۰) مقدار جدید source_type برای سهم تیم ──
    if is_pg:
        has_enum = bind.execute(
            sa.text("SELECT 1 FROM pg_type WHERE typname = 'transactionsourcetype'")
        ).scalar()
        if has_enum:
            with op.get_context().autocommit_block():
                op.execute("ALTER TYPE transactionsourcetype ADD VALUE IF NOT EXISTS 'TEAM_DUES'")

    # ── ۱) teams ──
    if not _has_table("teams"):
        op.create_table(
            "teams",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("name", sqlmodel.VARCHAR(length=100), nullable=False),
            sa.Column("description", sqlmodel.VARCHAR(length=1000), nullable=True),
            sa.Column("logo_url", sqlmodel.VARCHAR(length=500), nullable=True),
            sa.Column("captain_id", sa.Integer(), nullable=False),
            sa.Column("sport", sqlmodel.VARCHAR(length=30), nullable=False,
                      server_default="futsal"),
            sa.Column("visibility", sqlmodel.VARCHAR(length=15), nullable=False,
                      server_default="private"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["captain_id"], ["users.id"], name="fk_teams_captain_id"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("captain_id", "name", name="uq_team_captain_name"),
        )
        _idx("ix_teams_name", "teams", ["name"])
        _idx("ix_teams_captain_id", "teams", ["captain_id"])
        _idx("ix_teams_sport", "teams", ["sport"])
        _idx("ix_teams_visibility", "teams", ["visibility"])
        _idx("ix_teams_is_active", "teams", ["is_active"])

    # ── ۲) team_members ──
    if not _has_table("team_members"):
        op.create_table(
            "team_members",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("team_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("role", sqlmodel.VARCHAR(length=10), nullable=False,
                      server_default="member"),
            sa.Column("status", sqlmodel.VARCHAR(length=10), nullable=False,
                      server_default="pending"),
            sa.Column("invited_by", sa.Integer(), nullable=True),
            sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("left_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["team_id"], ["teams.id"],
                                    name="fk_team_members_team_id"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"],
                                    name="fk_team_members_user_id"),
            sa.ForeignKeyConstraint(["invited_by"], ["users.id"],
                                    name="fk_team_members_invited_by"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("team_id", "user_id", name="uq_team_member_team_user"),
        )
        _idx("ix_team_members_team_id", "team_members", ["team_id"])
        _idx("ix_team_members_user_id", "team_members", ["user_id"])
        _idx("ix_team_members_role", "team_members", ["role"])
        _idx("ix_team_members_status", "team_members", ["status"])

    # ── ۳) team_invitations ──
    if not _has_table("team_invitations"):
        op.create_table(
            "team_invitations",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("team_id", sa.Integer(), nullable=False),
            sa.Column("invitee_user_id", sa.Integer(), nullable=False),
            sa.Column("invitee_phone", sqlmodel.VARCHAR(length=11), nullable=True),
            sa.Column("invited_by", sa.Integer(), nullable=False),
            sa.Column("status", sqlmodel.VARCHAR(length=10), nullable=False,
                      server_default="pending"),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("answered_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["team_id"], ["teams.id"],
                                    name="fk_team_invitations_team_id"),
            sa.ForeignKeyConstraint(["invitee_user_id"], ["users.id"],
                                    name="fk_team_invitations_invitee_user_id"),
            sa.ForeignKeyConstraint(["invited_by"], ["users.id"],
                                    name="fk_team_invitations_invited_by"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("team_id", "invitee_user_id",
                                name="uq_team_invitation_team_user"),
        )
        _idx("ix_team_invitations_team_id", "team_invitations", ["team_id"])
        _idx("ix_team_invitations_invitee_user_id", "team_invitations", ["invitee_user_id"])
        _idx("ix_team_invitations_status", "team_invitations", ["status"])

    # ── ۴) team_join_requests ──
    if not _has_table("team_join_requests"):
        op.create_table(
            "team_join_requests",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("team_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("status", sqlmodel.VARCHAR(length=10), nullable=False,
                      server_default="pending"),
            sa.Column("message", sqlmodel.VARCHAR(length=300), nullable=True),
            sa.Column("reviewed_by", sa.Integer(), nullable=True),
            sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["team_id"], ["teams.id"],
                                    name="fk_team_join_requests_team_id"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"],
                                    name="fk_team_join_requests_user_id"),
            sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"],
                                    name="fk_team_join_requests_reviewed_by"),
            sa.PrimaryKeyConstraint("id"),
        )
        _idx("ix_team_join_requests_team_id", "team_join_requests", ["team_id"])
        _idx("ix_team_join_requests_user_id", "team_join_requests", ["user_id"])
        _idx("ix_team_join_requests_status", "team_join_requests", ["status"])
    # ── ۵) team_bookings (انتساب رزرو به تیم) ──
    if not _has_table("team_bookings"):
        op.create_table(
            "team_bookings",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("team_id", sa.Integer(), nullable=False),
            sa.Column("booking_id", sa.Integer(), nullable=False),
            sa.Column("paid_by_user_id", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["team_id"], ["teams.id"],
                                    name="fk_team_bookings_team_id"),
            sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"],
                                    name="fk_team_bookings_booking_id"),
            sa.ForeignKeyConstraint(["paid_by_user_id"], ["users.id"],
                                    name="fk_team_bookings_paid_by_user_id"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("booking_id", name="uq_team_booking_booking"),
        )
        _idx("ix_team_bookings_team_id", "team_bookings", ["team_id"])
        _idx("ix_team_bookings_booking_id", "team_bookings", ["booking_id"])

    # ── ۶) team_dues (سهم/حق‌عضویت — الگوی contract_payments) ──
    if not _has_table("team_dues"):
        op.create_table(
            "team_dues",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("team_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("title", sqlmodel.VARCHAR(length=100), nullable=False),
            sa.Column("amount", sa.Integer(), nullable=False),
            sa.Column("due_date", sa.Date(), nullable=False),
            sa.Column("is_paid", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("is_voided", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("void_reason", sqlmodel.VARCHAR(length=300), nullable=True),
            sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("paid_by", sa.Integer(), nullable=True),
            sa.Column("payment_method", sqlmodel.VARCHAR(length=20), nullable=True),
            sa.Column("payment_reference", sqlmodel.VARCHAR(length=120), nullable=True),
            sa.Column("transaction_id", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["team_id"], ["teams.id"], name="fk_team_dues_team_id"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_team_dues_user_id"),
            sa.ForeignKeyConstraint(["paid_by"], ["users.id"], name="fk_team_dues_paid_by"),
            sa.PrimaryKeyConstraint("id"),
            sa.CheckConstraint("amount > 0", name="ck_team_dues_amount_positive"),
        )
        _idx("ix_team_dues_team_id", "team_dues", ["team_id"])
        _idx("ix_team_dues_user_id", "team_dues", ["user_id"])
        _idx("ix_team_dues_due_date", "team_dues", ["due_date"])
        _idx("ix_team_dues_is_paid", "team_dues", ["is_paid"])
        _idx("ix_team_dues_is_voided", "team_dues", ["is_voided"])

    # ── ۷) team_audit_events (الگوی contract_audit_events) ──
    if not _has_table("team_audit_events"):
        op.create_table(
            "team_audit_events",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("team_id", sa.Integer(), nullable=False),
            sa.Column("actor_id", sa.Integer(), nullable=True),
            sa.Column("action", sqlmodel.VARCHAR(length=30), nullable=False),
            sa.Column("data", sqlmodel.Text(), nullable=False, server_default="{}"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["team_id"], ["teams.id"],
                                    name="fk_team_audit_events_team_id"),
            sa.ForeignKeyConstraint(["actor_id"], ["users.id"],
                                    name="fk_team_audit_events_actor_id"),
            sa.PrimaryKeyConstraint("id"),
        )
        _idx("ix_team_audit_events_team_id", "team_audit_events", ["team_id"])


def downgrade() -> None:
    for name in ("team_audit_events", "team_dues", "team_bookings",
                 "team_join_requests", "team_invitations", "team_members", "teams"):
        if _has_table(name):
            op.drop_table(name)
    # حذف مقدار از enum نوع postgres عملاً ممکن/مطلوب نیست؛ مقدار باقی می‌ماند
    # و توسط اپلیکیشن استفاده نخواهد شد (الگوی e5k005/h8n008).