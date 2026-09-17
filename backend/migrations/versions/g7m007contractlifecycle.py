"""contracts: full lifecycle — PENDING/REJECTED states, session rules, installments, audit

Revision ID: g7m007contractlifecycle
Revises: f6l006finance
Create Date: 2026-09-15

وضعیت قرارداد روی postgres یک enum native با نام `contractstatus` است
(SQLAlchemy مقدار را بر اساس NAME عضو ذخیره می‌کند؛ همان الگوی e5k005slotreserved).
ALTER TYPE ... ADD VALUE داخل ترنزکشن مجاز نیست ⇒ autocommit_block.
روی SQLite (تست‌ها) native enum نیست؛ create_all از مدل مقدارهای جدید را
می‌گیرد و این مهاجرت عملاً افزودن ستون/جدول است.

همه عملیات idempotent‌اند (برابر create_all در d4j004baseline): هر ستون/جدول
فقط در صورت نبود ساخته می‌شود تا روی دیتابیس‌های تازه (create_all از مدل) no-op
بماند و روی دیتابیس موجود، مهاجرت واقعی انجام شود.

جدول ContractAmendment عمداً ساخته نشد؛ contract_audit_events (رویداد‌محور،
JSON رشته‌ای در `data`) همان نیاز را با پیچیدگی کمتر پوشش می‌دهد.
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "g7m007contractlifecycle"
down_revision: Union[str, None] = "f6l006finance"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _insp():
    return sa.inspect(op.get_bind())


def _has_table(name: str) -> bool:
    return name in _insp().get_table_names()


def _has_column(table: str, column: str) -> bool:
    if not _has_table(table):
        return False
    return column in {c["name"] for c in _insp().get_columns(table)}


def _add(table: str, column: str, kind: sa.types.TypeEngine, **kw) -> None:
    if _has_column(table, column):
        return
    op.add_column(table, sa.Column(column, kind, **kw))


def upgrade() -> None:
    bind = op.get_bind()
    is_pg = bind.dialect.name == "postgresql"

    # ── ۱) وضعیت‌های جدید چرخه‌ی عمر قرارداد ──
    if is_pg:
        has_enum = bind.execute(
            sa.text("SELECT 1 FROM pg_type WHERE typname = 'contractstatus'")
        ).scalar()
        if has_enum:
            with op.get_context().autocommit_block():
                op.execute("ALTER TYPE contractstatus ADD VALUE IF NOT EXISTS 'PENDING'")
                op.execute("ALTER TYPE contractstatus ADD VALUE IF NOT EXISTS 'REJECTED'")

    # ── ۲) قرارداد: ستون‌های گردش تأیید/رد/لغو + مالی ──
    _add("contracts", "approved_at", sa.DateTime(timezone=True), nullable=True)
    _add("contracts", "approved_by", sa.Integer(), nullable=True)
    _add("contracts", "rejected_at", sa.DateTime(timezone=True), nullable=True)
    _add("contracts", "rejected_by", sa.Integer(), nullable=True)
    _add("contracts", "reject_reason", sqlmodel.VARCHAR(length=500), nullable=True)
    _add("contracts", "cancelled_at", sa.DateTime(timezone=True), nullable=True)
    _add("contracts", "cancelled_by", sa.Integer(), nullable=True)
    _add("contracts", "cancel_reason", sqlmodel.VARCHAR(length=500), nullable=True)
    _add("contracts", "renewal_objection", sa.Boolean(), nullable=False,
         server_default=sa.false())
    _add("contracts", "down_payment_amount", sa.Integer(), nullable=True)
    _add("contracts", "payment_due_day_of_month", sa.Integer(), nullable=True)
    _add("contracts", "cancellation_policy", sqlmodel.Text(), nullable=True)

    if is_pg and _has_table("contracts"):
        for col in ("approved_by", "rejected_by", "cancelled_by"):
            exists = bind.execute(sa.text(
                "SELECT 1 FROM pg_constraint WHERE conname = :n"),
                {"n": f"fk_contracts_{col}"}).scalar()
            if not exists:
                op.execute(
                    f"ALTER TABLE contracts ADD CONSTRAINT fk_contracts_{col} "
                    f"FOREIGN KEY ({col}) REFERENCES users(id)")

    # ── ۳) سانس قرارداد: لایه‌ی رزرو + قواعد تک‌سانس ──
    _add("contract_slots", "status", sqlmodel.VARCHAR(length=20), nullable=False,
         server_default="SCHEDULED")
    _add("contract_slots", "rescheduled_date", sa.Date(), nullable=True)
    _add("contract_slots", "rescheduled_time", sa.Time(), nullable=True)
    _add("contract_slots", "exclusion_reason", sqlmodel.VARCHAR(length=500), nullable=True)
    _add("contract_slots", "handled_by", sa.Integer(), nullable=True)
    _add("contract_slots", "handled_at", sa.DateTime(timezone=True), nullable=True)
    _add("contract_slots", "cancel_requested", sa.Boolean(), nullable=False,
         server_default=sa.false())
    _add("contract_slots", "cancel_requested_at", sa.DateTime(timezone=True), nullable=True)
    _add("contract_slots", "updated_at", sa.DateTime(timezone=True), nullable=True)

    # ── ۴) اقساط: تقویم مالی واقعی ──
    _add("contract_payments", "label", sqlmodel.VARCHAR(length=100), nullable=True)
    _add("contract_payments", "record_type", sqlmodel.VARCHAR(length=20), nullable=True)
    _add("contract_payments", "installment_no", sa.Integer(), nullable=True)
    _add("contract_payments", "is_overdue", sa.Boolean(), nullable=False,
         server_default=sa.false())
    _add("contract_payments", "overdue_notified_at", sa.DateTime(timezone=True), nullable=True)
    _add("contract_payments", "is_voided", sa.Boolean(), nullable=False,
         server_default=sa.false())
    _add("contract_payments", "void_reason", sqlmodel.VARCHAR(length=300), nullable=True)
    _add("contract_payments", "updated_at", sa.DateTime(timezone=True), nullable=True)

    # ── ۵) ممیزی قرارداد ──
    if not _has_table("contract_audit_events"):
        op.create_table(
            "contract_audit_events",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("contract_id", sa.Integer(), nullable=False),
            sa.Column("actor_id", sa.Integer(), nullable=True),
            sa.Column("action", sqlmodel.VARCHAR(length=40), nullable=False),
            sa.Column("data", sqlmodel.Text(), nullable=False, server_default="{}"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["contract_id"], ["contracts.id"],
                                    name="fk_contract_audit_events_contract_id"),
            sa.ForeignKeyConstraint(["actor_id"], ["users.id"],
                                    name="fk_contract_audit_events_actor_id"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_contract_audit_events_contract_id"),
                        "contract_audit_events", ["contract_id"])

    # ── ۶) داده‌ی قدیمی: قراردادها و سانس‌های موجود معتبر می‌مانند ──
    if _has_table("contracts"):
        # سانس‌های SCHEDULED که تاریخشان گذشته هنوز COMPLETED نشده‌اند؛ تسک
        # روزانه این کار را می‌کند — اینجا فقط backfill اولیه برای پایداری گزارش‌ها.
        op.execute(
            """
            UPDATE contract_slots SET status = 'COMPLETED'
            WHERE status = 'SCHEDULED' AND session_date < CURRENT_DATE
            """
        )
        # قرارداد‌های قدیمی بدون تاریخ تأیید — approved_at را از created_at می‌گیرد
        # تا UI پنل مدیر تاریخ معقول نشان دهد (بدون تغییر وضعیت).
        op.execute(
            """
            UPDATE contracts SET approved_at = created_at
            WHERE approved_at IS NULL AND status = 'ACTIVE'
            """
        )


def downgrade() -> None:
    if _has_table("contract_audit_events"):
        op.drop_index(op.f("ix_contract_audit_events_contract_id"),
                      table_name="contract_audit_events")
        op.drop_table("contract_audit_events")
    # حذف ستون‌ها روی SQLite 3.35+ پشتیبانی می‌شود؛ برای سازگاری نسخه‌های قدیمی
    # فقط جدول جدید حذف می‌گردد و ستون‌ها بلااستفاده باقی می‌مانند (مستند).
    for table, cols in {
        "contract_payments": ["updated_at", "void_reason", "is_voided",
                              "overdue_notified_at", "is_overdue", "installment_no",
                              "record_type", "label"],
        "contract_slots": ["updated_at", "cancel_requested_at", "cancel_requested",
                           "handled_at", "handled_by", "exclusion_reason",
                           "rescheduled_time", "rescheduled_date", "status"],
        "contracts": ["cancellation_policy", "payment_due_day_of_month",
                      "down_payment_amount", "renewal_objection", "cancel_reason",
                      "cancelled_by", "cancelled_at", "reject_reason", "rejected_by",
                      "rejected_at", "approved_by", "approved_at"],
    }.items():
        for col in cols:
            if _has_column(table, col):
                try:
                    op.drop_column(table, col)
                except Exception:  # noqa: BLE001 — SQLite قدیمی DROP COLUMN ندارد
                    pass
    # مقدارهای PENDING/REJECTED از enum postgres عملاً حذف نمی‌شوند
    # (همان رویه‌ی e5k005slotreserved)؛ توسط اپلیکیشن استفاده نخواهند شد.