# backend/migrations/versions/m0s020_user_fcm_token.py
"""users.fcm_token — ستون توکن پوش FCM

این مهاجرت هرگز در زنجیره نبود: نسخه‌اش زیر `backend/alembic/versions/` گذاشته
شده بود در حالی که `alembic.ini` مقدار `script_location = migrations` را استفاده
می‌کند ⇒ روی prod ستون دستی ALTER شده بود و زنجیره از آن بی‌خبر بود (اسکیما با
مدل نمی‌خواند). الگوی idempotent همان m0s013–m0s019.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "m0s020userfmctoken"
down_revision: Union[str, None] = "m0s019teamduesrecurrence"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _cols() -> set[str]:
    return {c["name"] for c in sa.inspect(op.get_bind()).get_columns("users")}


def _indexes() -> set[str]:
    return {i["name"] for i in sa.inspect(op.get_bind()).get_indexes("users")}


def upgrade() -> None:
    if "fcm_token" not in _cols():
        with op.batch_alter_table("users") as batch:
            batch.add_column(sa.Column("fcm_token", sa.String(length=500), nullable=True))
    if "ix_users_fcm_token" not in _indexes():
        op.create_index("ix_users_fcm_token", "users", ["fcm_token"], unique=False)


def downgrade() -> None:
    if "ix_users_fcm_token" in _indexes():
        op.drop_index("ix_users_fcm_token", table_name="users")
    if "fcm_token" in _cols():
        with op.batch_alter_table("users") as batch:
            batch.drop_column("fcm_token")
