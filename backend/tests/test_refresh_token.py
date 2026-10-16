# backend/tests/test_refresh_token.py
"""چرخهٔ refresh token: ورود با رمز، تمدید access، و ردِ توکنِ نوع‌اشتباه یا کاربر غیرفعال.

چرا بازنویسی شد: نسخهٔ قبلی async نوشته شده بود ولی فیستچر `client` یک TestClient
همگام می‌دهد (TypeError روی await) و پنج فیستچرِ امضаш (`test_user_phone`,
`valid_refresh_token`, …) هیچ‌جا تعریف نشده بودند ⇒ همهٔ تست‌ها error می‌دادند و
روی این مسیر احراز هویت هیچ پوششی نبود.
"""
import pytest
from jose import jwt
from sqlmodel import Session

from app.config import settings
from app.models.user import User
from app.utils.auth import create_refresh_token, get_password_hash

PASSWORD = "Passw0rd-123"


def _make_user(db: Session, phone: str, is_active: bool = True) -> User:
    user = User(phone=phone, full_name="کاربر رفرش", is_active=is_active,
                hashed_password=get_password_hash(PASSWORD))
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()  # آزادکردن write-lock تا handlerِ هم‌تراکنش قفل نکند
    return user


@pytest.fixture()
def member(db):
    return _make_user(db, "09121000900")


@pytest.fixture()
def deactivated(db):
    return _make_user(db, "09121000901", is_active=False)


def _login(client, phone: str, password: str = PASSWORD):
    return client.post("/api/v1/auth/login", json={"phone": phone, "password": password})


def _decode(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])


def test_login_returns_access_and_refresh(client, member):
    r = _login(client, member.phone)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"] and body["refresh_token"]


def test_wrong_password_is_rejected(client, member):
    assert _login(client, member.phone, "wrong-password").status_code == 401


def test_refresh_returns_new_access_token_for_same_user(client, member):
    refresh = _login(client, member.phone).json()["refresh_token"]
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert r.status_code == 200, r.text
    payload = _decode(r.json()["access_token"])
    assert payload["sub"] == member.phone
    assert payload.get("type") != "refresh"


def test_garbage_refresh_token_rejected(client):
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": "invalid.token.here"})
    assert r.status_code == 401


def test_access_token_cannot_be_used_as_refresh(client, member):
    """تشخیص نوع: access (بدون claim type) نباید جای refresh پذیرفته شود"""
    access = _login(client, member.phone).json()["access_token"]
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": access})
    assert r.status_code == 401


def test_refresh_token_of_unknown_phone_rejected(client):
    r = client.post("/api/v1/auth/refresh",
                    json={"refresh_token": create_refresh_token(data={"sub": "09120000000"})})
    assert r.status_code == 401


def test_inactive_user_cannot_refresh(client, deactivated):
    r = client.post("/api/v1/auth/refresh",
                    json={"refresh_token": create_refresh_token(data={"sub": deactivated.phone})})
    assert r.status_code == 401


def test_refresh_token_lives_longer_than_access(client, member):
    body = _login(client, member.phone).json()
    access, refresh = _decode(body["access_token"]), _decode(body["refresh_token"])
    assert refresh.get("type") == "refresh"
    assert refresh["exp"] > access["exp"]
    # ۳۰ روز در برابر ۲۴ ساعت ⇒ اختلاف باید دست‌کم یک هفته باشد
    assert refresh["exp"] - access["exp"] >= 7 * 86400
