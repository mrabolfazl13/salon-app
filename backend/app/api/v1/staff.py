# backend/app/api/v1/staff.py
"""API کارکنان سالن (brief §10) — انتصاب/مدیریت/حذف نرم + ممیزی امنیتی سراسری.

- کاربر باید از پیش ثبت‌نام کرده باشد (جریان register تغییری نمی‌کند؛ جست‌وجو با phone).
- انتصاب مالک سالن یا super_admin (و branch_manager با staff.manage — با ممیزی).
- بلافاصله فعال می‌شود و اعلان برای کاربر ثبت می‌گردد.
- ردیف فعال: حداکثر یکی به‌ازای (user, venue)؛ حذف نرم ⇒ انتصاب مجدد همان ردیف
  را زنده می‌کند (uq_staff_active_user_venue حفظ می‌شود).
- تغییر وضعیت‌ها SecurityAuditEvent در همان UoW ثبت می‌کنند.
"""
import json
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import select

from app.unit_of_work import UnitOfWork, get_unit_of_work
from app.models.staff import StaffAssignment
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.schemas.staff import (
    StaffAuditListResponse, StaffCreate, StaffMeRow, StaffRow, StaffUpdate,
)
from app.services.notification_service import notification_service
from app.utils.auth import get_current_user
from app.utils.permissions import (
    Perm, normalize_permission_list, permissions_for_position,
)
from app.utils.staff_access import (
    ensure_venue_permission, log_security_event, staff_venue_ids,
)

router = APIRouter(prefix="/staff", tags=["Staff"])

STAFF_CODES = [Perm.STAFF_MANAGE]


def _row(uow: UnitOfWork, a: StaffAssignment) -> StaffRow:
    user = uow.users.get_by_id(a.user_id)
    return StaffRow(
        id=a.id, venue_id=a.venue_id, user_id=a.user_id,
        user_name=user.full_name if user else None,
        user_phone=user.phone if user else None,
        position=a.position.value if hasattr(a.position, "value") else str(a.position),
        permissions=a.permission_codes(),
        is_custom_permissions=a.is_custom_permissions(),
        is_active=a.is_active, created_by=a.created_by,
        created_at=a.created_at, removed_at=a.removed_at,
    )


