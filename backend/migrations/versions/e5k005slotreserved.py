"""slots: add RESERVED status + protect sold contract slots

Revision ID: e5k005slotreserved
Revises: d4j004baseline
Create Date: 2026-09-15

ستون status در postgres یک enum native با نام slotstatus است (SQLAlchemy
مقدار enum را بر اساس NAME عضو ذخیره می‌کند، یعنی برچسب بزرگ «RESERVED»).
ALTER TYPE ... ADD VALUE نمی‌تواند داخل ترنزکشن معمولی alembic اجرا شود
(به‌ویژه روی PG قدیمی)؛ برای همین از autocommit_block استفاده می‌شود تا
مقدار جدید commit شود و بعد از آن backfill در ترنزکشن جدید قابل استفاده باشد.
SQLite (تست‌ها) native enum ندارد؛ create_all همیشه از مدل مقدار جدید را
می‌گیرد و این مهاجرت روی آن عملاً UPDATE فقط است.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e5k005slotreserved"
down_revision: Union[str, None] = "d4j004baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(name: str) -> bool:
    return name in sa.inspect(op.get_bind()).get_table_names()


def upgrade() -> None:
    bind = op.get_bind()
    is_pg = bind.dialect.name == "postgresql"

    if is_pg:
        has_enum = bind.execute(
            sa.text("SELECT 1 FROM pg_type WHERE typname = 'slotstatus'")
        ).scalar()
        if has_enum:
            # ADD VALUE بیرون از ترنزکشن مهاجرت اجرا و commit می‌شود
            with op.get_context().autocommit_block():
                op.execute("ALTER TYPE slotstatus ADD VALUE IF NOT EXISTS 'RESERVED'")

    if _table_exists("slots"):
        # داده قدیمی: سانس‌های فروش‌رفته‌ی قراردادِ فعال که اشتباهاً AVAILABLE بودند
        # به RESERVED تبدیل می‌شوند تا قابل رزرو عمومی نمانند.
        op.execute(
            """
            UPDATE slots
            SET status = 'RESERVED'
            WHERE status = 'AVAILABLE'
              AND is_contract_slot = true
              AND (
                    EXISTS (
                        SELECT 1 FROM contracts c
                        WHERE c.id = slots.contract_id AND c.status = 'ACTIVE'
                    )
                    OR (
                        slots.contract_id IS NULL AND EXISTS (
                            SELECT 1
                            FROM contract_slots cs
                            JOIN contracts c2 ON c2.id = cs.contract_id
                            WHERE cs.slot_id = slots.id AND c2.status = 'ACTIVE'
                        )
                    )
              )
            """
        )


def downgrade() -> None:
    if _table_exists("slots"):
        op.execute("UPDATE slots SET status = 'AVAILABLE' WHERE status = 'RESERVED'")
    # حذف مقدار از enum نوع postgres عملاً ممکن/مطلوب نیست؛ مقدار باقی می‌ماند
    # و توسط اپلیکیشن استفاده نخواهد شد.
