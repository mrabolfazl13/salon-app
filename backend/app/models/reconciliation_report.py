"""ردیف مغایرگیری دفتر کل ↔ درگاه (C14).

این جدول هیچ‌گاه ساخته نشده بود — ماژولش هم وجود نداشت — پس `GET /reconciliation/reports`
با `except ImportError` همیشه «صفر گزارش» برمی‌گرداند (همان «همه‌چیز درست است» کاذب)
و نتیجۀ کارِ شبانۀ Celery فقط در لاگ می‌سوخت.
"""
from datetime import date, datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ReconciliationStatus(str, Enum):
    COMPLETED = "completed"          # بدون مغایرت
    ISSUES_FOUND = "issues_found"


class ReconciliationReport(SQLModel, table=True):
    """خلاصۀ یک دور مغایرگیری برای یک بازۀ تاریخ — `mismatches` رشتهٔ JSON است.

    بازه با دو `date` بسته می‌شود نه datetime؛ فیلترها با `date(…)` رشته‌ای
    مقایسه می‌کنند (الگوی `transaction_repository._range`) تا دامین naive/aware
    که راند ۲۷ از آن ردیف کرد، دوباره باز نشود.
    """

    __tablename__ = "reconciliation_reports"
    __table_args__ = (
        UniqueConstraint("period_from", "period_to", name="uq_reconciliation_period"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    period_from: date = Field(index=True)
    period_to: date = Field(index=True)
    status: ReconciliationStatus = Field(
        default=ReconciliationStatus.COMPLETED, index=True)

    payments_checked: int = Field(default=0)
    ledger_income_rows: int = Field(default=0)
    mismatch_count: int = Field(default=0)

    # الگوی `team_audit_events.data`: JSON در ستون رشته‌ای (روی هر دو دیتابیس سالم)
    mismatches: str = Field(default="[]")

    generated_at: datetime = Field(default_factory=_utcnow)
    triggered_by: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
