"""venues.phone nullable (real-world data may lack a public phone)

Revision ID: b2h002phonenull
Revises: a1g001games01
Create Date: 2026-09-06
"""
from alembic import op
import sqlalchemy as sa

revision = "b2h002phonenull"
down_revision = "a1g001games01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "venues", "phone",
        existing_type=sa.VARCHAR(length=11),
        nullable=True,
        existing_nullable=False,
    )


def downgrade() -> None:
    op.execute("UPDATE venues SET phone = '' WHERE phone IS NULL")
    op.alter_column(
        "venues", "phone",
        existing_type=sa.VARCHAR(length=11),
        nullable=False,
        existing_nullable=True,
    )
