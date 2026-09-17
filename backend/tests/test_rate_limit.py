# backend/tests/test_rate_limit.py
"""تست محدودکننده نرخ fixed-window (Redis-backed) + graceful degradation"""
import re

import pytest
from fastapi import HTTPException

import app.utils.rate_limit as rate_limit_module
from app.utils.rate_limit import (
    auth_rate_limit, booking_rate_limit, payment_rate_limit,
    verification_rate_limit, rate_limit,
)
from app.api.v1 import auth as auth_api
from app.api.v1 import bookings as bookings_api
from app.api.v1 import payments as payments_api
from helpers import FakeRedis, auth


@pytest.fixture()
def fake_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(rate_limit_module, "_client", fake)
    return fake


class _Url:
    def __init__(self, path):
        self.path = path


class _Client:
    def __init__(self, host):
        self.host = host


class _Req:
    """حداقل Request ساختگی برای تزریق به dependency"""

    def __init__(self, path="/x", ip="5.5.5.5"):
        self.url = _Url(path)
        self.client = _Client(ip)
        self.headers = {}


def test_limiter_blocks_after_threshold(fake_redis):
    dep = rate_limit(3, 120, scope="t1")
    req = _Req("/some/route")
    for _ in range(3):
        dep(req)  # نباید throw کند
    with pytest.raises(HTTPException) as exc_info:
        dep(req)
    assert exc_info.value.status_code == 429
    assert "بیش از حد مجاز" in exc_info.value.detail
    assert exc_info.value.headers["Retry-After"] == "120"


def test_limiter_isolated_per_ip_route_scope(fake_redis):
    dep = rate_limit(1, 60, scope="iso")
    dep(_Req("/a", ip="1.1.1.1"))
    with pytest.raises(HTTPException):
        dep(_Req("/a", ip="1.1.1.1"))
    # IP دیگر / مسیر دیگر / scope دیگر نباید محدود شوند
    dep(_Req("/a", ip="2.2.2.2"))
    dep(_Req("/b", ip="1.1.1.1"))
    other = rate_limit(1, 60, scope="iso2")
    other(_Req("/a", ip="1.1.1.1"))


def test_limiter_degrades_gracefully_when_redis_down(monkeypatch):
    class Broken:
        def incr(self, key):
            raise ConnectionError("redis is down")
    monkeypatch.setattr(rate_limit_module, "_get_redis", lambda: Broken())
    dep = rate_limit(1, 60, scope="down")
    req = _Req()
    for _ in range(10):  # بیش از سقف — ولی به‌علت قطعی Redis باید آزاد عبور کند
        dep(req)


def test_limiter_counts_within_same_window(fake_redis):
    dep = rate_limit(2, 3600, scope="win")
    req = _Req("/win-test")
    dep(req)
    dep(req)
    with pytest.raises(HTTPException):
        dep(req)


# ─────────────── سیم‌کشی روی مسیرها ───────────────

def _deps_of(module_router, path_suffix):
    for route in module_router.router.routes:
        if getattr(route, "path", "").rstrip("/").endswith(path_suffix.rstrip("/")):
            return [d.call for d in route.dependant.dependencies]
    raise AssertionError(f"route not found: {path_suffix}")


def test_auth_routes_have_strict_limiter(fake_redis):
    for suffix in ("/register", "/login", "/forgot-password", "/reset-password",
                   "/verify/email/request", "/verify/email/confirm"):
        calls = _deps_of(auth_api, suffix)
        assert auth_rate_limit in calls or verification_rate_limit in calls, suffix


def test_booking_and_payment_routes_wired(fake_redis):
    assert booking_rate_limit in _deps_of(bookings_api, "/bookings")
    assert payment_rate_limit in _deps_of(payments_api, "/payments")
    assert payment_rate_limit in _deps_of(payments_api, "/pay")


def test_login_returns_429_after_threshold(client, fake_redis):
    # پنج تلاش اول (حتی ناموفق) مجاز، ششم ⇒ 429 با پیام فارسی
    codes = []
    for _ in range(5):
        r = client.post("/api/v1/auth/login", json={"phone": "09129999999", "password": "bad"})
        codes.append(r.status_code)
        assert r.status_code == 401, r.text
    r6 = client.post("/api/v1/auth/login", json={"phone": "09129999999", "password": "bad"})
    assert r6.status_code == 429, r6.text
    assert re.search("بیش از حد مجاز", r6.json()["detail"])
