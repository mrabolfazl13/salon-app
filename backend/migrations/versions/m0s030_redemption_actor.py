# backend/migrations/versions/m0s030_redemption_actor.py
"""C24.3: «چه کسی، از کدام مسیر» روی آزادسازیِ مصرفِ کوپن (راند ۲۹).

راند ۲۷ لغو را از `DELETE` به انتقالِ وضعیت تبدیل کرد، ولی ستون‌های آن فقط می‌گفتند
**کِی** (`released_at` = زمانِ سرور). گرهٔ C24.3 همین بود: ردیفِ `RELEASED` نمی‌گفت
مدیر رزرو معلق را رد کرد، خودِ مشتری پیش از تأیید لغو کرد، یا جاروبِ Celery سه روز
بعد سوخت — و راند ۲۲ برای جلسات اشتراک دقیقاً همین را با
`membership_session_events.actor_id` حل کرده بود (`m0s028`).

دو ستون، هر دو nullable:
۱) `released_by` — شناسهٔ کاربر/کارکنان. `None` **مجهولِ مشکوک نیست**: تنها مسیری
   که انسانی ندارد جاروبِ انقضا است و با `released_via = 'PENDING_EXPIRED'` خوانده
   می‌شود.
۲) `released_via` — نامِ enum به‌صورت `VARCHAR(32)`، نه native enum. ارزشش در
   *خواندنِ* تاریخچه است نه در شمارش/فیلتر؛ نوعِ native هم `DROP TYPE` در downgrade
   می‌خواست و هم مهاجرتِ جدا برای هر مسیرِ تازه (هزینه‌ای که m0s029 نشان داد).

دو نکتهٔ DDL که از الگوی m0s026 برداشته شد:
- روی SQLite جدول‌های این DB از `SQLModel.metadata` ساخته می‌شوند (d4j004baseline:38)،
  پس `released_by` یک FK در تعریفِ جدول دارد و `DROP COLUMN` معمولی رد می‌شود
  («unknown column … in foreign key definition») ⇒ downgrade روی SQLite بازسازی
  جدول است (`recreate="always"`).
- FK را صریح فقط روی PG می‌سازیم؛ SQLite `ALTER … ADD CONSTRAINT` ندارد و PRAGMA
  foreign_keys در این پروژه خاموش است.

ایدپوتنت در برابر create_all (الگوی m0s023/m0s027/m0s029): ستون فقط در صورت نبود
اضافه می‌شود.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "m0s030redemactor"
down_revision: Union[str, None] = "m0s029redemhistory"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = "coupon_redemptions"
COLUMNS = ("released_by", "released_via")


def _is_pg() -> bool:
    return op.get_bind().dialect.name == "postgresql"


def _columns() -> set:
    insp = sa.inspect(op.get_bind())
    if TABLE not in insp.get_table_names():
        return set()
    return {c["name"] for c in insp.get_columns(TABLE)}


def _fk_columns() -> set:
    """ستون‌های دارای FK روی جدول (هر naming convention) — الگوی m0s026."""
    out = set()
    for fk in sa.inspect(op.get_bind()).get_foreign_keys(TABLE):
        out.update(fk.get("constrained_columns") or [])
    return out


def upgrade() -> None:
    if "released_by" not in _columns():
        op.add_column(TABLE, sa.Column("released_by", sa.Integer(), nullable=True))
    # شکلِ create_all FK را از مدل می‌گیرد؛ شکلِ alembic‌ساز باید صریح بسازد وگرنه
    # یک DB چرخه‌دسته FK دارد و DBِ تازه‌ی PG ندارد.
    if _is_pg() and "released_by" not in _fk_columns():
        op.create_foreign_key("fk_coupon_redemptions_released_by", TABLE, "users",
                              ["released_by"], ["id"])
    if "released_via" not in _columns():
        op.add_column(TABLE, sa.Column("released_via", sa.VARCHAR(length=32),
                                       nullable=True))


def downgrade() -> None:
    cols = _columns()
    if not cols:            # جدول در مرحلۀ پایین‌تر (m0s022/d4j004) حذف شده
        return
    present = [c for c in reversed(COLUMNS) if c in cols]
    if not present:
        return
    if _is_pg():
        # PG ستون را با FK وابستۀ خودش می‌برد
        for column in present:
            op.drop_column(TABLE, column)
        return
    with op.batch_alter_table(TABLE, recreate="always") as batch_op:
        for column in present:
            batch_op.drop_column(column)
