# backend/migrations/versions/m0s031_eitaa_channel.py
"""C: کانال ایتای سالن — تنظیمات ربات و وضعیت آخرین پست سانسها.

API ایتا (ایتایار) فقط sendMessage/sendFile/getMe دارد؛ ویرایش پیام وجود ندارد.
بنابراین «تیک خوردن ساعت» با ارسال مجدد همان متن پیاده میشود و آخرین
message_id در این جدول نگه داشته میشود تا پست تازه در پاسخ پست قبلی برود.

الگوی ایدپوتنت m0s027: جدول و ایندکس فقط در صورت نبود ساخته میشوند تا هم DBِ
آلمبیک و هم DBِ create_allِ توسعه شکل یکسانی داشته باشند.
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "m0s031eitaa"
down_revision: Union[str, None] = "m0s030redemactor"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = "eitaa_channels"
INDEXES = ("venue_id",)


def _has_table(name: str) -> bool:
    return name in sa.inspect(op.get_bind()).get_table_names()


def upgrade() -> None:
    if not _has_table(TABLE):
        op.create_table(
            TABLE,
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("venue_id", sa.Integer(), nullable=False),
            sa.Column("chat_id", sa.VARCHAR(length=128), nullable=False),
            sa.Column("bot_token", sa.VARCHAR(length=512), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False),
            sa.Column("pin_updates", sa.Boolean(), nullable=False),
            sa.Column("last_post_date", sa.Date(), nullable=True),
            sa.Column("last_message_id", sa.Integer(), nullable=True),
            sa.Column("last_text", sqlmodel.VARCHAR(), nullable=True),
            sa.Column("last_error", sa.VARCHAR(length=500), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("venue_id", name="uq_eitaa_channels_venue_id"),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"],
                                    name="fk_eitaa_channels_venue_id"),
        )

    existing = {i.get("name") for i in sa.inspect(op.get_bind()).get_indexes(TABLE)}
    for column in INDEXES:
        name = f"ix_{TABLE}_{column}"
        if name not in existing:
            op.create_index(name, TABLE, [column], unique=False)


def downgrade() -> None:
    if _has_table(TABLE):
        existing = {i.get("name") for i in sa.inspect(op.get_bind()).get_indexes(TABLE)}
        for column in INDEXES:
            name = f"ix_{TABLE}_{column}"
            if name in existing:
                op.drop_index(name, table_name=TABLE)
        op.drop_table(TABLE)
