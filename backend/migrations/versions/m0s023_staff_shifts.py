# backend/migrations/versions/m0s023_staff_shifts.py
"""شیفت پرسنل (P020): جدول staff_shifts + enum `shiftstatus`.

نکته‌هایی که شکل این مهاجرت را تعیین می‌کند:
- مقدار persist‌شدهٔ enum **NAME** عضو است (رفتار SQLAlchemy؛ اندازه‌گیری‌شده در
  m0s022) ⇒ برچسب‌ها بزرگ‌نویس‌اند و ستون NOT NULL بدون server_default است:
  سرویس همیشه مقدار را می‌دهد (الگوی coach_sessions).
- `ends_at` ستون واقعی است تا هم‌پوشانی در SQL مقایسه شود (همان دلیل coach).
- FK فقط به `venues` و `users`: به `staff_assignments` عمداً FK نیست تا شیفت بعد
  از حذف نرم انتصاب هم بماند (سابقهٔ کاری/حقوق) — اعتبارسنجی در سرویس.
- idempotent (الگوی m0s021) تا روی DBای که بخشی‌اش را `create_all` ساخته، اجرای
  دوباره نشکند.
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "m0s023staffshifts"
down_revision: Union[str, None] = "m0s022tournaments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

STATUS_LABELS = ("SCHEDULED", "DONE", "CANCELLED")
INDEXED = ("venue_id", "user_id", "starts_at", "ends_at", "status")


def _insp():
    return sa.inspect(op.get_bind())


def _has_table(table: str) -> bool:
    return table in _insp().get_table_names()


def _is_pg() -> bool:
    return op.get_bind().dialect.name == "postgresql"


def _dt(**kw) -> sa.DateTime:
    return sa.DateTime(timezone=True, **kw)


def upgrade() -> None:
    if not _has_table("staff_shifts"):
        op.create_table(
            "staff_shifts",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("venue_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("starts_at", _dt(), nullable=False),
            sa.Column("ends_at", _dt(), nullable=False),
            sa.Column("status", sa.Enum(*STATUS_LABELS, name="shiftstatus"),
                      nullable=False),
            sa.Column("notes", sqlmodel.VARCHAR(length=500), nullable=True),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("created_at", _dt(), nullable=False),
            sa.Column("updated_at", _dt(), nullable=False),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    existing = {i.get("name") for i in _insp().get_indexes("staff_shifts")}
    for column in INDEXED:
        name = f"ix_staff_shifts_{column}"
        if name not in existing:
            op.create_index(name, "staff_shifts", [column], unique=False)


def downgrade() -> None:
    if _has_table("staff_shifts"):
        existing = {i.get("name") for i in _insp().get_indexes("staff_shifts")}
        for column in INDEXED:
            name = f"ix_staff_shifts_{column}"
            if name in existing:
                op.drop_index(name, table_name="staff_shifts")
        op.drop_table("staff_shifts")
    if _is_pg():
        # روی SQLite نوع VARCHAR+CHECK است و DROP TYPE بی‌اثر؛ شاخهٔ dialect الگوی m0s021
        op.execute("DROP TYPE IF EXISTS shiftstatus")
