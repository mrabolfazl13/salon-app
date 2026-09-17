"""points expansion: games.result_set + winner_ids + result_set_at

Revision ID: m0s014pointsgamewin
Revises: m0s013paymentmodes
Create Date: 2026-09-18

الگوی idempotent همان m0s013 است: هر ستون فقط در صورتِ نبود اضافه می‌شود تا روی
دیتابیس تازه (create_all از مدل) مهاجرت no-op بماند.
- reasonهای جدید وفاداری (game_win/review) به‌صورت VARCHAR ذخیره می‌شوند
  (h8n008: loyalty_points.reason = VARCHAR(40))، پس هیچ ALTER TYPE/native enum
  لازم نیست؛ فقط اعضای Enum پایتون گسترش یافته‌اند.
- games.result_set: NOT NULL با server_default false.
- games.winner_ids: JSON string (nullable).
- games.result_set_at: timestamp با timezone (nullable).
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "m0s014pointsgamewin"
down_revision: Union[str, None] = "m0s013paymentmodes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _insp():
    return sa.inspect(op.get_bind())


def _has_col(table: str, column: str) -> bool:
    return any(c["name"] == column for c in _insp().get_columns(table))


def _add(table: str, column: str, kind: sa.types.TypeEngine, **kw) -> None:
    if _has_col(table, column):
        return
    op.add_column(table, sa.Column(column, kind, **kw))


def upgrade() -> None:
    _add("games", "result_set", sa.Boolean(),
         nullable=False, server_default=sa.false())
    _add("games", "winner_ids", sqlmodel.VARCHAR(), nullable=True)
    _add("games", "result_set_at", sa.DateTime(timezone=True), nullable=True)
    op.execute("UPDATE games SET result_set = false WHERE result_set IS NULL")


def downgrade() -> None:
    for col in ("result_set_at", "winner_ids", "result_set"):
        if _has_col("games", col):
            try:
                op.drop_column("games", col)
            except Exception:  # noqa: BLE001 — SQLite قدیمی DROP COLUMN ندارد
                pass