@router.post("/", response_model=StaffRow, status_code=201)
async def create_staff(
    data: StaffCreate,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """انتصاب کاربر ثبت‌نام‌شده به‌عنوان کارمند سالن (فعال‌سازی فوری + اعلان)."""
    venue = ensure_venue_permission(uow, current_user, data.venue_id,
                                    STAFF_CODES, request)
    target = uow.session.exec(select(User).where(User.phone == data.phone)).first()
    if not target:
        raise HTTPException(status_code=404,
                            detail="کاربری با این شماره ثبت نشده است؛ ابتدا باید ثبت‌نام کند")
    if target.id == venue.manager_id:
        raise HTTPException(status_code=400,
                            detail="مالک سالن را نمی‌توان به‌عنوان کارمند انتصاب داد")
    try:
        custom = normalize_permission_list(data.permissions)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    existing = uow.staff.get_for_venue_user(venue.id, target.id)
    if existing and existing.is_active:
        raise HTTPException(status_code=409,
                            detail="این کاربر قبلاً در این سالن انتصاب فعال دارد")
    if existing:  # revive ردیف حذف‌شده
        assignment = uow.staff.update(existing.id, {
            "position": data.position,
            "permissions": json.dumps(custom, ensure_ascii=False),
            "is_active": True,
            "created_by": current_user.id,
        })
        fresh = uow.staff.get_by_id(existing.id)
        fresh.removed_at = None  # BaseRepository.update مقدار None را نادیده می‌گیرد
        uow.session.add(fresh)
        uow.session.flush()
        assignment = fresh
        action = "staff.recreated"
    else:
        assignment = uow.staff.create({
            "venue_id": venue.id,
            "user_id": target.id,
            "position": data.position,
            "permissions": json.dumps(custom, ensure_ascii=False),
            "created_by": current_user.id,
        })
        action = "staff.created"
    log_security_event(uow, action, current_user.id,
                       target_type="staff_assignment", target_id=assignment.id,
                       venue_id=venue.id,
                       data={"user_id": target.id, "position": data.position.value,
                             "permissions": custom or sorted(
                                 permissions_for_position(data.position))},
                       request=request)
    uow.commit()
    await notification_service.send_to_user(
        target.id, "🧑‍💼 انتصاب کاری در سالن",
        f"شما به‌عنوان «{data.position.value}» در سالن {venue.name} معرفی شدید.",
        {"venue_id": venue.id, "position": data.position.value,
         "staff_assignment_id": assignment.id},
        notif_type="staff_assigned",
    )
    uow.session.refresh(assignment)
    return _row(uow, assignment)


@router.get("/", response_model=List[StaffRow])
def list_staff(
    request: Request,
    venue_id: int = Query(...),
    include_inactive: bool = Query(False),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    ensure_venue_permission(uow, current_user, venue_id, STAFF_CODES, request)
    rows = uow.staff.list_by_venue(venue_id, include_inactive=include_inactive)
    return [_row(uow, a) for a in rows]


@router.get("/me", response_model=List[StaffMeRow])
def get_my_assignments(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """خودسرویس کارکنان: انتصاب‌های فعال خودِ کاربر + کدهای دسترسی مؤثر.

    my-venues عمداً دست‌نخورده (قرارداد فعلی فرانت فقط برای مدیران). کارکنان
    venue_id همین ردیف‌ها را روی اندپوینت‌های scoped می‌فرستند؛ permissions
    برای مخفی‌کردن دکمه‌ها در فرانت.
    """
    rows = uow.staff.list_active_for_user(current_user.id)
    names = {}
    vids = sorted({r.venue_id for r in rows})
    if vids:
        names = {v.id: v.name for v in uow.session.exec(
            select(Venue).where(Venue.id.in_(vids))).all()}
    return [StaffMeRow(
        id=r.id, venue_id=r.venue_id, venue_name=names.get(r.venue_id),
        position=r.position.value if hasattr(r.position, "value") else str(r.position),
        permissions=r.permission_codes(), is_active=r.is_active,
    ) for r in rows]


@router.put("/{assignment_id}", response_model=StaffRow)
async def update_staff(
    assignment_id: int,
    data: StaffUpdate,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    assignment = uow.staff.get_by_id(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="انتصاب یافت نشد")
    ensure_venue_permission(uow, current_user, assignment.venue_id,
                            STAFF_CODES, request)
    if not assignment.is_active:
        raise HTTPException(status_code=400, detail="این انتصاب حذف شده است")
    changes: dict = {}
    if data.position is not None:
        changes["position"] = data.position
    if data.permissions is not None:
        try:
            codes = normalize_permission_list(data.permissions)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        changes["permissions"] = json.dumps(codes, ensure_ascii=False)
    if not changes:
        raise HTTPException(status_code=400, detail="تغییری ارسال نشده است")
    updated = uow.staff.update(assignment_id, changes)
    log_security_event(uow, "staff.updated", current_user.id,
                       target_type="staff_assignment", target_id=assignment_id,
                       venue_id=assignment.venue_id,
                       data={"changes": {k: str(v) for k, v in changes.items()}},
                       request=request)
    new_position = data.position
    uow.commit()
    if new_position is not None:
        venue = uow.venues.get_by_id(assignment.venue_id)
        target = uow.users.get_by_id(assignment.user_id)
        if target:
            await notification_service.send_to_user(
                target.id, "🔄 تغییر موقعیت شغلی",
                f"موقعیت شما در سالن {venue.name if venue else ''} به "
                f"«{new_position.value}» تغییر کرد.",
                {"venue_id": assignment.venue_id, "position": new_position.value},
                notif_type="staff_assigned")
    return _row(uow, updated)


@router.delete("/{assignment_id}")
async def remove_staff(
    assignment_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    assignment = uow.staff.get_by_id(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="انتصاب یافت نشد")
    ensure_venue_permission(uow, current_user, assignment.venue_id,
                            STAFF_CODES, request)
    if not assignment.is_active:
        raise HTTPException(status_code=400, detail="این انتصاب قبلاً حذف شده است")
    removed = uow.staff.deactivate(assignment_id)
    log_security_event(uow, "staff.removed", current_user.id,
                       target_type="staff_assignment", target_id=assignment_id,
                       venue_id=assignment.venue_id,
                       data={"user_id": assignment.user_id}, request=request)
    venue = uow.venues.get_by_id(assignment.venue_id)
    target = uow.users.get_by_id(assignment.user_id)
    uow.commit()
    if target:
        await notification_service.send_to_user(
            target.id, "⛔ حذف انتصاب شغلی",
            f"انتصاب شما در سالن {venue.name if venue else ''} لغو شد.",
            {"venue_id": assignment.venue_id}, notif_type="staff_removed")
    return {"message": "کارمند حذف شد (نرم)", "id": removed.id}


@router.get("/audit", response_model=StaffAuditListResponse)
def list_security_audit(
    request: Request,
    venue_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None, max_length=60),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """ممیزی امنیتی سراسری — فیلتر venue_id؛ دامنه: مالک/سرپرست/staff.audit."""
    if venue_id is not None:
        ensure_venue_permission(uow, current_user, venue_id,
                                [Perm.STAFF_AUDIT], request)
        venue_ids = [venue_id]
    elif current_user.role == UserRole.SUPER_ADMIN:
        venue_ids = None
    else:
        owned = [v.id for v in uow.session.exec(
            select(Venue).where(Venue.manager_id == current_user.id)).all()]
        venue_ids = sorted(set(owned) | set(
            staff_venue_ids(uow, current_user, [Perm.STAFF_AUDIT])))
        if not venue_ids:
            raise HTTPException(status_code=403, detail="اجازه دسترسی ندارید")
    rows, total = uow.security_audits.list_events(venue_ids=venue_ids,
                                                  action=action,
                                                  limit=limit, offset=offset)
    actor_ids = {r.actor_id for r in rows if r.actor_id}
    names = {}
    if actor_ids:
        names = {u.id: u.full_name for u in uow.session.exec(
            select(User).where(User.id.in_(list(actor_ids)))).all()}
    items = []
    for r in rows:
        try:
            data = json.loads(r.data or "{}")
        except ValueError:
            data = {"raw": r.data}
        items.append({"id": r.id, "actor_id": r.actor_id, "action": r.action,
                      "target_type": r.target_type, "target_id": r.target_id,
                      "venue_id": r.venue_id,
                      "data": {**data, "actor_name": names.get(r.actor_id)},
                      "ip": r.ip, "created_at": r.created_at})
    return {"items": items, "total": total, "limit": limit, "offset": offset}