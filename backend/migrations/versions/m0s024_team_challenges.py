# backend/migrations/versions/m0s024_team_challenges.py
"""چالش بازی بین تیم‌ها (P010): جدول team_challenges + enum `challengestatus`.

چرا این شکل:
- مقدار persist‌شدهٔ enum NAME عضو است (رفتار SQLAlchemy؛ اندازه‌گیری‌شده در m0s022)
  ⇒ برچسب‌ها بزرگ‌نویس‌اند و ستون NOT NULL بدون server_default؛ سرویس همیشه مقدار
  می‌دهد (الگوی staff_shifts در m0s023).
- دو ستون هم‌جدول به `teams` ⇒ FK با نام‌های صریح و بدون constraint یکتای جهت‌دار:
  «یک چالش باز برای هر جفت» در سرویس نگه داشته می‌شود چون SQL جهت را یکی نمی‌بیند.
- `expires_at` نمایان است چون انقضا تنبل هنگام خواندن/پاسخ رخ می‌دهد و فهرست‌ها باید
  بتوانند «در انتظارِ مانده» را ایندکس‌شده پیدا کنند.
- idempotent (الگوی m0s021/m0s023) تا روی DBای که بخشی‌اش را `create_all` ساخته،
  اجرای دوباره نشکند.
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "m0s024teamchallenges"
down_revision: Union[str, None] = "m0s023staffshifts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

STATUS_LABELS = ("PENDING", "ACCEPTED", "DECLINED", "CANCELLED", "EXPIRED")
INDEXED = ("from_team_id", "to_team_id", "created_by", "status", "expires_at")


def _insp():
    return sa.inspect(op.get_bind())


def _has_table(table: str) -> bool:
    return table in _insp().get_table_names()


def _is_pg() -> bool:
    return op.get_bind().dialect.name == "postgresql"


def _dt(**kw) -> sa.DateTime:
    return sa.DateTime(timezone=True, **kw)


def upgrade() -> None:
    if not _has_table("team_challenges"):
        op.create_table(
            "team_challenges",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("from_team_id", sa.Integer(), nullable=False),
            sa.Column("to_team_id", sa.Integer(), nullable=False),
            sa.Column("created_by", sa.Integer(), nullable=False),
            sa.Column("accepted_by", sa.Integer(), nullable=True),
            sa.Column("responded_at", _dt(), nullable=True),
            sa.Column("message", sqlmodel.VARCHAR(length=300), nullable=True),
            sa.Column("response_note", sqlmodel.VARCHAR(length=300), nullable=True),
            sa.Column("proposed_date", sa.Date(), nullable=True),
            sa.Column("proposed_time", sa.Time(), nullable=True),
            sa.Column("proposed_venue_id", sa.Integer(), nullable=True),
            sa.Column("status", sa.Enum(*STATUS_LABELS, name="challengestatus"),
                      nullable=False),
            sa.Column("expires_at", _dt(), nullable=False),
            sa.Column("created_at", _dt(), nullable=False),
            sa.Column("updated_at", _dt(), nullable=False),
            sa.ForeignKeyConstraint(["from_team_id"], ["teams.id"]),
            sa.ForeignKeyConstraint(["to_team_id"], ["teams.id"]),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
            sa.ForeignKeyConstraint(["accepted_by"], ["users.id"]),
            sa.ForeignKeyConstraint(["proposed_venue_id"], ["venues.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    existing = {i.get("name") for i in _insp().get_indexes("team_challenges")}
    for column in INDEXED:
        name = f"ix_team_challenges_{column}"
        if name not in existing:
            op.create_index(name, "team_challenges", [column], unique=False)


def downgrade() -> None:
    if _has_table("team_challenges"):
        existing = {i.get("name") for i in _insp().get_indexes("team_challenges")}
        for column in INDEXED:
            name = f"ix_team_challenges_{column}"
            if name in existing:
                op.drop_index(name, table_name="team_challenges")
        op.drop_table("team_challenges")
    if _is_pg():
        # روی SQLite نوع VARCHAR+CHECK است و DROP TYPE بی‌اثر؛ شاخهٔ dialect الگوی m0s021
        op.execute("DROP TYPE IF EXISTS challengestatus")
