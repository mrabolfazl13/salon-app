"""multi-day contracts - extra_days JSON-as-string column on contracts

Revision ID: l2r012contractdays
Revises: k1q011contractrequest
Create Date: 2026-09-15

Guard الگوی g7m007/k1q011 (بدون‌تکرار روی create_all/ارتقای دوباره). ستون با
server_default «[]» و NOT NULL — ردیف‌های قدیمی تک‌روزه بازنشانی می‌شوند.
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "l2r012contractdays"
down_revision: Union[str, None] = "k1q011contractrequest"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _insp():
    return sa.inspect(op.get_bind())


def _has_col(table: str, column: str) -> bool:
    return any(c["name"] == column for c in _insp().get_columns(table))


def upgrade() -> None:
    if _has_col("contracts", "extra_days"):
        return
    op.add_column("contracts", sa.Column(
        "extra_days", sqlmodel.VARCHAR(length=32),
        nullable=False, server_default="[]"))


def downgrade() -> None:
    if _has_col("contracts", "extra_days"):
        op.drop_column("contracts", "extra_days")
