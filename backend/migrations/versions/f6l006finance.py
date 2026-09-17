"""add finance ledger tables (financial_transactions, expense_categories)

Revision ID: f6l006finance
Revises: e5k005slotreserved
Create Date: 2026-09-15

ایدپوتنت در برابر create_all: هر جدول فقط در صورت نبود ساخته می‌شود
(همان الگوی a1g001games01). SQLite-safe: تنها CHECK محدود به amount > 0 است.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = "f6l006finance"
down_revision: Union[str, None] = "e5k005slotreserved"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(name: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    return name in insp.get_table_names()


def upgrade() -> None:
    if not _has_table("expense_categories"):
        op.create_table(
            "expense_categories",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("venue_id", sa.Integer(), nullable=True),
            sa.Column("name", sqlmodel.VARCHAR(length=100), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], name="fk_expense_categories_venue_id"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_expense_categories_venue_id"), "expense_categories", ["venue_id"])
        op.create_index(op.f("ix_expense_categories_is_active"), "expense_categories", ["is_active"])

    if not _has_table("financial_transactions"):
        op.create_table(
            "financial_transactions",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("idempotency_key", sqlmodel.VARCHAR(length=120), nullable=True),
            sa.Column("type", sqlmodel.VARCHAR(), nullable=False),
            sa.Column("direction", sqlmodel.VARCHAR(), nullable=False),
            sa.Column("amount", sa.Integer(), nullable=False),
            sa.Column("method", sqlmodel.VARCHAR(), nullable=False, server_default="cash"),
            sa.Column("status", sqlmodel.VARCHAR(), nullable=False, server_default="cleared"),
            sa.Column("counterparty", sa.Integer(), nullable=True),
            sa.Column("counterparty_type", sqlmodel.VARCHAR(), nullable=True),
            sa.Column("counterparty_ref", sa.Integer(), nullable=True),
            sa.Column("venue_id", sa.Integer(), nullable=True),
            sa.Column("expense_category_id", sa.Integer(), nullable=True),
            sa.Column("source_type", sqlmodel.VARCHAR(), nullable=False, server_default="manual"),
            sa.Column("source_id", sa.Integer(), nullable=True),
            sa.Column("description", sqlmodel.VARCHAR(length=500), nullable=False, server_default=""),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("cleared_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("void_reason", sqlmodel.VARCHAR(length=300), nullable=True),
            sa.ForeignKeyConstraint(["counterparty"], ["users.id"], name="fk_financial_transactions_counterparty"),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], name="fk_financial_transactions_venue_id"),
            sa.ForeignKeyConstraint(["expense_category_id"], ["expense_categories.id"],
                                    name="fk_financial_transactions_expense_category_id"),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], name="fk_financial_transactions_created_by"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("idempotency_key", name="uq_financial_transactions_idempotency_key"),
            sa.CheckConstraint("amount > 0", name="ck_financial_transactions_amount_positive"),
        )
        op.create_index(op.f("ix_financial_transactions_idempotency_key"), "financial_transactions", ["idempotency_key"])
        op.create_index(op.f("ix_financial_transactions_type"), "financial_transactions", ["type"])
        op.create_index(op.f("ix_financial_transactions_direction"), "financial_transactions", ["direction"])
        op.create_index(op.f("ix_financial_transactions_status"), "financial_transactions", ["status"])
        op.create_index(op.f("ix_financial_transactions_counterparty"), "financial_transactions", ["counterparty"])
        op.create_index(op.f("ix_financial_transactions_venue_id"), "financial_transactions", ["venue_id"])
        op.create_index(op.f("ix_financial_transactions_expense_category_id"), "financial_transactions", ["expense_category_id"])
        op.create_index(op.f("ix_financial_transactions_source_type"), "financial_transactions", ["source_type"])
        op.create_index(op.f("ix_financial_transactions_occurred_at"), "financial_transactions", ["occurred_at"])


def downgrade() -> None:
    # ترتیب معکوس وابستگی‌ها
    for table in ("financial_transactions", "expense_categories"):
        if _has_table(table):
            op.drop_table(table)