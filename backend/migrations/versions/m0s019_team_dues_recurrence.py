"""teams auto-dues plan + team_dues late-fee link

Revision ID: m0s019teamduesrecurrence
Revises: m0s018bookingcheckin
Create Date: 2026-10-16

ستون‌های برنامه حق‌عضویت خودکار (dues_auto/dues_amount/dues_title/dues_day/
dues_late_fee_pct) و لینک جریمه دیرکرد (team_dues.penalty_for_id) به مدل‌ها
اضافه شد؛ روی create_all خودکار ساخته می‌شوند و روی prod مهاجرت می‌خواهند.
الگوی idempotent همان m0s013–m0s018.
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "m0s019teamduesrecurrence"
down_revision: Union[str, None] = "m0s018bookingcheckin"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _cols(table: str) -> set[str]:
    insp = sa.inspect(op.get_bind())
    return {c["name"] for c in insp.get_columns(table)}


def _indexes(table: str) -> set[str]:
    return {i["name"] for i in sa.inspect(op.get_bind()).get_indexes(table)}


def _checks(table: str) -> set[str]:
    return {c["name"] for c in sa.inspect(op.get_bind()).get_check_constraints(table)
            if c.get("name")}


def upgrade() -> None:
    cols = _cols("teams")
    with op.batch_alter_table("teams") as batch:
        if "dues_auto" not in cols:
            batch.add_column(sa.Column(
                "dues_auto", sa.Boolean(), nullable=False, server_default=sa.false()))
        if "dues_amount" not in cols:
            batch.add_column(sa.Column(
                "dues_amount", sa.Integer(), nullable=True))
        if "dues_title" not in cols:
            batch.add_column(sa.Column(
                "dues_title", sqlmodel.VARCHAR(length=100), nullable=False,
                server_default=sa.text("'حق عضویت ماهانه'")))
        if "dues_day" not in cols:
            batch.add_column(sa.Column(
                "dues_day", sa.Integer(), nullable=False, server_default="1"))
        if "dues_late_fee_pct" not in cols:
            batch.add_column(sa.Column(
                "dues_late_fee_pct", sa.Integer(), nullable=False, server_default="0"))

    # قیدهای مدل روی مسیری که جدول ستون‌ها را از قبل داشته ولی قیدها را ندارد
    # ساخته می‌شوند تا جفتِ upgrade↔downgrade درست بماند
    existing_checks = _checks("teams")
    missing = [(n, c) for n, c in (
        ("ck_team_dues_amount_positive", "dues_amount IS NULL OR dues_amount > 0"),
        ("ck_team_dues_day", "dues_day >= 1 AND dues_day <= 28"),
        ("ck_team_dues_late_fee_pct", "dues_late_fee_pct >= 0 AND dues_late_fee_pct <= 100"),
    ) if n not in existing_checks]
    if missing:
        with op.batch_alter_table("teams") as batch:
            for name, condition in missing:
                batch.create_check_constraint(name, condition)

    due_cols = _cols("team_dues")
    if "penalty_for_id" not in due_cols:
        with op.batch_alter_table("team_dues") as batch:
            batch.add_column(sa.Column(
                "penalty_for_id", sa.Integer(),
                sa.ForeignKey("team_dues.id"), nullable=True))
    if "penalty_for_id" in _cols("team_dues"):
        if "ix_team_dues_penalty_for_id" not in _indexes("team_dues"):
            op.create_index("ix_team_dues_penalty_for_id", "team_dues",
                            ["penalty_for_id"], unique=False)
    if "dues_auto" in _cols("teams"):
        if "ix_teams_dues_auto" not in _indexes("teams"):
            op.create_index("ix_teams_dues_auto", "teams", ["dues_auto"], unique=False)


def downgrade() -> None:
    if "ix_teams_dues_auto" in _indexes("teams"):
        op.drop_index("ix_teams_dues_auto", table_name="teams")
    if "ix_team_dues_penalty_for_id" in _indexes("team_dues"):
        op.drop_index("ix_team_dues_penalty_for_id", table_name="team_dues")
    cols = _cols("team_dues")
    if "penalty_for_id" in cols:
        with op.batch_alter_table("team_dues") as batch:
            batch.drop_column("penalty_for_id")
    team_cols = _cols("teams")
    team_checks = _checks("teams")
    with op.batch_alter_table("teams") as batch:
        # recreate در batch mode قیدهای نام‌دار را از جدول بازتاب‌گرفتهٔ فعلی کپی
        # می‌کند؛ اگر CHECK ارجاع‌به‌ستونِ حذف‌شده بماند، SQLite می‌گوید
        # «no such column: dues_amount» — پس اول خودِ قید حذف می‌شود
        for ck in ("ck_team_dues_late_fee_pct", "ck_team_dues_day",
                   "ck_team_dues_amount_positive"):
            if ck in team_checks:
                batch.drop_constraint(ck)
        for col in ("dues_late_fee_pct", "dues_day", "dues_title",
                    "dues_amount", "dues_auto"):
            if col in team_cols:
                batch.drop_column(col)
