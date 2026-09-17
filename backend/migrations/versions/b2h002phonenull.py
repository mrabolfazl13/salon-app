"""venues.phone nullable (real-world data may lack a public phone)

Revision ID: b2h002phonenull
Revises: a1g001games01
Create Date: 2026-09-06

REPAIR (2026-09-15): the previous version emitted a raw op.alter_column ->
`ALTER TABLE venues ALTER COLUMN phone DROP NOT NULL`, which SQLite cannot
even parse ("near ALTER": syntax error), and which also fails on a fresh DB
where tables/venues does not exist yet (it is created later by
d4j004baseline from the models). New behaviour:
- skip when venues/phone is absent (fresh DB: baseline creates it nullable);
- skip when phone is already nullable (create_all-built schema / re-run);
- otherwise use op.batch_alter_table (table recreate + copy), SQLite-safe.
Idempotent against both create_all-built and fresh alembic-upgraded schemas.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2h002phonenull"
down_revision: Union[str, None] = "a1g001games01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _phone_state() -> Union[bool, None]:
    """None = table/column missing (skip); True = column already nullable."""
    insp = sa.inspect(op.get_bind())
    if "venues" not in insp.get_table_names():
        return None
    cols = {c["name"]: c for c in insp.get_columns("venues")}
    if "phone" not in cols:
        return None
    return bool(cols["phone"]["nullable"])


def upgrade() -> None:
    if _phone_state() is not False:
        return
    with op.batch_alter_table("venues") as batch:
        batch.alter_column(
            "phone",
            existing_type=sa.VARCHAR(length=11),
            nullable=True,
            existing_nullable=False,
        )


def downgrade() -> None:
    if _phone_state() is not True:
        return
    op.execute("UPDATE venues SET phone = '' WHERE phone IS NULL")
    with op.batch_alter_table("venues") as batch:
        batch.alter_column(
            "phone",
            existing_type=sa.VARCHAR(length=11),
            nullable=False,
            existing_nullable=True,
        )
