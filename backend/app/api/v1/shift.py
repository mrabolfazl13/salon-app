# backend/app/api/v1/shift.py
"""API زمان‌بندی شیفت پرسنل (P020).

- دروازه: همان کد کارکنان (`Perm.STAFF_MANAGE`) — مالک سالن، super_admin و
  branch_manager با این کد؛ `ensure_venue_permission` سالن نامعتبر ⇒ ۴۰۴ و
  دسترسی نداشتن ⇒ ۴۰۳ (و ممیزی انکار در SecurityAuditEvent).
- ویرایش/لغو روی شیفتِ موجود: سالن از خود ردیف خوانده می‌شود تا کاربر نتواند با
  `venue_id` دلخواه از دروازه رد شود.
- قاعدهٔ کسبی در `shift_service` است؛ اینجا فقط HTTP و ممیزی.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response

from app.models.user import User
from app.schemas.staff_shift import (
    ShiftCreate, ShiftListResponse, ShiftRow, ShiftSummaryResponse, ShiftUpdate,
)
from app.services import shift_service
from app.unit_of_work import UnitOfWork, get_unit_of_work
from app.utils.auth import get_current_user
from app.utils.permissions import Perm
from app.utils.staff_access import ensure_venue_permission, log_security_event

router = APIRouter(prefix="/shifts", tags=["Staff shifts"])

SHIFT_CODES = [Perm.STAFF_MANAGE]
_STATUS_PATTERN = "^(scheduled|done|cancelled)$"


def _fail(exc: Exception) -> None:
    """خطای سرویس ⇒ ۴۰۰ (متن فارسی مستقیم در UI نشان داده می‌شود)."""
    raise HTTPException(status_code=400, detail=str(exc))


def _row(uow: UnitOfWork, shift) -> ShiftRow:
    return shift_service.to_rows(uow, [shift])[0]


@router.get("", response_model=ShiftListResponse)
def list_shifts(
    request: Request,
    venue_id: int = Query(...),
    date_from: Optional[datetime] = Query(None, alias="from"),
    date_to: Optional[datetime] = Query(None, alias="to"),
    status: Optional[str] = Query(None, pattern=_STATUS_PATTERN),
    user_id: Optional[int] = Query(None),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """شیفت‌های بازه (همان فیلترهای نمای هفتگی/ماهانه)."""
    ensure_venue_permission(uow, current_user, venue_id, SHIFT_CODES, request)
    return shift_service.list_shifts(uow, venue_id, date_from=date_from,
                                     date_to=date_to, status=status,
                                     user_id=user_id)


@router.get("/summary", response_model=ShiftSummaryResponse)
def shift_summary(
    request: Request,
    venue_id: int = Query(...),
    date_from: datetime = Query(..., alias="from"),
    date_to: datetime = Query(..., alias="to"),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """ساعت کاری هر پرسنل در بازه — جای «جمع زدن دستی روی کاغذ»."""
    ensure_venue_permission(uow, current_user, venue_id, SHIFT_CODES, request)
    return shift_service.summary(uow, venue_id, date_from=date_from, date_to=date_to)


@router.get("/export")
def export_shifts(
    request: Request,
    venue_id: int = Query(...),
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """خروجی CSV ماهانه (BOM ⇒ در Excel فارسی باز می‌شود)."""
    ensure_venue_permission(uow, current_user, venue_id, SHIFT_CODES, request)
    try:
        csv_text = shift_service.export_csv(uow, venue_id, month)
    except ValueError as exc:
        _fail(exc)
    log_security_event(uow, "shift.export", current_user.id,
                       target_type="staff_shift_set", venue_id=venue_id,
                       data={"month": month}, request=request)
    uow.commit()
    return Response(
        content="\ufeff" + csv_text,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition":
                 f'attachment; filename="shifts-{venue_id}-{month}.csv"'},
    )


@router.post("", response_model=ShiftRow, status_code=201)
def create_shift(
    data: ShiftCreate,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    ensure_venue_permission(uow, current_user, data.venue_id, SHIFT_CODES, request)
    try:
        shift = shift_service.create_shift(
            uow, venue_id=data.venue_id, user_id=data.user_id,
            starts_at=data.starts_at, ends_at=data.ends_at,
            notes=data.notes, actor_id=current_user.id)
    except ValueError as exc:
        _fail(exc)
    uow.commit()
    return _row(uow, shift)


@router.put("/{shift_id}", response_model=ShiftRow)
def update_shift(
    shift_id: int,
    data: ShiftUpdate,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    shift = uow.shifts.get_by_id(shift_id)
    if shift is None:
        raise HTTPException(status_code=404, detail="شیفت موردنظر یافت نشد.")
    ensure_venue_permission(uow, current_user, shift.venue_id, SHIFT_CODES, request)
    try:
        updated = shift_service.update_shift(
            uow, shift_id, starts_at=data.starts_at, ends_at=data.ends_at,
            status=data.status, notes=data.notes)
    except ValueError as exc:
        _fail(exc)
    uow.commit()
    return _row(uow, updated)


@router.post("/{shift_id}/cancel", response_model=ShiftRow)
def cancel_shift(
    shift_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """لغو (soft) — ردیف می‌ماند و در خلاصه در ستون «لغوشده» گزارش می‌شود."""
    shift = uow.shifts.get_by_id(shift_id)
    if shift is None:
        raise HTTPException(status_code=404, detail="شیفت موردنظر یافت نشد.")
    ensure_venue_permission(uow, current_user, shift.venue_id, SHIFT_CODES, request)
    try:
        cancelled = shift_service.cancel_shift(uow, shift_id)
    except ValueError as exc:
        _fail(exc)
    uow.commit()
    return _row(uow, cancelled)
