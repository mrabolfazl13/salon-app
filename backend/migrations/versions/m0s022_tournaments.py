# backend/migrations/versions/m0s022_tournaments.py
"""تورنمنت و براکت (P005): چهار جدول + enum‌های native.

نکته‌هایی که شکل این مهاجرت را تعیین می‌کند (مستند، چون قبلی‌ها این را ندارند):
- مقدار persist‌شدهٔ enum‌ها **NAME** عضو است (اندازه‌گیری شد: `labels=['FINAL', …]`) ⇒
  server_defaultها بزرگ‌نویس‌اند. مهاجرت‌های بازی/تیم مقدار کوچک ('open') گذاشته‌اند
  و همان ستون‌ها پتانسیل ناهمخوانی دارند؛ اینجا عمداً تکرار نشده.
- `tournament_matches.next_match_id` به خود همان جدول FK دارد ⇒ جدول باید یک‌بار
  ساخته شود و نمی‌توان بعداً با ALTER اضافه‌اش کرد (SQLite). پس لینک براکت در همان
  create_table است.
- روی PostgreSQL این enum‌ها نوع *native* می‌سازند، پس downgrade آن‌ها را drop می‌کند؛
  روی SQLite نوع VARCHAR+CHECK است و DROP TYPE بی‌ضرر/بی‌اثر است ⇒ شاخه‌بندی dialect.
- جداول idempotent ساخته می‌شوند (الگوی m0s021) تا اجرای دوباره روی DBای که بخشی‌اش
  create_all ساخته بود، نشکند.
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "m0s022tournaments"
down_revision: Union[str, None] = "m0s021coachesessions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

STATUS_LABELS = ("DRAFT", "REGISTRATION", "DRAWN", "IN_PROGRESS", "COMPLETED", "CANCELLED")
FORMAT_LABELS = ("SINGLE_ELIMINATION",)
PARTICIPANT_LABELS = ("REGISTERED", "WITHDRAWN")
MATCH_LABELS = ("PENDING", "READY", "LIVE", "FINAL", "BYE")

INDEXED = {
    "tournaments": ("name", "organizer_id", "venue_id", "status", "starts_at", "sport",
                    "winner_team_id"),
    "tournament_participants": ("tournament_id", "team_id", "status"),
    "tournament_rounds": ("tournament_id",),
    "tournament_matches": ("tournament_id", "round_id", "team_a_id", "team_b_id",
                           "winner_team_id", "status"),
}

TYPES = {
    "tournaments": "tournamentstatus",
    "tournament_participants": "tournamentparticipantstatus",
    "tournament_rounds": None,
    "tournament_matches": "matchstatus",
}


def _insp():
    return sa.inspect(op.get_bind())


def _has_table(table: str) -> bool:
    return table in _insp().get_table_names()


def _is_pg() -> bool:
    return op.get_bind().dialect.name == "postgresql"


def _dt() -> sa.DateTime:
    return sa.DateTime(timezone=True)


def upgrade() -> None:
    if not _has_table("tournaments"):
        op.create_table(
            "tournaments",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("name", sqlmodel.VARCHAR(length=120), nullable=False),
            sa.Column("description", sqlmodel.VARCHAR(length=1000), nullable=True),
            sa.Column("sport", sqlmodel.VARCHAR(length=30), nullable=False),
            sa.Column("organizer_id", sa.Integer(), nullable=False),
            sa.Column("venue_id", sa.Integer(), nullable=True),
            sa.Column("status", sa.Enum(*STATUS_LABELS, name="tournamentstatus"),
                      server_default="DRAFT", nullable=False),
            sa.Column("format", sa.Enum(*FORMAT_LABELS, name="tournamentformat"),
                      server_default="SINGLE_ELIMINATION", nullable=False),
            sa.Column("starts_at", _dt(), nullable=True),
            sa.Column("entry_fee", sa.Integer(), nullable=False),
            sa.Column("drawn_at", _dt(), nullable=True),
            sa.Column("completed_at", _dt(), nullable=True),
            sa.Column("winner_team_id", sa.Integer(), nullable=True),
            sa.Column("created_at", _dt(), nullable=False),
            sa.Column("updated_at", _dt(), nullable=False),
            sa.ForeignKeyConstraint(["organizer_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"]),
            sa.ForeignKeyConstraint(["winner_team_id"], ["teams.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    if not _has_table("tournament_participants"):
        op.create_table(
            "tournament_participants",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("tournament_id", sa.Integer(), nullable=False),
            sa.Column("team_id", sa.Integer(), nullable=False),
            sa.Column("seed", sa.Integer(), nullable=True),
            sa.Column("status",
                      sa.Enum(*PARTICIPANT_LABELS, name="tournamentparticipantstatus"),
                      server_default="REGISTERED", nullable=False),
            sa.Column("registered_at", _dt(), nullable=False),
            sa.ForeignKeyConstraint(["tournament_id"], ["tournaments.id"]),
            sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("tournament_id", "team_id",
                                name="uq_tournament_participant_tournament_team"),
        )

    if not _has_table("tournament_rounds"):
        op.create_table(
            "tournament_rounds",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("tournament_id", sa.Integer(), nullable=False),
            sa.Column("number", sa.Integer(), nullable=False),
            sa.Column("name", sqlmodel.VARCHAR(length=60), nullable=False),
            sa.ForeignKeyConstraint(["tournament_id"], ["tournaments.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    if not _has_table("tournament_matches"):
        op.create_table(
            "tournament_matches",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("tournament_id", sa.Integer(), nullable=False),
            sa.Column("round_id", sa.Integer(), nullable=False),
            sa.Column("position", sa.Integer(), nullable=False),
            sa.Column("team_a_id", sa.Integer(), nullable=True),
            sa.Column("team_b_id", sa.Integer(), nullable=True),
            sa.Column("score_a", sa.Integer(), nullable=True),
            sa.Column("score_b", sa.Integer(), nullable=True),
            sa.Column("status", sa.Enum(*MATCH_LABELS, name="matchstatus"),
                      server_default="PENDING", nullable=False),
            sa.Column("winner_team_id", sa.Integer(), nullable=True),
            sa.Column("next_match_id", sa.Integer(), nullable=True),
            sa.Column("next_slot", sqlmodel.VARCHAR(length=1), nullable=True),
            sa.Column("played_at", _dt(), nullable=True),
            sa.Column("created_at", _dt(), nullable=False),
            sa.Column("updated_at", _dt(), nullable=False),
            sa.ForeignKeyConstraint(["tournament_id"], ["tournaments.id"]),
            sa.ForeignKeyConstraint(["round_id"], ["tournament_rounds.id"]),
            sa.ForeignKeyConstraint(["team_a_id"], ["teams.id"]),
            sa.ForeignKeyConstraint(["team_b_id"], ["teams.id"]),
            sa.ForeignKeyConstraint(["winner_team_id"], ["teams.id"]),
            # لینک براکت به خودِ همان جدول — بعداً قابل‌افزودن نیست (SQLite)
            sa.ForeignKeyConstraint(["next_match_id"], ["tournament_matches.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("round_id", "position",
                                name="uq_tournament_match_round_position"),
        )

    for table, columns in INDEXED.items():
        existing = {i.get("name") for i in _insp().get_indexes(table)}
        for column in columns:
            name = f"ix_{table}_{column}"
            if name not in existing:
                op.create_index(name, table, [column], unique=False)


def downgrade() -> None:
    for table in reversed(list(INDEXED)):
        if not _has_table(table):
            continue
        existing = {i.get("name") for i in _insp().get_indexes(table)}
        for column in INDEXED[table]:
            name = f"ix_{table}_{column}"
            if name in existing:
                op.drop_index(name, table_name=table)
        op.drop_table(table)
    if _is_pg():
        op.execute("DROP TYPE IF EXISTS matchstatus")
        op.execute("DROP TYPE IF EXISTS tournamentparticipantstatus")
        op.execute("DROP TYPE IF EXISTS tournamentformat")
        op.execute("DROP TYPE IF EXISTS tournamentstatus")
