"""team official (quorum) + team chat: teams.is_official/min_members/official_since,
team_members.last_seen_message_at, team_messages + composite index

Revision ID: m0s015teamofficialchat
Revises: m0s014pointsgamewin
Create Date: 2026-09-18

Idempotent pattern (same as m0s013/m0s014): every column/table/index is added only
if absent, so running the whole chain over a create_all-built schema is a clean no-op.
- teams.min_members: NOT NULL with server_default 5 (settings.TEAM_MIN_MEMBERS).
- teams.is_official: NOT NULL with server_default false + index ix_teams_is_official.
- teams.official_since: nullable timestamp.
- team_members.last_seen_message_at: nullable timestamp (chat unread baseline).
- team_messages: chat rows (team_id, user_id FKs, content, created_at) with composite
  index ix_team_messages_team_created(team_id, created_at).
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "m0s015teamofficialchat"
down_revision: Union[str, None] = "m0s014pointsgamewin"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _insp():
    return sa.inspect(op.get_bind())


def _has_table(table: str) -> bool:
    return table in _insp().get_table_names()


def _has_col(table: str, column: str) -> bool:
    return any(c["name"] == column for c in _insp().get_columns(table))


def _has_index(table: str, name: str) -> bool:
    return any(i.get("name") == name for i in _insp().get_indexes(table))


def _add(table: str, column: str, kind: sa.types.TypeEngine, **kw) -> None:
    if _has_col(table, column):
        return
    with op.batch_alter_table(table) as batch:
        batch.add_column(sa.Column(column, kind, **kw))


def upgrade() -> None:
    # ── teams: quorum / official flag + snapshot threshold ──
    _add("teams", "min_members", sa.Integer(), nullable=False,
         server_default=sa.text("5"))
    _add("teams", "is_official", sa.Boolean(), nullable=False,
         server_default=sa.false())
    _add("teams", "official_since", sa.DateTime(timezone=True), nullable=True)
    if not _has_index("teams", "ix_teams_is_official"):
        op.create_index("ix_teams_is_official", "teams", ["is_official"],
                        unique=False)

    # ── team_members: last read marker for chat unread counting ──
    _add("team_members", "last_seen_message_at",
         sa.DateTime(timezone=True), nullable=True)

    # ── team_messages: team chat ──
    if not _has_table("team_messages"):
        op.create_table(
            "team_messages",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("team_id", sa.Integer(),
                      sa.ForeignKey("teams.id"), nullable=False),
            sa.Column("user_id", sa.Integer(),
                      sa.ForeignKey("users.id"), nullable=False),
            sa.Column("content", sqlmodel.VARCHAR(length=2000), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
    if not _has_index("team_messages", "ix_team_messages_team_created"):
        op.create_index("ix_team_messages_team_created", "team_messages",
                        ["team_id", "created_at"], unique=False)


def downgrade() -> None:
    if _has_index("team_messages", "ix_team_messages_team_created"):
        op.drop_index("ix_team_messages_team_created", table_name="team_messages")
    if _has_table("team_messages"):
        op.drop_table("team_messages")

    if _has_index("teams", "ix_teams_is_official"):
        op.drop_index("ix_teams_is_official", table_name="teams")
    for col in ("official_since", "is_official", "min_members"):
        if _has_col("teams", col):
            try:
                op.drop_column("teams", col)
            except Exception:  # noqa: BLE001 - old SQLite lacks DROP COLUMN
                pass
    if _has_col("team_members", "last_seen_message_at"):
        try:
            op.drop_column("team_members", "last_seen_message_at")
        except Exception:  # noqa: BLE001
            pass
