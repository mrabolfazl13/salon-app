"""payment modes + receipt workflow: venues.payment_mode + bookings receipt columns

Revision ID: m0s013paymentmodes
Revises: l2r012contractdays
Create Date: 2026-09-17

الگوی idempotent همان g7m007/h8n008 است: هر ستون فقط در صورتِ نبود اضافه می‌شود تا
روی دیتابیس تازه (create_all از مدل) مهاجرت no-op بماند. enumها (VenuePaymentMode
و ReceiptStatus) الگوی VARCHAR-with-Enum-name هستند — native enum نیستند، پس
نیازی به ALTER TYPE/autocommit_block (الگوی e5k005) немає.
- venues.payment_mode: NOT NULL با server_default «bank_receipt».
- bookings: اسنپ‌شوت payment_mode (nullable) + گردش رسید (needs_receipt,
  receipt_status و ستون‌های مرتبط). receipt_reviewed_by یک FK به users.id است.
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "m0s013paymentmodes"
down_revision: Union[str, None] = "l2r012contractdays"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _insp():
    return sa.inspect(op.get_bind())


def _has_col(table: str, column: str) -> bool:
    return any(c["name"] == column for c in _insp().get_columns(table))


def _has_fk(table: str, name: str) -> bool:
    return any(fk.get("name") == name for fk in _insp().get_foreign_keys(table))

def _has_fk_col(table: str, column: str) -> bool:
    return any(column in fk.get("constrained_columns", [])
               for fk in _insp().get_foreign_keys(table))


def _add(table: str, column: str, kind: sa.types.TypeEngine, **kw) -> None:
    if _has_col(table, column):
        return
    op.add_column(table, sa.Column(column, kind, **kw))


def _rows_missing(table: str, where: str) -> int:
    return op.get_bind().execute(
        sa.text(f"SELECT COUNT(*) FROM {table} WHERE {where}")
    ).scalar()


def upgrade() -> None:
    # ── venues: روش پرداخت سالن (پیش‌فرض فیش واریزی) ──
    _add("venues", "payment_mode", sqlmodel.VARCHAR(length=20),
         nullable=False, server_default="bank_receipt")
    # backfill فقط برای ردیف‌های legacy (دیتابیس تازه خالی است و ستونِ آن native
    # enum است — literal مقداری مثل bank_receipt روی آن even با ۰ ردیف هم خطا می‌دهد)
    if _rows_missing("venues", "payment_mode IS NULL"):
        op.execute(
            "UPDATE venues SET payment_mode = 'bank_receipt' "
            "WHERE payment_mode IS NULL"
        )

    # ── bookings: اسنپ‌شوت روش پرداخت + گردش رسید واریزی ──
    _add("bookings", "payment_mode", sqlmodel.VARCHAR(length=20), nullable=True)
    _add("bookings", "needs_receipt", sa.Boolean(),
         nullable=False, server_default=sa.false())
    _add("bookings", "receipt_status", sqlmodel.VARCHAR(length=20),
         nullable=False, server_default="none")
    _add("bookings", "receipt_amount", sa.Integer(), nullable=True)
    _add("bookings", "receipt_reference", sqlmodel.VARCHAR(length=120), nullable=True)
    _add("bookings", "receipt_bank", sqlmodel.VARCHAR(length=100), nullable=True)
    _add("bookings", "receipt_image", sqlmodel.VARCHAR(length=500), nullable=True)
    _add("bookings", "receipt_submitted_at", sa.DateTime(timezone=True), nullable=True)
    _add("bookings", "receipt_reviewed_at", sa.DateTime(timezone=True), nullable=True)
    _add("bookings", "receipt_review_note", sqlmodel.VARCHAR(length=500), nullable=True)
    _add("bookings", "receipt_reviewed_by", sa.Integer(), nullable=True)

    if _has_col("bookings", "receipt_reviewed_by") and not _has_fk_col(
        "bookings", "receipt_reviewed_by"
    ):
        with op.batch_alter_table("bookings") as batch:
            batch.create_foreign_key(
                "fk_bookings_receipt_reviewed_by",
                "users",
                ["receipt_reviewed_by"], ["id"],
            )

    # backfill ایمن — ردیف‌های قدیمی (ستون‌های NOT NULL بالا server_default دارند)
    if _rows_missing("bookings", "receipt_status IS NULL"):
        op.execute(
            "UPDATE bookings SET receipt_status = 'none' "
            "WHERE receipt_status IS NULL"
        )
    if _rows_missing("bookings", "needs_receipt IS NULL"):
        op.execute(
            "UPDATE bookings SET needs_receipt = false WHERE needs_receipt IS NULL"
        )


def downgrade() -> None:
    for col in ("receipt_reviewed_by", "receipt_review_note", "receipt_reviewed_at",
                "receipt_submitted_at", "receipt_image", "receipt_bank",
                "receipt_reference", "receipt_amount", "receipt_status",
                "needs_receipt", "payment_mode"):
        if _has_col("bookings", col):
            try:
                op.drop_column("bookings", col)
            except Exception:  # noqa: BLE001 — SQLite قدیمی DROP COLUMN ندارد
                pass
    if _has_col("venues", "payment_mode"):
        try:
            op.drop_column("venues", "payment_mode")
        except Exception:  # noqa: BLE001
            pass