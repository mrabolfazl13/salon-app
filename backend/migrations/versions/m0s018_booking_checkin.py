"""bookings QR check-in columns: check_in_code + checked_in_at + checked_in_by

Revision ID: m0s018bookingcheckin
Revises: m0s017splitpayment
Create Date: 2026-10-09

ستون‌های چک‌این QR مستقیم به مدل Booking اضافه شده بودند ولی مهاجرت نداشتند؛
روی دیتابیس‌های create_all کار می‌کرد و روی prod باعث 500 در
GET /bookings/venue/{id} می‌شد. الگوی idempotent همان m0s013–m0s017.
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "m0s018bookingcheckin"
down_revision: Union[str, None] = "m0s017splitpayment"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _cols(table: str) -> set[str]:
    insp = sa.inspect(op.get_bind())
    return {c["name"] for c in insp.get_columns(table)}


def _indexes(table: str) -> set[str]:
    return {i["name"] for i in sa.inspect(op.get_bind()).get_indexes(table)}


def upgrade() -> None:
    cols = _cols("bookings")
    with op.batch_alter_table("bookings") as batch:
        if "check_in_code" not in cols:
            batch.add_column(sa.Column(
                "check_in_code", sqlmodel.VARCHAR(length=64), nullable=True))
        if "checked_in_at" not in cols:
            batch.add_column(sa.Column(
                "checked_in_at", sa.DateTime(timezone=True), nullable=True))
        if "checked_in_by" not in cols:
            batch.add_column(sa.Column(
                "checked_in_by", sa.Integer(),
                sa.ForeignKey("users.id"), nullable=True))
    if "check_in_code" not in _cols("bookings"):
        return  # defensive: should not happen
    if "ix_bookings_check_in_code" not in _indexes("bookings"):
        op.create_index("ix_bookings_check_in_code", "bookings",
                        ["check_in_code"], unique=False)


def downgrade() -> None:
    if "ix_bookings_check_in_code" in _indexes("bookings"):
        op.drop_index("ix_bookings_check_in_code", table_name="bookings")
    cols = _cols("bookings")
    with op.batch_alter_table("bookings") as batch:
        for col in ("checked_in_by", "checked_in_at", "check_in_code"):
            if col in cols:
                batch.drop_column(col)
