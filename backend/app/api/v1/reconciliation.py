"""گزارش‌های مغایرگیری دفتر کل ↔ درگاه (C14).

دو چیز این فایل را عوض کرد: جدولِ گزارش وجود نداشت (ماژولش غایب بود) و هر دو
خواندنیِ قبلی با `except ImportError` «صفر گزارش» برمی‌گرداندند — یعنی پنلِ
مالی همیشه «بدون مغایرت» نشان می‌داد. حالا ردیف‌ها واقعاً نوشته می‌شوند
(`ReconciliationService.save`) و خوانده می‌شوند.

دروازهٔ خواندن SUPER_ADMIN است، نه manager: یک گزارش کلِ دفتر کل را می‌دهد
(شمارۀ پرداخت/رزروِ همهٔ سالن‌ها)، پس همان سطحِ دسترسیِ `/run` را می‌خواهد.
"""
import json
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import col, func, select

from app.models.reconciliation_report import ReconciliationReport
from app.models.user import User, UserRole
from app.unit_of_work import UnitOfWork, get_unit_of_work
from app.utils.auth import get_current_user

router = APIRouter(prefix="/reconciliation", tags=["Reconciliation"])


def _require_super_admin(current_user: User) -> None:
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="دسترسی سرپرست لازم است")


def _row_summary(r: ReconciliationReport) -> dict:
    return {
        "id": r.id,
        "period_from": r.period_from.isoformat(),
        "period_to": r.period_to.isoformat(),
        "status": getattr(r.status, "value", str(r.status)),
        "payments_checked": r.payments_checked,
        "ledger_income_rows": r.ledger_income_rows,
        "mismatch_count": r.mismatch_count,
        "generated_at": r.generated_at.isoformat(),
        "triggered_by": r.triggered_by,
    }


@router.get("/reports")
def get_reconciliation_reports(
    start_date: Optional[date] = Query(None, description="مبدا (YYYY-MM-DD) — روی تاریخ پایانِ دوره"),
    end_date: Optional[date] = Query(None, description="انتها (YYYY-MM-DD) — روی تاریخ پایانِ دوره"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """فهرست گزارش‌ها — سرپرست. `total` شمارِ کلِ ردیف‌هاست، نه طولِ صفحه."""
    _require_super_admin(current_user)

    conds = []
    if start_date:
        conds.append(ReconciliationReport.period_to >= start_date)
    if end_date:
        conds.append(ReconciliationReport.period_from <= end_date)

    total = uow.session.exec(
        select(func.count()).select_from(ReconciliationReport).where(*conds)).one()

    rows = uow.session.exec(
        select(ReconciliationReport).where(*conds)
        .order_by(col(ReconciliationReport.period_to).desc(),
                  col(ReconciliationReport.id).desc())
        .offset(offset).limit(limit)
    ).all()

    return {"total": int(total), "limit": limit, "offset": offset,
            "items": [_row_summary(r) for r in rows]}


@router.get("/reports/{report_id}")
def get_reconciliation_report_detail(
    report_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """گزارش کامل با ردیفِ مغایرت‌ها — سرپرست."""
    _require_super_admin(current_user)

    report = uow.session.get(ReconciliationReport, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="گزارش یافت نشد")

    body = _row_summary(report)
    body["mismatches"] = json.loads(report.mismatches or "[]")
    return body


@router.post("/run")
def run_manual_reconciliation(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """اجرای دستیِ مغایرگیریِ دیروز (سرپرست) — همان کاری که beat هر شب می‌کند."""
    _require_super_admin(current_user)

    from app.tasks.reconciliation_tasks import reconcile_ledger_with_gateway
    task = reconcile_ledger_with_gateway.delay()

    return {"message": "مغایرگیری دستی شروع شد", "task_id": str(task.id)}
