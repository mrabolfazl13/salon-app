# backend/migrations/versions/m0s027_reconciliation_reports.py
"""C14: جدولِ گزارش مغایرگیری بالاخره ساخته می‌شود (`reconciliation_reports`).

چرا لازم بود (اندازه‌گیری‌شده، نه حدس): `app/models/reconciliation_report.py` در
ریپو **وجود نداشت** — فقط دو importِ داخل `try/except ImportError` در
`api/v1/reconciliation.py` و یک `# Save to database (assuming …table exists)` در
کارِ Celery. پس `GET /reconciliation/reports` همیشه `{"total": 0, "items": []}`
برمی‌گرداند («همه‌چیز درست است» کاذب) و مغایرت‌های پولی فقط در لاگ می‌سوختند.

دو شاهدِ DDL که همین‌جا نوشته استفاده شد (روی SQLite، با `create_all` از خودِ مدل):
۱) `status VARCHAR(12)` **بدون CHECK** — برچسب‌ها نام‌های enum‌اند
   (`COMPLETED`=9، `ISSUES_FOUND`=12 ⇒ طول ۱۲)؛ روی PostgreSQL همان
   `sa.Enum(..., name="reconciliationstatus")` نوع native می‌سازد، پس `create_table`
   (برخلاف `add_column` درسِ m0s026) خودش نوع را می‌سازد و DROP TYPE در
   downgrade لازم است.
۲) چهار ایندکسِ خودکار از `index=True` (period_from/period_to/status/triggered_by)
   با نام `ix_reconciliation_reports_<ستون>` ساخته می‌شوند؛ همین نام‌ها صریح
   گذاشته شده‌اند تا DBِ alembic‌ساز و DBِ create_all یک شکل باشند.

ایدپوتنت در برابر create_all (الگوی a1g001/m0s023): جدول فقط در صورت نبود ساخته
می‌شود و ایندکس‌ها با بررسی `get_indexes`.
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "m0s027reconreports"
down_revision: Union[str, None] = "m0s026doubleelim"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = "reconciliation_reports"
STATUS_TYPE = "reconciliationstatus"
STATUS_LABELS = ("COMPLETED", "ISSUES_FOUND")
INDEXED = ("period_from", "period_to", "status", "triggered_by")


def _is_pg() -> bool:
    return op.get_bind().dialect.name == "postgresql"


def _has_table(name: str) -> bool:
    return name in sa.inspect(op.get_bind()).get_table_names()


def upgrade() -> None:
    if not _has_table(TABLE):
        op.create_table(
            TABLE,
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("period_from", sa.Date(), nullable=False),
            sa.Column("period_to", sa.Date(), nullable=False),
            sa.Column("status", sa.Enum(*STATUS_LABELS, name=STATUS_TYPE), nullable=False),
            sa.Column("payments_checked", sa.Integer(), nullable=False),
            sa.Column("ledger_income_rows", sa.Integer(), nullable=False),
            sa.Column("mismatch_count", sa.Integer(), nullable=False),
            sa.Column("mismatches", sqlmodel.VARCHAR(), nullable=False),
            sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("triggered_by", sa.Integer(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("period_from", "period_to", name="uq_reconciliation_period"),
            sa.ForeignKeyConstraint(["triggered_by"], ["users.id"],
                                    name="fk_reconciliation_reports_triggered_by"),
        )

    existing = {i.get("name") for i in sa.inspect(op.get_bind()).get_indexes(TABLE)}
    for column in INDEXED:
        name = f"ix_{TABLE}_{column}"
        if name not in existing:
            op.create_index(name, TABLE, [column], unique=False)


def downgrade() -> None:
    if _has_table(TABLE):
        existing = {i.get("name") for i in sa.inspect(op.get_bind()).get_indexes(TABLE)}
        for column in INDEXED:
            name = f"ix_{TABLE}_{column}"
            if name in existing:
                op.drop_index(name, table_name=TABLE)
        op.drop_table(TABLE)
    if _is_pg():
        # روی SQLite نوع VARCHAR است و DROP TYPE بی‌اثر (الگوی m0s023)
        op.execute("DROP TYPE IF EXISTS reconciliationstatus")
