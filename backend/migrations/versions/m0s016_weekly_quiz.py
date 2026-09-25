"""weekly sports quiz: quiz_questions + quiz_attempts + seed questions

Revision ID: m0s016weeklyquiz
Revises: m0s015teamofficialchat
Create Date: 2026-09-25

الگوی idempotent همان m0s013–m0s015:
- جداول فقط در صورت نبود ساخته می‌شوند (روی دیتابیس create_all نی‌اپ).
- reason جدید وفاداری (quiz) VARCHAR است؛ ALTER TYPE لازم نیست.
- ۱۰ سؤال ورزشی پیش‌فرض فقط وقتی جدول خالی است درج می‌شوند.
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "m0s016weeklyquiz"
down_revision: Union[str, None] = "m0s015teamofficialchat"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _insp():
    return sa.inspect(op.get_bind())


def _has_table(table: str) -> bool:
    return table in _insp().get_table_names()


def _has_index(table: str, name: str) -> bool:
    return any(i.get("name") == name for i in _insp().get_indexes(table))


def _has_unique(table: str, name: str) -> bool:
    return any(c.get("name") == name for c in _insp().get_unique_constraints(table))


SEED_QUESTIONS = [
    # (متن سؤال, [گزینه‌ها], ایندکس درست)
    ("هر تیم فوتسال چند بازیکن داخل زمین دارد؟", ["۵ نفر", "۶ نفر", "۷ نفر", "۱۱ نفر"], 0),
    ("بازی رسمی فوتسال چند دقیقه خالص زمان دارد؟", ["۲×۱۵ دقیقه", "۲×۲۰ دقیقه", "۴۵+۴۵ دقیقه", "۹۰ دقیقه"], 1),
    ("کشور میزبان جام جهانی ۲۰۲۲ کدام بود؟", ["روسیه", "برزیل", "قطر", "ماروکو"], 2),
    ("پرافتخارترین تیم تاریخ لیگ قهرمانان اروپا کدام است؟", ["بارسلونا", "ریال مادرید", "میلان", "بایرن مونیخ"], 1),
    ("تیم والیبال چند بازیکن در زمین دارد؟", ["۵ نفر", "۶ نفر", "۷ نفر", "۱۱ نفر"], 1),
    ("جام جهانی ۲۰۱۸ را کدام کشور برد؟", ["کرواسی", "فرانسه", "بلژیک", "آلمان"], 1),
    ("در بسکتبال NBA هر بازی چند کوارت دارد؟", ["۲ نیمه", "۳ کوارت", "۴ کوارت", "۵ کوارت"], 2),
    ("معروف‌ترین لیگ فوتبال جهان با نام «لا لیگا» در کدام کشور است؟", ["پرتغال", "ایتالیا", "اسپانیا", "آرژانتین"], 2),
    ("حداکثر کارت زردی که یک بازیکن در یک بازی می‌گیرد چند است؟", ["۱", "۲", "۳", "محدود ندارد"], 1),
    ("پرسپولیس چند بار قهرمان آسیا/جام باشگاه‌ها شده است؟", ["۲ بار", "۳ بار", "۴ بار", "۱ بار"], 1),
]


def upgrade() -> None:
    if not _has_table("quiz_questions"):
        op.create_table(
            "quiz_questions",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("text", sqlmodel.VARCHAR(length=300), nullable=False),
            sa.Column("options", sqlmodel.VARCHAR(), nullable=False),
            sa.Column("correct_index", sa.Integer(), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False,
                      server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
    if not _has_index("quiz_questions", "ix_quiz_questions_is_active"):
        op.create_index("ix_quiz_questions_is_active", "quiz_questions",
                        ["is_active"], unique=False)

    if not _has_table("quiz_attempts"):
        op.create_table(
            "quiz_attempts",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(),
                      sa.ForeignKey("users.id"), nullable=False),
            sa.Column("question_id", sa.Integer(),
                      sa.ForeignKey("quiz_questions.id"), nullable=False),
            sa.Column("week_tag", sqlmodel.VARCHAR(length=12), nullable=False),
            sa.Column("answer_index", sa.Integer(), nullable=False),
            sa.Column("is_correct", sa.Boolean(), nullable=False),
            sa.Column("points_awarded", sa.Integer(), nullable=False,
                      server_default=sa.text("0")),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
    for col in ("user_id", "question_id", "week_tag"):
        idx = f"ix_quiz_attempts_{col}"
        if not _has_index("quiz_attempts", idx):
            op.create_index(idx, "quiz_attempts", [col], unique=False)
    if not _has_unique("quiz_attempts", "uq_quiz_attempt_week"):
        with op.batch_alter_table("quiz_attempts") as batch:
            batch.create_unique_constraint(
                "uq_quiz_attempt_week", ["user_id", "question_id", "week_tag"])

    # ── seed — فقط وقتی جدول خالی است ──
    import json
    from datetime import datetime, timezone

    conn = op.get_bind()
    count = conn.exec_driver_sql("SELECT COUNT(*) FROM quiz_questions").scalar()
    if not count:
        now = datetime.now(timezone.utc)
        q_table = sa.table(
            "quiz_questions",
            sa.column("text", sa.String),
            sa.column("options", sa.String),
            sa.column("correct_index", sa.Integer),
            sa.column("is_active", sa.Boolean),
            sa.column("created_at", sa.DateTime),
        )
        conn.execute(q_table.insert().values([
            {
                "text": text,
                "options": json.dumps(options, ensure_ascii=False),
                "correct_index": correct,
                "is_active": True,
                "created_at": now,
            }
            for text, options, correct in SEED_QUESTIONS
        ]))


def downgrade() -> None:
    for table in ("quiz_attempts", "quiz_questions"):
        if _has_table(table):
            op.drop_table(table)
