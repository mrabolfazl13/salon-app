# backend/migrations/versions/m0s025_tournament_round_robin.py
"""فرمت `ROUND_ROBIN` روی enum `tournamentformat` (P005/C2.5).

چرا این مهاجرت اصلاً لازم است (ادعای قبلیِ خودِ مدل غلط بود، اندازه‌گیری شد):
- روی PostgreSQL `tournaments.format` یک نوع enum *native* به نام `tournamentformat` است
  و فقط برچسب `SINGLE_ELIMINATION` را دارد؛ پس عضو تازه با `ALTER TYPE … ADD VALUE`
  اضافه می‌شود، نه با تغییر ستون.
- روی SQLite همان ستون `VARCHAR(18)` **بدون هیچ CHECK** است (DDLِ ساختۀ مهاجرت از
  `sqlite_master` خوانده شد)، پس چیزی برای بازسازی جدول لازم نیست و شاخه بی‌اثر است.
  اگر این شاخه روی SQLite اجرا می‌شد: `near "TYPE": syntax error`.
- `ADD VALUE` تا کامیت شدن قابل‌استفاده نیست، پس داخل `autocommit_block()` (الگوی رسمی
  alembic، همان m0s021 برای `userrole`).
- برچسب‌ها نامِ عضو هستند (رفتار SQLAlchemy): `'ROUND_ROBIN'` ذخیره می‌شود و
  `.value` کوچک (`round_robin`) فقط در Python دیده می‌شود.
- downgrade عمداً برچسب را حذف نمی‌کند: PostgreSQL حذف یک مقدار enum را مستقیم پشتیبانی
  نمی‌کند (بازنویسی نوع لازم است) و تا زمانی که ردي با آن مقدار exists است، حذف یعنی خرابی.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "m0s025roundrobin"
down_revision: Union[str, None] = "m0s024teamchallenges"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TYPE_NAME = "tournamentformat"
NEW_LABEL = "ROUND_ROBIN"


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


def upgrade() -> None:
    if _is_pg() and NEW_LABEL not in _enum_labels(TYPE_NAME):
        with op.get_context().autocommit_block():
            op.execute(
                f"ALTER TYPE {TYPE_NAME} ADD VALUE IF NOT EXISTS '{NEW_LABEL}'"
            )


def downgrade() -> None:
    # مقدار نگه داشته می‌شود (توضیح بالا). ساختار جدول دست‌نخورده است، پس
    # down/up دوباره این مهاجرت را بی‌ضرر می‌کند (idempotent: `IF NOT EXISTS`).
    pass
