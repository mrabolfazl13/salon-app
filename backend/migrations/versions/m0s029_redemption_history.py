# backend/migrations/versions/m0s029_redemption_history.py
"""C22.1: ردیفِ مصرفِ کوپن دیگر حذف نمی‌شود ⇒ `status` و `released_at` (راند ۲۷).

تا پیش از این راند لغو/ردِ رزرو با `session.delete(red)` (خدماتِ کوپن) ردیفِ
`coupon_redemptions` را **پاک** می‌کرد، پس فهرستِ «مصرف‌ها» که راند ۲۵ ساخته شد
تاریخچه نبود و فقط مصرفِ جاری را نشان می‌داد. حالا لغو یک انتقالِ وضعیت است:
`ACTIVE` ⇒ `RELEASED` با زمانش.

دو نکتهٔ DDL که همین‌جا لازم آمد:
۱) نوعِ وضعیت روی PostgreSQL **native enum** است (`redemptionstatus`) ⇒ در downgrade
   باید `DROP TYPE` هم برود (الگوی m0s027/m0s028)؛ روی SQLite همان `VARCHAR(8)` است.
۲) ستون با `server_default='ACTIVE'` اضافه می‌شود تا ردیف‌های **از قبل موجود** روی
   prod معناشان را حفظ کنند (سقفِ فردیِ راند ۲۴ شمارش می‌کند، پس هیچ ردیفِ پیشین
   نباید بی‌وضعیت بماند). مدل ORM این server_default را اعلام نمی‌کند — همه‌ی
   نوشتن‌ها خودِ مقدار را صریح می‌فرستند (`insert_within_user_limit` و defaultِ پایتون).

ایدپوتنت در برابر `create_all` (الگوی m0s023/m0s027/m0s028): ستون فقط در صورت نبود
اضافه می‌شود.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "m0s029redemhistory"
down_revision: Union[str, None] = "m0s028memberevents"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = "coupon_redemptions"
STATUS_TYPE = "redemptionstatus"
STATUS_LABELS = ("ACTIVE", "RELEASED")


def _is_pg() -> bool:
    return op.get_bind().dialect.name == "postgresql"


def _columns(name: str) -> set:
    insp = sa.inspect(op.get_bind())
    if name not in insp.get_table_names():
        return set()
    return {c["name"] for c in insp.get_columns(name)}


def _status_type():
    if _is_pg():
        return sa.Enum(*STATUS_LABELS, name=STATUS_TYPE)
    return sa.VARCHAR(length=8)


def upgrade() -> None:
    cols = _columns(TABLE)
    if "status" not in cols:
        enum_type = _status_type()
        if _is_pg():
            enum_type.create(op.get_bind(), checkfirst=True)
        try:
            op.add_column(TABLE, sa.Column("status", enum_type, nullable=False,
                                           server_default="ACTIVE"))
        except Exception:
            if _is_pg():
                op.execute(f"DROP TYPE IF EXISTS {STATUS_TYPE}")
            raise
    if "released_at" not in _columns(TABLE):
        # `timezone=True` مثل `created_at`ِ همین جدول (h8n008:142) — وگرنه ستون‌های
        # زمانِ یک جدول دو نوعِ متفاوت روی PostgreSQL دارند.
        op.add_column(TABLE, sa.Column("released_at", sa.DateTime(timezone=True),
                                       nullable=True))


def downgrade() -> None:
    cols = _columns(TABLE)
    for column in ("released_at", "status"):
        if column in cols:
            op.drop_column(TABLE, column)
    if _is_pg():
        # روی SQLite نوع VARCHAR است و DROP TYPE بی‌اثر (الگوی m0s023)
        op.execute("DROP TYPE IF EXISTS redemptionstatus")
