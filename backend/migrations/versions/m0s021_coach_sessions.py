# backend/migrations/versions/m0s021_coach_sessions.py
"""نقش مربی (P004): مقدار `COACH` روی enum کاربر + جدول coach_sessions.

دو نکته که این مهاجرت را از الگوی m0s013–m0s020 جدا می‌کند:
- `users.role` روی PostgreSQL یک enum *native* است (`userrole`) ⇒ مقدار جدید با
  `ALTER TYPE … ADD VALUE` اضافه می‌شود، نه `ADD COLUMN`. این دستور تا کامیت
  شدن قابل‌استفاده نیست، پس داخل `autocommit_block()` اجرا می‌شود (الگوی رسمی
  alembic برای ALTER TYPE).
- برچسب‌های enum نامِ عضو هستند (رفتار SQLAlchemy): 'USER'، 'VENUE_MANAGER'… ⇒
  برچسب جدید 'COACH' است و `.value` کوچک (`coach`) فقط در Python دیده می‌شود.
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "m0s021coachesessions"
down_revision: Union[str, None] = "m0s020userfmctoken"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

STATUS_LABELS = ("SCHEDULED", "ATTENDED", "ABSENT", "CANCELLED")
INDEXED = ("coach_id", "client_id", "venue_id", "slot_id",
           "starts_at", "ends_at", "status")


def _insp():
    return sa.inspect(op.get_bind())


def _has_table(table: str) -> bool:
    return table in _insp().get_table_names()


def _is_pg() -> bool:
    return op.get_bind().dialect.name == "postgresql"


def _enum_labels(type_name: str) -> list:
    """برچسب‌های یک enum native؛ روی SQLite چنین چیزی وجود ندارد ⇒ لیست خالی."""
    if not _is_pg():
        return []
    rows = op.get_bind().execute(sa.text(
        "SELECT e.enumlabel FROM pg_type t "
        "JOIN pg_enum e ON e.enumtypid = t.oid "
        "WHERE t.typname = :name ORDER BY e.enumsortorder"
    ), {"name": type_name}).fetchall()
    return [r[0] for r in rows]


def _dt(**kw) -> sa.DateTime:
    return sa.DateTime(timezone=True, **kw)


def upgrade() -> None:
    # ۱) نقش مربی — فقط PostgreSQL enum native دارد؛ روی SQLite ستون VARCHAR است
    #    (با CHECK از create_all مدل) ⇒ این شاخه نباید اصلاً اجرا شود، وگرنه
    #    «near "TYPE": syntax error». idempotent: اگر برچسب هست، دستوری نمی‌run.
    if _is_pg() and "COACH" not in _enum_labels("userrole"):
        with op.get_context().autocommit_block():
            op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'COACH'")

    # ۲) جدول جلسات (enum coachesessionstatus خود create_table می‌سازد)
    if not _has_table("coach_sessions"):
        op.create_table(
            "coach_sessions",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("coach_id", sa.Integer(), nullable=False),
            sa.Column("client_id", sa.Integer(), nullable=False),
            sa.Column("venue_id", sa.Integer(), nullable=True),
            sa.Column("slot_id", sa.Integer(), nullable=True),
            sa.Column("starts_at", _dt(), nullable=False),
            sa.Column("ends_at", _dt(), nullable=False),
            sa.Column("duration_min", sa.Integer(), nullable=False),
            sa.Column("status", sa.Enum(*STATUS_LABELS, name="coachesessionstatus"),
                      nullable=False),
            sa.Column("fee", sa.Integer(), nullable=False),
            sa.Column("fee_settled", sa.Boolean(), nullable=False),
            sa.Column("notes", sqlmodel.VARCHAR(length=500), nullable=True),
            sa.Column("attended_at", _dt(), nullable=True),
            sa.Column("marked_by", sa.Integer(), nullable=True),
            sa.Column("created_at", _dt(), nullable=False),
            sa.Column("updated_at", _dt(), nullable=False),
            sa.ForeignKeyConstraint(["coach_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["client_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"]),
            sa.ForeignKeyConstraint(["slot_id"], ["slots.id"]),
            sa.ForeignKeyConstraint(["marked_by"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    existing = {i.get("name") for i in _insp().get_indexes("coach_sessions")}
    for column in INDEXED:
        name = f"ix_coach_sessions_{column}"
        if name not in existing:
            op.create_index(name, "coach_sessions", [column], unique=False)


def downgrade() -> None:
    if _has_table("coach_sessions"):
        existing = {i.get("name") for i in _insp().get_indexes("coach_sessions")}
        for column in INDEXED:
            name = f"ix_coach_sessions_{column}"
            if name in existing:
                op.drop_index(name, table_name="coach_sessions")
        op.drop_table("coach_sessions")
    if _is_pg():
        op.execute("DROP TYPE IF EXISTS coachesessionstatus")
    # 'COACH' از userrole حذف نمی‌شود: PostgreSQL حذف یک مقدار enum را مستقیم
    # پشتیبانی نمی‌کند (نیاز به بازنویسی ستون دارد) و باقی‌ماندنش بی‌ضرر است.
