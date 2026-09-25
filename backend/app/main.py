# backend/app/main.py
import os

from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session

from app.config import settings
from app.database import init_db, get_session
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.api.v1 import (
    auth_router, venues_router, slots_router,
    bookings_router, competitions_router, contracts_router, admin_router,
    upload_router, reviews_router, notifications_router, payments_router,
    games_router, memberships_router, finance_router,
    holidays_router, pricing_router, coupons_router,
    loyalty_router, favorites_router, deals_router,
    teams_router, staff_router, crm_router, quiz_router,
)
from app.utils.websocket import manager
from app.utils.staff_access import flush_security_denials
from app.utils.auth import get_password_hash, get_user_by_token
from app.models.user import User, UserRole

# اتاق‌های نقش‌محور → نقش‌هایی که می‌توانند وارد شوند (super_admin همه‌جا مجاز است)
WS_ROOM_ALLOWED_ROLES = {
    "managers": {UserRole.VENUE_MANAGER.value, UserRole.CLUB_ADMIN.value},
    "admins": {UserRole.SUPER_ADMIN.value},
}
WS_INVALID_TOKEN = 4401   # توکن نامعتبر/منقضی/غایب
WS_FORBIDDEN = 4403       # احراز هویت موفق ولی دسترسی نهی‌شده


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    init_db()

    # ایجاد داده‌های اولیه
    # from app.seed_data import seed_database
    # seed_database()

    yield
    print("Shutting down...")

app = FastAPI(
    title="Futsal Booking System API",
    description="سیستم رزرو سالن فوتسال",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
@app.middleware("http")
async def security_denial_audit(request, call_next):
    """معماری انکارهای RBAC — انباشته در request.state و نوشتن best-effort پس
    از rollback تیداون وابستگی‌ها (قفل نوشتن SQLite در آن نقطه آزاد است)."""
    response = await call_next(request)
    denials = getattr(request.state, "security_denials", None)
    if denials:
        flush_security_denials(denials)
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────── WebSocket ───────────────────────────
# احراز هویت با پارامتر کوئری:  /ws/managers?token=<JWT>
# (WebSocket در مرورگرها هدر Authorization نمی‌فرستد؛ توکن از کوئری خوانده
#  و با همان منطق JWT مشترک HTTP اعتبارسنجی می‌شود.)


async def _reject_ws(websocket: WebSocket, code: int) -> None:
    """accept سپس close تا کد سفارشی (4401/4403) واقعاً به کلاینت برسد

    بدون accept، close فقط پاسخ HTTP 403 برای handshake می‌فرستد
    و کد بسته‌شدن قابل مشاهده نیست.
    """
    try:
        await websocket.accept()
    except Exception:  # noqa: BLE001
        pass
    try:
        await websocket.close(code=code)
    except Exception:  # noqa: BLE001
        pass


def _ws_user(websocket: WebSocket, session: Session) -> Optional[User]:
    """کاربر فعالِ متناظر با ?token=<JWT> — وگرنه None"""
    token = websocket.query_params.get("token")
    user = get_user_by_token(token, session)
    if user is None or not user.is_active:
        return None
    return user


@app.websocket("/ws/{role}")
async def websocket_endpoint(websocket: WebSocket, role: str, session: Session = Depends(get_session)):
    """اتاق نقش‌محور — فقط کاربران احرازهویت‌شده با نقش متناسب

    - venue_manager / club_admin → اتاق managers
    - super_admin → همه‌ی اتاق‌ها
    - کاربر عادی نمی‌تواند وارد اتاق‌های نقش‌محور شود
    """
    user = _ws_user(websocket, session)
    if user is None:
        await _reject_ws(websocket, WS_INVALID_TOKEN)
        return

    allowed_roles = WS_ROOM_ALLOWED_ROLES.get(role)
    role_value = user.role.value if isinstance(user.role, UserRole) else str(user.role)
    if allowed_roles is None or (role_value != UserRole.SUPER_ADMIN.value and role_value not in allowed_roles):
        await _reject_ws(websocket, WS_FORBIDDEN)
        return

    # user_id ثبت‌شده = شناسه‌ی تأییدشده (نه ادعای کلاینت)
    await manager.connect(websocket, role, user_id=user.id)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        pass
    except Exception:  # noqa: BLE001
        pass
    finally:
        manager.disconnect(websocket, role)


@app.websocket("/ws/user/{user_id}")
async def websocket_user_endpoint(websocket: WebSocket, user_id: int, session: Session = Depends(get_session)):
    """کانال شخصی — فقط مالک اکانت (یا super_admin برای پایش) مجاز است"""
    user = _ws_user(websocket, session)
    if user is None:
        await _reject_ws(websocket, WS_INVALID_TOKEN)
        return

    role_value = user.role.value if isinstance(user.role, UserRole) else str(user.role)
    if user.id != user_id and role_value != UserRole.SUPER_ADMIN.value:
        await _reject_ws(websocket, WS_FORBIDDEN)
        return

    # اشتراک در کانال درخواستی — اعتبارسنجی مالکیت بالای همین خط انجام شد
    await manager.connect(websocket, "users", user_id=user_id)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        pass
    except Exception:  # noqa: BLE001
        pass
    finally:
        manager.disconnect(websocket, "users")

# Health check
@app.get("/health")
async def health_check(uow: UnitOfWork = Depends(get_unit_of_work)):
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "connected" if uow.session else "disconnected"
    }

# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(venues_router, prefix="/api/v1")
app.include_router(slots_router, prefix="/api/v1")
app.include_router(bookings_router, prefix="/api/v1")
app.include_router(competitions_router, prefix="/api/v1")
app.include_router(contracts_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(upload_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(games_router, prefix="/api/v1")
app.include_router(memberships_router, prefix="/api/v1")
app.include_router(finance_router, prefix="/api/v1")
app.include_router(holidays_router, prefix="/api/v1")
app.include_router(pricing_router, prefix="/api/v1")
app.include_router(coupons_router, prefix="/api/v1")
app.include_router(loyalty_router, prefix="/api/v1")
app.include_router(favorites_router, prefix="/api/v1")
app.include_router(deals_router, prefix="/api/v1")
app.include_router(teams_router, prefix="/api/v1")
app.include_router(staff_router, prefix="/api/v1")
app.include_router(crm_router, prefix="/api/v1")
app.include_router(quiz_router, prefix="/api/v1")

# Static files - عکس‌های واقعی سالن‌ها
_static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.isdir(_static_dir):
    app.mount("/static", StaticFiles(directory=_static_dir), name="static")

@app.get("/")
async def root():
    return {"message": "Futsal Booking System API", "version": "2.0.0", "docs": "/docs"}
