"""baseline — sync schema with current models (idempotent)

Revision ID: d4j004baseline
Revises: None (root — باید اول اجرا شود تا جداول هسته مثل bookings ساخته شوند)
Create Date: 2026-09-15

این baseline جداول هسته‌ی اپ (users/venues/slots/bookings/contracts/...) را که
تاریخاً با SQLModel create_all ساخته می‌شدند، زیر مدیریت Alembic می‌آورد.
ایدمپوتنت است و همان الگوی a1g001 را دنبال می‌کند: هر جدول فقط در صورت نبود
ساخته می‌شود؛ روی دیتابیس‌های موجود عملاً no-op است.
منبع تعریف جدول‌ها خودِ مدل‌ها (SQLModel.metadata) هستند تا drift نداشته باشیم.

نکته: create_all در main.py فقط مسیر توسعه است (APP_ENV != production و
AUTO_CREATE_ALL=true). در production باید alembic upgrade head اجرا شود.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlmodel import SQLModel

import app.models  # noqa: F401,E402 — ثبت همه جدول‌ها در metadata

revision: str = "d4j004baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _existing_tables() -> set:
    return set(sa.inspect(op.get_bind()).get_table_names())


def upgrade() -> None:
    existing = _existing_tables()
    missing = [t for t in SQLModel.metadata.sorted_tables if t.name not in existing]
    if missing:
        SQLModel.metadata.create_all(op.get_bind(), tables=missing)


def downgrade() -> None:
    # حذف جداولی که baseline ساخته است — فقط برای دیتابیس تازه/تست معنادار است؛
    # روی داده‌ی واقعی اجرا نکنید (destructive by design).
    existing = _existing_tables()
    to_drop = [t for t in reversed(SQLModel.metadata.sorted_tables) if t.name in existing]
    if to_drop:
        SQLModel.metadata.drop_all(op.get_bind(), tables=to_drop)
