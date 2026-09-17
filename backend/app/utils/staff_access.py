# backend/app/utils/staff_access.py
"""هسته‌ی اجزای RBAC کارکنان — brief §10 بند ۳ و ۴.

قاعده‌ی پذیرش (یکسان در همه‌ی مسیرهای retrofit شده — pass-through برای مالک/سرپرست):

    super_admin  ∧  venue.manager_id == user.id  ∧  club.owner_id == user.id (غیر USER)
    ∧  StaffAssignment فعال روی همان venue با کد خواسته‌شده

کاربر عادیِ بدون انتصاب ⇒ ۴۰۳ — دقیقاً مثل رفتار قبلیِ dep مدیر.

۴۰۳ها روی `request.state` انباشته می‌شوند و توسط میدل‌ور `main.py` پس از
rollback/تیزداون وابستگی‌ها (وقتی قفل نوشتن SQLite آزاد است) best-effort در
`security_audit_events` ثبت می‌شوند؛ لاگ‌های تغییروضعیت (ساخت کارمند، واید،
کش‌مارک، انتشار دیل و…) در همان UoW و کنار تغییر اصلی commit می‌شوند.
"""
from typing import List, Optional, Sequence, Tuple

from fastapi import Depends, HTTPException, Request
from sqlmodel import Session, select

from app.models.staff import SecurityAuditEvent, StaffAssignment
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.unit_of_work import UnitOfWork

DENIED_DETAIL = "اجازه دسترسی ندارید"
STAFF_VENUE_REQUIRED = "برای کارکنان، ارسال venue_id الزامی است"
MANAGER_REQUIRED_DETAIL = "دسترسی مدیریتی لازم را ندارید"

MANAGER_ROLES = (UserRole.VENUE_MANAGER, UserRole.CLUB_ADMIN, UserRole.SUPER_ADMIN)


def client_ip(request: Optional[Request]) -> Optional[str]:
    if request is None:
        return None
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()[:45]
    return request.client.host if request.client else None


# ─────────────────────────── تشخیص دسترسی ───────────────────────────

def _resolve_user_venue_access(uow: UnitOfWork, user: User, venue_id: Optional[int]
                               ) -> Tuple[Optional[str], Optional[StaffAssignment]]:
    """(kind, assignment): kind ∈ super|owner|staff|None."""
    if user.role == UserRole.SUPER_ADMIN:
        return "super", None
    if venue_id is None:
        return None, None
    venue = uow.venues.get_by_id(venue_id)
    if venue is None:
        raise HTTPException(status_code=404, detail="Venue not found")
    if venue.manager_id == user.id:
        return "owner", None
    if venue.club_id and user.role != UserRole.USER:
        club = uow.clubs.get_by_id(venue.club_id)
        if club and club.owner_id == user.id:
            return "owner", None
    assignment = uow.staff.get_active(venue_id, user.id)
    if assignment is not None:
        return "staff", assignment
    return None, None


def has_venue_permission(uow: UnitOfWork, user: User, venue_id: Optional[int],
                         codes: Sequence[str]) -> bool:
    try:
        kind, assignment = _resolve_user_venue_access(uow, user, venue_id)
    except HTTPException:
        raise
    if kind in ("super", "owner"):
        return True
    if kind == "staff":
        perms = set(assignment.permission_codes())
        return any(c in perms for c in codes)
    return False


def _stash_denial(request: Optional[Request], user: User, venue_id: Optional[int],
                  codes: Sequence[str], action: str) -> None:
    entry = {
        "action": action,
        "actor_id": user.id,
        "target_type": "permission",
        "target_id": venue_id,
        "venue_id": venue_id,
        "data": {"codes": list(codes)},
        "ip": client_ip(request),
    }
    if request is None:
        flush_security_denials([entry])
        return
    existing = getattr(request.state, "security_denials", None)
    if existing is None:
        existing = []
        request.state.security_denials = existing
    existing.append(entry)


def flush_security_denials(entries: List[dict]) -> None:
    """best-effort پس از پاسخ — هرگز پاسخ اصلی را نمی‌شکند."""
    import app.database as database_module
    for entry in entries:
        try:
            with Session(database_module.engine) as s:
                ev = SecurityAuditEvent(
                    action=entry["action"][:60],
                    actor_id=entry.get("actor_id"),
                    target_type=entry.get("target_type"),
                    target_id=entry.get("target_id"),
                    venue_id=entry.get("venue_id"),
                    data=__import__("json").dumps(entry.get("data") or {},
                                                  ensure_ascii=False, default=str),
                    ip=entry.get("ip"),
                )
                s.add(ev)
                s.commit()
        except Exception as e:  # noqa: BLE001 — ممیزی انکار نباید سرویس را بخواباند
            print(f"[security_audit] denial flush failed: {e}")


