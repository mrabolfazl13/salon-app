"""pricing engine: holidays, pricing rules, coupons, loyalty, favorites, open-slot deals

Revision ID: h8n008pricingloyalty
Replaces: (all promotion/pricing tables + Slot/Booking/Venue/User extras)
Revises: g7m007contractlifecycle
Create Date: 2026-09-15

الگوی idempotent همان g7m007 است: هر جدول/ستون فقط در صورت نبود ساخته می‌شود
تا روی دیتابیس تازه (create_all از مدل) no-op بماند. enumهای مدل‌های جدید
به‌صورت VARCHAR ذخیره می‌شوند (همان قرارداد contract_slots.status)؛ هیچ
native enum در این مهاجرت نیست.

نکته‌ها:
- holidays.holiday_date یکتا روی کل تقویم (spec) — مناسبت سالن‌دار و سراسری
  نمی‌توانند هم‌زمان روی یک تاریخ باشند.
- loyalty_points: یکتایی (user_id, reason, source_type, source_id) — ضدتکرار
  جایزه/خرج/بازگشت هر رزرو؛ ردیف‌های دستی (منبع null) استثنا می‌مانند
  (NULL در unique برابر نیست — SQLite و PG یکسان).
- favorite_venues: یکتایی (user_id, venue_id).
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "h8n008pricingloyalty"
down_revision: Union[str, None] = "g7m007contractlifecycle"
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


def _idx(name: str, table: str, cols, unique: bool = False) -> None:
    existing = {i["name"] for i in _insp().get_indexes(table)}
    if name in existing:
        return
    op.create_index(name, table, cols, unique=unique)


def upgrade() -> None:
    # ── ۱) Holiday ──
    if not _has_table("holidays"):
        op.create_table(
            "holidays",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("holiday_date", sa.Date(), nullable=False),
            sa.Column("name", sqlmodel.VARCHAR(length=120), nullable=False),
            sa.Column("is_national", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("venue_id", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], name="fk_holidays_venue_id"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("holiday_date", name="uq_holidays_date"),
        )
        _idx("ix_holidays_holiday_date", "holidays", ["holiday_date"])
        _idx("ix_holidays_venue_id", "holidays", ["venue_id"])

    # ── ۲) PricingRule ──
    if not _has_table("pricing_rules"):
        op.create_table(
            "pricing_rules",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("venue_id", sa.Integer(), nullable=False),
            sa.Column("day_of_week", sa.Integer(), nullable=True),
            sa.Column("start_time", sa.Time(), nullable=True),
            sa.Column("end_time", sa.Time(), nullable=True),
            sa.Column("holiday_applies", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("modifier_type", sqlmodel.VARCHAR(length=20), nullable=False,
                      server_default="PERCENT"),
            sa.Column("value", sa.Integer(), nullable=False),
            sa.Column("priority", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("label", sqlmodel.VARCHAR(length=120), nullable=False, server_default=""),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], name="fk_pricing_rules_venue_id"),
            sa.PrimaryKeyConstraint("id"),
        )
        _idx("ix_pricing_rules_venue_id", "pricing_rules", ["venue_id"])
        _idx("ix_pricing_rules_is_active", "pricing_rules", ["is_active"])

    # ── ۳) Coupon + Redemption ──
    if not _has_table("coupons"):
        op.create_table(
            "coupons",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("code", sqlmodel.VARCHAR(length=40), nullable=False),
            sa.Column("venue_id", sa.Integer(), nullable=True),
            sa.Column("discount_type", sqlmodel.VARCHAR(length=20), nullable=False,
                      server_default="PERCENT"),
            sa.Column("value", sa.Integer(), nullable=False),
            sa.Column("max_uses", sa.Integer(), nullable=True),
            sa.Column("uses_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("per_user_limit", sa.Integer(), nullable=True, server_default="1"),
            sa.Column("min_booking_amount", sa.Integer(), nullable=True),
            sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True),
            sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], name="fk_coupons_venue_id"),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], name="fk_coupons_created_by"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("code", name="uq_coupons_code"),
        )
        _idx("ix_coupons_code", "coupons", ["code"])
        _idx("ix_coupons_venue_id", "coupons", ["venue_id"])
        _idx("ix_coupons_is_active", "coupons", ["is_active"])

    if not _has_table("coupon_redemptions"):
        op.create_table(
            "coupon_redemptions",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("coupon_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("booking_id", sa.Integer(), nullable=True),
            sa.Column("amount_discounted", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["coupon_id"], ["coupons.id"],
                                    name="fk_coupon_redemptions_coupon_id"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"],
                                    name="fk_coupon_redemptions_user_id"),
            sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"],
                                    name="fk_coupon_redemptions_booking_id"),
            sa.PrimaryKeyConstraint("id"),
        )
        _idx("ix_coupon_redemptions_coupon_id", "coupon_redemptions", ["coupon_id"])
        _idx("ix_coupon_redemptions_user_id", "coupon_redemptions", ["user_id"])
        _idx("ix_coupon_redemptions_booking_id", "coupon_redemptions", ["booking_id"])

    # ── ۴) دفتر امتیاز وفاداری ──
    if not _has_table("loyalty_points"):
        op.create_table(
            "loyalty_points",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("points", sa.Integer(), nullable=False),
            sa.Column("reason", sqlmodel.VARCHAR(length=40), nullable=False),
            sa.Column("source_type", sqlmodel.VARCHAR(length=30), nullable=True),
            sa.Column("source_id", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_loyalty_points_user_id"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id", "reason", "source_type", "source_id",
                                name="uq_loyalty_source_once"),
        )
        _idx("ix_loyalty_points_user_id", "loyalty_points", ["user_id"])
        _idx("ix_loyalty_points_reason", "loyalty_points", ["reason"])

    # ── ۵) علاقه‌مندی‌ها ──
    if not _has_table("favorite_venues"):
        op.create_table(
            "favorite_venues",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("venue_id", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_favorite_venues_user_id"),
            sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], name="fk_favorite_venues_venue_id"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id", "venue_id", name="uq_favorite_user_venue"),
        )
        _idx("ix_favorite_venues_user_id", "favorite_venues", ["user_id"])
        _idx("ix_favorite_venues_venue_id", "favorite_venues", ["venue_id"])

    # ── ۶) افزوده‌های ستونی مدل‌های موجود ──
    _add("venues", "default_slot_price", sa.Integer(), nullable=True)

    _add("slots", "is_deal", sa.Boolean(), nullable=False, server_default=sa.false())
    _add("slots", "deal_price", sa.Integer(), nullable=True)
    _add("slots", "deal_expires_at", sa.DateTime(timezone=True), nullable=True)

    _add("bookings", "discount_amount", sa.Integer(), nullable=False, server_default="0")
    _add("bookings", "coupon_code", sqlmodel.VARCHAR(length=40), nullable=True)
    _add("bookings", "loyalty_points_used", sa.Integer(), nullable=False, server_default="0")
    _add("bookings", "pricing_breakdown", sqlmodel.Text(), nullable=True)

    _add("users", "notify_deals", sa.Boolean(), nullable=False, server_default=sa.false())


def downgrade() -> None:
    for name in ("favorite_venues", "loyalty_points", "coupon_redemptions",
                 "coupons", "pricing_rules", "holidays"):
        if _has_table(name):
            op.drop_table(name)
    for table, col in [
        ("venues", "default_slot_price"),
        ("slots", "is_deal"), ("slots", "deal_price"), ("slots", "deal_expires_at"),
        ("bookings", "discount_amount"), ("bookings", "coupon_code"),
        ("bookings", "loyalty_points_used"), ("bookings", "pricing_breakdown"),
        ("users", "notify_deals"),
    ]:
        if _has_column(table, col):
            try:
                op.drop_column(table, col)
            except Exception:  # noqa: BLE001 — SQLite قدیمی DROP COLUMN ندارد
                pass