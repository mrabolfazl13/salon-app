"""add game tables (Group Booking / Open Game)

Revision ID: a1g001games01
Revises:
Create Date: 2026-09-04

ایمن در برابر create_all: هر جدول فقط در صورت نبود ساخته می‌شود (idempotent).
rollback کامل: downgrade تمام هفت جدول را به ترتیب معکوس FK حذف می‌کند.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = "a1g001games01"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(name: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    return name in insp.get_table_names()


def upgrade() -> None:
    if not _has_table("games"):
        op.create_table(
            "games",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("booking_id", sa.Integer(), nullable=False),
            sa.Column("organizer_id", sa.Integer(), nullable=False),
            sa.Column("name", sqlmodel.VARCHAR(length=100), nullable=False),
            sa.Column("description", sqlmodel.VARCHAR(length=1000), nullable=True),
            sa.Column("sport", sqlmodel.VARCHAR(length=30), nullable=False, server_default="football"),
            sa.Column("visibility", sqlmodel.VARCHAR(), nullable=False, server_default="public"),
            sa.Column("join_policy", sqlmodel.VARCHAR(), nullable=False, server_default="open"),
            sa.Column("max_players", sa.Integer(), nullable=False),
            sa.Column("skill_level", sqlmodel.VARCHAR(), nullable=False, server_default="intermediate"),
            sa.Column("payment_mode", sqlmodel.VARCHAR(), nullable=False, server_default="split_payment"),
            sa.Column("status", sqlmodel.VARCHAR(), nullable=False, server_default="open"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], name="fk_games_booking_id"),
            sa.ForeignKeyConstraint(["organizer_id"], ["users.id"], name="fk_games_organizer_id"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("booking_id", name="uq_games_booking_id"),
            sa.CheckConstraint("max_players > 0", name="ck_games_max_players_positive"),
        )
        op.create_index(op.f("ix_games_booking_id"), "games", ["booking_id"])
        op.create_index(op.f("ix_games_organizer_id"), "games", ["organizer_id"])
        op.create_index(op.f("ix_games_sport"), "games", ["sport"])
        op.create_index(op.f("ix_games_visibility"), "games", ["visibility"])
        op.create_index(op.f("ix_games_status"), "games", ["status"])

    if not _has_table("game_participants"):
        op.create_table(
            "game_participants",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("game_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("role", sqlmodel.VARCHAR(), nullable=False, server_default="member"),
            sa.Column("status", sqlmodel.VARCHAR(), nullable=False, server_default="accepted"),
            sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("left_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["game_id"], ["games.id"], name="fk_game_participants_game_id"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_game_participants_user_id"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("game_id", "user_id", name="uq_game_participant_game_user"),
        )
        op.create_index(op.f("ix_game_participants_game_id"), "game_participants", ["game_id"])
        op.create_index(op.f("ix_game_participants_user_id"), "game_participants", ["user_id"])
        op.create_index(op.f("ix_game_participants_status"), "game_participants", ["status"])

    if not _has_table("game_join_requests"):
        op.create_table(
            "game_join_requests",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("game_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("status", sqlmodel.VARCHAR(), nullable=False, server_default="pending"),
            sa.Column("message", sqlmodel.VARCHAR(length=300), nullable=True),
            sa.Column("reviewed_by", sa.Integer(), nullable=True),
            sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["game_id"], ["games.id"], name="fk_game_join_requests_game_id"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_game_join_requests_user_id"),
            sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"], name="fk_game_join_requests_reviewed_by"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_game_join_requests_game_id"), "game_join_requests", ["game_id"])
        op.create_index(op.f("ix_game_join_requests_user_id"), "game_join_requests", ["user_id"])
        op.create_index(op.f("ix_game_join_requests_status"), "game_join_requests", ["status"])

    if not _has_table("game_invitations"):
        op.create_table(
            "game_invitations",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("game_id", sa.Integer(), nullable=False),
            sa.Column("invited_user_id", sa.Integer(), nullable=False),
            sa.Column("invited_by", sa.Integer(), nullable=False),
            sa.Column("status", sqlmodel.VARCHAR(), nullable=False, server_default="pending"),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["game_id"], ["games.id"], name="fk_game_invitations_game_id"),
            sa.ForeignKeyConstraint(["invited_user_id"], ["users.id"], name="fk_game_invitations_invited_user_id"),
            sa.ForeignKeyConstraint(["invited_by"], ["users.id"], name="fk_game_invitations_invited_by"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("game_id", "invited_user_id", name="uq_game_invitation_game_user"),
        )
        op.create_index(op.f("ix_game_invitations_game_id"), "game_invitations", ["game_id"])
        op.create_index(op.f("ix_game_invitations_invited_user_id"), "game_invitations", ["invited_user_id"])
        op.create_index(op.f("ix_game_invitations_status"), "game_invitations", ["status"])

    if not _has_table("game_invite_links"):
        op.create_table(
            "game_invite_links",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("game_id", sa.Integer(), nullable=False),
            sa.Column("token", sqlmodel.VARCHAR(length=64), nullable=False),
            sa.Column("created_by", sa.Integer(), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("max_uses", sa.Integer(), nullable=True),
            sa.Column("uses_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["game_id"], ["games.id"], name="fk_game_invite_links_game_id"),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], name="fk_game_invite_links_created_by"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("token", name="uq_game_invite_links_token"),
        )
        op.create_index(op.f("ix_game_invite_links_game_id"), "game_invite_links", ["game_id"])
        op.create_index(op.f("ix_game_invite_links_token"), "game_invite_links", ["token"])
        op.create_index(op.f("ix_game_invite_links_is_active"), "game_invite_links", ["is_active"])

    if not _has_table("game_waitlist"):
        op.create_table(
            "game_waitlist",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("game_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("position", sa.Integer(), nullable=False),
            sa.Column("status", sqlmodel.VARCHAR(), nullable=False, server_default="waitlisted"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["game_id"], ["games.id"], name="fk_game_waitlist_game_id"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_game_waitlist_user_id"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("game_id", "user_id", name="uq_game_waitlist_game_user"),
            sa.CheckConstraint("position > 0", name="ck_game_waitlist_position_positive"),
        )
        op.create_index(op.f("ix_game_waitlist_game_id"), "game_waitlist", ["game_id"])
        op.create_index(op.f("ix_game_waitlist_user_id"), "game_waitlist", ["user_id"])
        op.create_index(op.f("ix_game_waitlist_status"), "game_waitlist", ["status"])

    if not _has_table("game_payments"):
        op.create_table(
            "game_payments",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("game_id", sa.Integer(), nullable=False),
            sa.Column("participant_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("amount", sa.Integer(), nullable=False),
            sa.Column("status", sqlmodel.VARCHAR(), nullable=False, server_default="pending"),
            sa.Column("gateway", sqlmodel.VARCHAR(), nullable=False, server_default="mock"),
            sa.Column("payment_reference", sqlmodel.VARCHAR(), nullable=True),
            sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["game_id"], ["games.id"], name="fk_game_payments_game_id"),
            sa.ForeignKeyConstraint(["participant_id"], ["game_participants.id"], name="fk_game_payments_participant_id"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_game_payments_user_id"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_game_payments_game_id"), "game_payments", ["game_id"])
        op.create_index(op.f("ix_game_payments_participant_id"), "game_payments", ["participant_id"])
        op.create_index(op.f("ix_game_payments_user_id"), "game_payments", ["user_id"])
        op.create_index(op.f("ix_game_payments_status"), "game_payments", ["status"])
        op.create_index(op.f("ix_game_payments_payment_reference"), "game_payments", ["payment_reference"])


def downgrade() -> None:
    # ترتیب معکوس وابستگی‌ها
    for table in (
        "game_payments",
        "game_waitlist",
        "game_invite_links",
        "game_invitations",
        "game_join_requests",
        "game_participants",
        "games",
    ):
        if _has_table(table):
            op.drop_table(table)