def ensure_venue_permission(uow: UnitOfWork, user: User, venue_id: Optional[int],
                            codes: Sequence[str], request: Optional[Request] = None,
                            denial_action: str = "permission.denied") -> Venue:
    """۴۰۴ اگر سالن نبود؛ در غیر این صورت فقط مالک/سرپرست/کارکن با کد — وگرنه ۴۰۳."""
    if venue_id is None:
        if user.role == UserRole.USER and user.id is not None:
            # کارمند بدون venue مشخص — رد + لاگ (venue_id=null)
            _stash_denial(request, user, None, codes, denial_action)
            raise HTTPException(status_code=403, detail=STAFF_VENUE_REQUIRED)
        if user.role == UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=400, detail="venue_id الزامی است")
        _stash_denial(request, user, None, codes, denial_action)
        raise HTTPException(status_code=403, detail=DENIED_DETAIL)
    kind, assignment = _resolve_user_venue_access(uow, user, venue_id)
    venue = uow.venues.get_by_id(venue_id)
    if kind in ("super", "owner"):
        return venue
    if kind == "staff":
        perms = set(assignment.permission_codes())
        if any(c in perms for c in codes):
            return venue
    _stash_denial(request, user, venue_id, codes, denial_action)
    raise HTTPException(status_code=403, detail=DENIED_DETAIL)


# import-delayed تا چرخه ماژولی ایجاد نشود (app.utils.auth ↔ unit_of_work ↔ ...)
def get_unit_of_work_dep():
    from app.unit_of_work import get_unit_of_work
    return get_unit_of_work


def get_current_user_dep():
    from app.utils.auth import get_current_user
    return get_current_user


def require_venue_permission(*codes: str):
    """سازنده وابستگی — venue_id از path/query؛ برای مسیرهای بدون منبع صریح.

    نمونه: router.add_api_route(..., dependencies=[Depends(require_venue_permission(
    Perm.BOOKING_VIEW))]) برای متد با `.../venue/{venue_id}/...`.
    """
    wanted = list(codes)

    def dependency(request: Request,
                   uow: UnitOfWork = Depends(get_unit_of_work_dep()),
                   current_user: User = Depends(get_current_user_dep())
                   ) -> Venue:
        vid = request.path_params.get("venue_id") or request.query_params.get("venue_id")
        try:
            vid = int(vid) if vid is not None else None
        except (TypeError, ValueError):
            vid = None
        return ensure_venue_permission(uow, current_user, vid, wanted, request)

    return dependency


# ─────────────────────────── دامنه‌ی مدیر/کارکن ───────────────────────────

def staff_venue_ids(uow: UnitOfWork, user: User, codes: Optional[Sequence[str]] = None
                    ) -> List[int]:
    return uow.staff.active_venue_ids(user.id, tuple(codes) if codes else None)


def manager_or_staff_venue_ids(uow: UnitOfWork, user: User,
                               codes: Sequence[str]) -> Optional[List[int]]:
    """None ⇒ بدون فیلتر (super). USER باید کارکنان فعال با کد داشته باشد (وگرنه ۴۰۳)."""
    if user.role == UserRole.SUPER_ADMIN:
        return None
    ids = [v.id for v in uow.session.exec(
        select(Venue).where(Venue.manager_id == user.id)).all()]
    for vid in staff_venue_ids(uow, user, codes):
        if vid not in ids:
            ids.append(vid)
    if not ids:
        raise HTTPException(status_code=403, detail=MANAGER_REQUIRED_DETAIL)
    return ids


def staff_scoped_access(uow: UnitOfWork, user: User, venue_id: Optional[int],
                        codes: Sequence[str],
                        request: Optional[Request] = None) -> Optional[List[int]]:
    """برای مسیرهای مالی «venue-scoped».

    super_admin ⇒ None (legacy). نقش‌های مدیر ⇒ None تا resolve_scope legacy (از
    جمله دامنه‌ی باشگاه) دست‌نخورده بماند. USER ⇒ venue الزامی + بررسی کد ⇒
    [venue_id].
    """
    if user.role == UserRole.SUPER_ADMIN:
        return None
    if user.role != UserRole.USER:
        return None
    if venue_id is None:
        _stash_denial(request, user, None, codes, "permission.denied")
        raise HTTPException(status_code=403, detail=STAFF_VENUE_REQUIRED)
    ensure_venue_permission(uow, user, venue_id, codes, request)
    return [venue_id]


def log_security_event(uow: UnitOfWork, action: str, actor_id: Optional[int] = None, *,
                       target_type: Optional[str] = None, target_id: Optional[int] = None,
                       venue_id: Optional[int] = None, data: Optional[dict] = None,
                       request: Optional[Request] = None) -> None:
    """ثبت در همان UoW (برای عملیات تغییروضعیت؛ با commit اصلی قطعی می‌شود)."""
    uow.security_audits.log(action, actor_id, target_type=target_type,
                            target_id=target_id, venue_id=venue_id, data=data,
                            ip=client_ip(request))


__all__ = [name for name in dir() if not name.startswith("get_unit_of_work_dep")]