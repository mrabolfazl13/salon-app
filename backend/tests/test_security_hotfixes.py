# backend/tests/test_security_hotfixes.py
"""تست‌های hotfix امنیتی — احراز هویت WebSocket + افشای dev_code در پاسخ‌ها"""
import re

import pytest
from starlette.websockets import WebSocketDisconnect

import app.services.verification_service as verification_service
import app.utils.rate_limit as rate_limit_module
from app.config import settings
from app.utils.auth import create_access_token
from app.utils.websocket import manager
from app.models.user import User, UserRole
from helpers import auth, FakeRedis

CODE_RE = re.compile(r"^\d{6}$")


@pytest.fixture()
def fake_redis(monkeypatch):
    """Redis ساختگی برای سرویس تأیید + لیمیترها (بدون Redis واقعی در تست)"""
    fake = FakeRedis()
    monkeypatch.setattr(verification_service, "_get_redis", lambda: fake)
    monkeypatch.setattr(rate_limit_module, "_client", fake)
    return fake


def _token(user: User) -> str:
    return create_access_token({"sub": user.phone})


def _expect_ws_close(client, url: str, code: int):
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(url) as ws:
            ws.send_text("x")
            ws.receive_text()
    assert exc_info.value.code == code


def _expect_ws_echo(client, url: str):
    with client.websocket_connect(url) as ws:
        ws.send_text("ping")
        assert ws.receive_text() == "Echo: ping"


# ─────────────────────────── WebSocket auth ───────────────────────────

def test_ws_user_channel_rejects_missing_token(client, seed):
    owner = seed["user"]("09121000001")
    _expect_ws_close(client, f"/ws/user/{owner.id}", 4401)


def test_ws_user_channel_rejects_invalid_token(client, seed):
    owner = seed["user"]("09121000002")
    _expect_ws_close(client, f"/ws/user/{owner.id}?token=not.a.valid.jwt", 4401)


def test_ws_user_channel_owner_allowed(client, seed):
    owner = seed["user"]("09121000003")
    _expect_ws_echo(client, f"/ws/user/{owner.id}?token={_token(owner)}")


def test_ws_user_channel_other_user_forbidden(client, seed):
    owner = seed["user"]("09121000004")
    stranger = seed["user"]("09121000005")
    # ورود با کلید 4403 و سپس اتصال با 4403 (کلاینت می‌تواند پیام دریافت نکند)
    _expect_ws_close(client, f"/ws/user/{owner.id}?token={_token(stranger)}", 4403)


def test_ws_user_channel_super_admin_can_subscribe(client, seed):
    owner = seed["user"]("09121000006")
    admin = seed["user"]("09121000007", role=UserRole.SUPER_ADMIN)
    _expect_ws_echo(client, f"/ws/user/{owner.id}?token={_token(admin)}")


def test_ws_role_room_rejects_invalid_token(client, seed):
    _expect_ws_close(client, "/ws/managers?token=garbage", 4401)


def test_ws_role_room_plain_user_forbidden(client, seed):
    user = seed["user"]("09121000008")
    _expect_ws_close(client, f"/ws/managers?token={_token(user)}", 4403)


def test_ws_role_room_managers_and_admins(client, seed):
    manager_user = seed["user"]("09121000009", role=UserRole.VENUE_MANAGER)
    club = seed["user"]("09121000010", role=UserRole.CLUB_ADMIN)
    admin = seed["user"]("09121000011", role=UserRole.SUPER_ADMIN)
    user = seed["user"]("09121000012")

    _expect_ws_echo(client, f"/ws/managers?token={_token(manager_user)}")
    _expect_ws_echo(client, f"/ws/managers?token={_token(club)}")
    _expect_ws_close(client, f"/ws/admins?token={_token(manager_user)}", 4403)
    _expect_ws_close(client, f"/ws/admins?token={_token(user)}", 4403)
    _expect_ws_echo(client, f"/ws/admins?token={_token(admin)}")


def test_ws_connection_keyed_by_verified_user_id(client, seed):
    """شناسه‌ی ثبت‌شده در اتاق باید شناسه‌ی تأییدشده از JWT باشد، نه ادعای URL"""
    owner = seed["user"]("09121000013")
    with client.websocket_connect(f"/ws/user/{owner.id}?token={_token(owner)}") as ws:
        uid = manager.active_connections["users"][0][1]
        assert uid == owner.id
        ws.send_text("ok")
        ws.receive_text()


# ─────────────────────────── dev_code gating ───────────────────────────

def test_verify_email_request_hides_dev_code_by_default(client, seed, fake_redis):
    seed["user"]("09122000001")
    r = client.post("/api/v1/auth/verify/email/request",
                    json={"phone": "09122000001", "email": "a@b.com"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert "dev_code" not in body
    assert "message" in body
    # کد هش‌شده در Redis مانده است (کد واقعی هرگز در پاسخ نمی‌آید)
    assert any(k.startswith("verify:code:") for k in fake_redis.store)


def test_verify_email_request_returns_dev_code_when_flag_on(client, seed, fake_redis, monkeypatch):
    monkeypatch.setattr(settings, "DEBUG_ALLOW_DEV_CODE", True)
    seed["user"]("09122000002")
    r = client.post("/api/v1/auth/verify/email/request",
                    json={"phone": "09122000002", "email": "a@b.com"})
    assert r.status_code == 200, r.text
    assert CODE_RE.match(r.json().get("dev_code") or "") is not None


def test_forgot_password_hides_dev_code_by_default(client, seed, fake_redis):
    seed["user"]("09122000003")
    r = client.post("/api/v1/auth/forgot-password", json={"phone": "09122000003"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert "dev_code" not in body
    # حتی وقتی SMTP نیست، فقط پاسخ عمومی برمی‌گردد
    assert any(k.startswith("reset:code:") for k in fake_redis.store)


def test_forgot_password_returns_dev_code_when_flag_on(client, seed, fake_redis, monkeypatch):
    monkeypatch.setattr(settings, "DEBUG_ALLOW_DEV_CODE", True)
    seed["user"]("09122000004")
    r = client.post("/api/v1/auth/forgot-password", json={"phone": "09122000004"})
    assert r.status_code == 200, r.text
    assert CODE_RE.match(r.json().get("dev_code") or "") is not None


def test_forgot_password_unknown_phone_no_code_even_with_flag(client, seed, fake_redis, monkeypatch):
    monkeypatch.setattr(settings, "DEBUG_ALLOW_DEV_CODE", True)
    r = client.post("/api/v1/auth/forgot-password", json={"phone": "09122000099"})
    assert r.status_code == 200
    assert "dev_code" not in r.json()
