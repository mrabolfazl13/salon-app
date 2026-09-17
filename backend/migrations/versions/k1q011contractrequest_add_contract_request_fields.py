"""contract request parity - desired_installments + note on contracts

Revision ID: k1q011contractrequest
Revises: j0p010staffcrm
Create Date: 2026-09-15

دو ستون nullable جدید روی contracts (الگوی idempotent g7m007 - تک‌ستون‌های
nullable روی SQLite با add_column ساده امن‌اند؛ ردیف‌های قدیمی None می‌مانند).
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "k1q011contractrequest"
down_revision: Union[str, None] = "j0p010staffcrm"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _insp():
    return sa.inspect(op.get_bind())


def _has_col(table: str, column: str) -> bool:
    return any(c["name"] == column for c in _insp().get_columns(table))


def _add(table: str, column: str, kind: sa.types.TypeEngine) -> None:
    if _has_col(table, column):
        return
    op.add_column(table, sa.Column(column, kind, nullable=True))


def upgrade() -> None:
    _add("contracts", "desired_installments", sa.Integer())
    _add("contracts", "note", sqlmodel.VARCHAR(length=1000))


def downgrade() -> None:
    for name in ("note", "desired_installments"):
        if _has_col("contracts", name):
            op.drop_column("contracts", name)
