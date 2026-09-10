# backend/tests/conftest.py
"""فیستچرهای تست — SQLite موقت + جای‌گزینی engine و وابستگی‌های احراز هویت.

نکات:
- PostgreSQL از محیط توسعه ویندوز در دسترس نیست؛ تست‌ها روی SQLite (WAL) اجرا می‌شوند.
- قفل SELECT FOR UPDATE روی SQLite no-op است؛ تست همزمانی نامتغیر «ظرفیت هرگز رد نمی‌شود» را بررسی می‌کند.
- توکن تست = شماره تلفن (ساده و خوانا)؛ resolve در override انجام می‌شود.
"""
import os
import pathlib
import sys
from datetime import date, time as dtime

BACKEND_DIR = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

TEST_DB = BACKEND_DIR / "tests" / "_game_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"

for suffix in ("", "-wal", "-shm"):
    p = str(TEST_DB) + suffix
    if os.path.exists(p):
        os.remove(p)

import pytest
from fastapi import HTTPException, Request
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlmodel import Session, SQLModel, create_engine, select, delete

import app.database as database_module
import app.unit_of_work as uow_module
from app.unit_of_work import UnitOfWork
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.models.slot import Slot, SlotStatus
from app.models.booking import Booking, BookingStatus
from app.models.game import (
    Game, GameParticipant, GameJoinRequest, GameInvitation,
    GameInviteLink, GameWaitlist, GamePayment,
)
from app.models.notification import Notification
from app.utils.auth import get_current_user
from app.api.v1.games import get_optional_user
from app.database import get_session

test_engine = create_engine(
    os.environ["DATABASE_URL"],
    echo=False,
    connect_args={"check_same_thread": False},
)


@event.listens_for(test_engine, "connect")
def _sqlite_pragmas(dbapi_conn, _record):
    # ایزوله‌کردن تراکنش pysqlite + BEGIN IMMEDIATE ⇒ ترنزکشن‌ها واقعاً serialize می‌شوند
    # (تست همزمانی join بدون این، snapshot-isolation SQLite را می‌بیند نه رفتار PG)
    dbapi_conn.isolation_level = None
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=10000")
    cursor.close()


@event.listens_for(test_engine, "begin")
def _sqlite_begin_immediate(conn):
    conn.exec_driver_sql("BEGIN IMMEDIATE")


# جای‌گزینی engine در تمام ماژول‌هایی که آن را import مستقیم کرده‌اند
# توجه: app.services.__init__ نام notification_service را با singleton shadow می‌کند؛
# ماژول واقعی را از sys.modules می‌گیریم.
import app.services.notification_service  # noqa: E402,F401
notification_service_module = sys.modules["app.services.notification_service"]  # noqa: E402

database_module.engine = test_engine
uow_module.engine = test_engine
notification_service_module.engine = test_engine

# ─────────────────────────── capture اعلان‌ها ───────────────────────────
# _persist روی Session جدا commit می‌کند؛ با BEGIN IMMEDIATE این باعث قفل
# متقابل با تراکنش باز UOW می‌شود (محدودیت SQLite، نه باگ محصول).
# در تست‌ها به‌جای DB، در یک لیست capture می‌شود.
_sent_notifications: list = []


def _capture_persist(self, user_id, title, message, notif_type, data=None):
    _sent_notifications.append({"user_id": user_id, "title": title,
                                "message": message, "type": notif_type,
                                "data": data})
    return len(_sent_notifications)


notification_service_module.NotificationService._persist = _capture_persist

from app.main import app as fastapi_app  # noqa: E402

SQLModel.metadata.create_all(test_engine)


# ─────────────────────────── پاک‌سازی ───────────────────────────

_TABLES_CLEAN_ORDER = [
    GamePayment, GameWaitlist, GameInviteLink, GameInvitation,
    GameJoinRequest, GameParticipant, Game,
    Booking, Slot, Notification, Venue, User,
]


@pytest.fixture(autouse=True)
def clean_db():
    with Session(test_engine) as session:
        for model in _TABLES_CLEAN_ORDER:
            session.exec(delete(model))
        session.commit()
    yield


