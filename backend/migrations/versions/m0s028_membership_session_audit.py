# backend/migrations/versions/m0s028_membership_session_audit.py
"""C19: جدولِ ممیزیِ «چه کسی، کِی» روی اشتراک (`membership_session_events`).

چرا لازم بود (گرهٔ C15.5.3 که در راند ۱۸ ثبت شد): `consume_session` شمارنده را با
read-modify-write کم می‌کرد و هیچ‌جا نوشته نمی‌شد چه کسی و کِی — پس کسی که جلسات را
یکی‌یکی برای خودش خرج می‌کرد قابل اثبات نبود. الگو همان `contract_audit_events` است
(یک ردیفِ append-only به‌ازای هر اقدام).

دو شاهدِ DDL که همین‌جا استفاده شد (روی SQLite با `create_all` از خودِ مدل):
۱) `event_type VARCHAR(8)` **بدون CHECK** — برچسب‌ها نام‌های enum‌اند
   (`CONSUMED`=8، `REFUNDED`=8)؛ روی PostgreSQL همان `sa.Enum(..., name="sessioneventtype")`
   نوع native می‌سازد، پس DROP TYPE در downgrade لازم است (الگوی m0s027).
۲) چهار ایندکسِ خودکار از `index=True` (purchase_id/venue_id/actor_id/event_type) با
   نام `ix_membership_session_events_<ستون>`؛ همین نام‌ها صریح گذاشته شده‌اند تا DBِ
   alembic‌ساز و DBِ create_all یک شکل باشند.

ایدپوتنت در برابر create_all (الگوی a1g001/m0s023/m0s027): جدول فقط در صورت نبود ساخته
می‌شود و ایندکس‌ها با بررسی `get_indexes`.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "m0s028memberevents"
down_revision: Union[str, None] = "m0s027reconreports"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = "membership_session_events"
EVENT_TYPE = "sessioneventtype"
EVENT_LABELS = ("CONSUMED", "REFUNDED")
INDEXED = ("purchase_id", "venue_id", "actor_id", "event_type")


def _is_pg() -> bool:
    return op.get_bind().dialect.name == "postgresql"


def _has_table(name: str) -> bool:
    return name in sa.inspect(op.get_bind()).get_table_names()


def upgrade() -> None:
    if not _has_table(TABLE):
        op.create_table(
            TABLE,
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("purchase_id", sa.Integer(), nullable=False),
            sa.Column("venue_id", sa.Integer(), nullable=False),
            sa.Column("actor_id", sa.Integer(), nullable=True),
            sa.Column("event_type", sa.Enum(*EVENT_LABELS, name=EVENT_TYPE), nullable=False),
            sa.Column("sessions_remaining_after", sa.Integer(), nullable=True),
            sa.Column("amount", sa.Integer(), nullable=True),
            sa.Column("detail", sa.VARCHAR(length=200), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.ForeignKeyConstraint(["purchase_id"], ["membership_purchases.id"],
                                    name="fk_membership_session_events_purchase_id"),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"],
                                    name="fk_membership_session_events_venue_id"),
            sa.ForeignKeyConstraint(["actor_id"], ["users.id"],
                                    name="fk_membership_session_events_actor_id"),
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
        op.execute("DROP TYPE IF EXISTS sessioneventtype")
