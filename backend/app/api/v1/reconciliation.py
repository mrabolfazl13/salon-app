"""Reconciliation report endpoints for finance team."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import date, datetime
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.utils.auth import get_current_user, get_current_manager
from app.models.user import User, UserRole

router = APIRouter(prefix="/reconciliation", tags=["Reconciliation"])


@router.get("/reports")
def get_reconciliation_reports(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager),
):
    """Get reconciliation reports (managers only)."""
    try:
        from app.models.reconciliation_report import ReconciliationReport
        
        stmt = ReconciliationReport.select()
        
        if start_date:
            stmt = stmt.where(ReconciliationReport.date >= start_date)
        if end_date:
            stmt = stmt.where(ReconciliationReport.date <= end_date)
        
        stmt = stmt.order_by(ReconciliationReport.date.desc()).offset(offset).limit(limit)
        
        reports = uow.session.exec(stmt).all()
        
        return {
            "total": len(reports),
            "limit": limit,
            "offset": offset,
            "items": [
                {
                    "id": r.id,
                    "date": r.date.isoformat(),
                    "status": r.status,
                    "generated_at": r.generated_at.isoformat() if hasattr(r, 'generated_at') else None,
                    "summary": r.data.get("summary", {}) if hasattr(r, 'data') else {},
                }
                for r in reports
            ],
        }
    except ImportError:
        # Table doesn't exist yet - return empty
        return {"total": 0, "limit": limit, "offset": offset, "items": []}


@router.get("/reports/{report_id}")
def get_reconciliation_report_detail(
    report_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager),
):
    """Get detailed reconciliation report with all mismatches."""
    try:
        from app.models.reconciliation_report import ReconciliationReport
        
        report = uow.session.get(ReconciliationReport, report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return {
            "id": report.id,
            "date": report.date.isoformat(),
            "status": report.status,
            "data": report.data if hasattr(report, 'data') else {},
            "generated_at": report.generated_at.isoformat() if hasattr(report, 'generated_at') else None,
        }
    except ImportError:
        raise HTTPException(status_code=404, detail="Reconciliation reports not available")


@router.post("/run")
def run_manual_reconciliation(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager),
):
    """Trigger manual reconciliation (super admin only)."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    # Trigger the Celery task
    from app.tasks.reconciliation_tasks import reconcile_ledger_with_gateway
    task = reconcile_ledger_with_gateway.delay()
    
    return {
        "message": "مغایرگیری دستی شروع شد",
        "task_id": str(task.id),
    }