@pytest.fixture()
def sent_notifications():
    """لیست اعلان‌های capture‌شده در طول تست."""
    _sent_notifications.clear()
    yield _sent_notifications


# ─────────────────────────── کلاینت + auth ───────────────────────────

def _resolve_user_from_header(request) -> User | None:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    phone = auth[len("Bearer "):].strip()
    with Session(test_engine) as session:
        return session.exec(select(User).where(User.phone == phone)).first()


def _fake_current_user(request: Request):
    user = _resolve_user_from_header(request)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="احراز هویت نامعتبر است")
    return user


def _fake_optional_user(request: Request):
    user = _resolve_user_from_header(request)
    return user if (user and user.is_active) else None


def _fake_get_session():
    with Session(test_engine) as session:
        yield session


def _fake_uow():
    uow = UnitOfWork()
    uow._session = Session(test_engine)
    try:
        yield uow
        uow.commit()
    except Exception:
        uow.rollback()
        raise
    finally:
        uow._session.close()
        uow._session = None


@pytest.fixture()
def client():
    # بدون context-manager ⇒ lifespan اجرا نمی‌شود (init_db روی PG وصل نمی‌شود)
    fastapi_app.dependency_overrides[get_current_user] = _fake_current_user
    fastapi_app.dependency_overrides[get_optional_user] = _fake_optional_user
    fastapi_app.dependency_overrides[get_session] = _fake_get_session
    from app.unit_of_work import get_unit_of_work
    fastapi_app.dependency_overrides[get_unit_of_work] = _fake_uow
    yield TestClient(fastapi_app)
    fastapi_app.dependency_overrides.clear()


# ─────────────────────────── seed helpers ───────────────────────────

@pytest.fixture()
def db():
    session = Session(test_engine)
    yield session
    session.close()


@pytest.fixture()
def seed(db):
    """ساخت کاربر/مکان/اسلات/رزرو — dict برمی‌گرداند."""

    def _make_user(phone: str, full_name: str = None, role: UserRole = UserRole.USER) -> User:
        user = User(phone=phone, full_name=full_name or f"کاربر {phone}",
                    hashed_password="x", role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
        db.close()  # آزادکردن write-lock (BEGIN IMMEDIATE) تا handler قفل نکند
        return user

    def _make_booking(owner: User, price: int = 500_000,
                      venue_lat: float = 35.7, venue_lng: float = 51.4,
                      status: BookingStatus = BookingStatus.CONFIRMED) -> dict:
        venue = Venue(name="سالن تست", category="futsal", address="آدرس تست",
                      latitude=venue_lat, longitude=venue_lng, phone="09120000000",
                      manager_id=owner.id)
        db.add(venue)
        db.commit()
        db.refresh(venue)
        slot = Slot(venue_id=venue.id, slot_date=date(2026, 9, 10),
                    start_time=dtime(18, 0), duration=90, base_price=price,
                    current_price=price, status=SlotStatus.BOOKED)
        db.add(slot)
        db.commit()
        db.refresh(slot)
        booking = Booking(slot_id=slot.id, user_id=owner.id,
                          status=status, payment_amount=price)
        db.add(booking)
        db.commit()
        db.refresh(booking)
        db.close()  # آزادکردن write-lock
        return {"venue": venue, "slot": slot, "booking": booking}

    def _make_game(owner: User, booking: Booking, **overrides) -> dict:
        from app.schemas.game import GameCreate
        from app.services.game_service import GameService
        payload = {
            "booking_id": booking.id, "name": "بازی تست",
            "sport": "football", "max_players": 5,
            "skill_level": "intermediate", "visibility": "public",
            "payment_mode": "organizer_pays",
        }
        payload.update(overrides)
        data = GameCreate(**payload)
        with UnitOfWork() as uow:
            game, _ = GameService.create_game(uow, data, owner.id)
            return {"id": game.id}

    return {"user": _make_user, "booking": _make_booking, "game": _make_game}
