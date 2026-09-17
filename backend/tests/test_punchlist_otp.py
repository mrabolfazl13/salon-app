# backend/tests/test_punchlist_otp.py
"""قلمرو امنیتی: هیچ مقدار کد OTP/بازیابی در لاگ ثبت نمی‌شود (caplog).

الگو: monkeypatch ریدیس + randint برایدانستن مقدار کد؛ آنگونه ادعا:
«مقدارِ همانِ کد» در هیچ رکورد لاگی نباید دیده شود، ولی کوئِست‌
جریان (set/get/confirm) سالم کار کند.
"""
import logging

import pytest

import app.services.verification_service as vs
from app.config import settings
from helpers import FakeRedis

KNOWN_CODE = "123456"


@pytest.fixture()
def fake_verify_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(vs, "_client", fake)
    monkeypatch.setattr(vs.random, "randint", lambda a, b: int(KNOWN_CODE))
    return fake


def _assert_no_code_in(caplog):
    assert KNOWN_CODE not in caplog.text


def test_email_code_request_logs_no_code_value(fake_verify_redis, caplog, monkeypatch):
    monkeypatch.setattr(vs.settings, "SMTP_HOST", "")  # بدون SMTP ⇒ مسیر لاگِ fallback
    with caplog.at_level(logging.DEBUG, logger="app.services.verification_service"):
        fake_verify_redis  # noqa
        out = vs.request_email_code("091200000001", "u@example.com")
    assert out == (KNOWN_CODE if settings.DEBUG_ALLOW_DEV_CODE else "")
    _assert_no_code_in(caplog)
    assert len(caplog.records) >= 1
    assert "091200000001" in caplog.text  # تلفنِ مقصد ثبت می‌شود، نه خودِ کد
    # کد در ریدیس هش‌شده ماند و اعتبارسنجی کار می‌کند
    assert vs._hash_code(KNOWN_CODE) == fake_verify_redis.store[vs._code_key("091200000001")]
    assert vs.confirm_code("091200000001", KNOWN_CODE) is True
    assert fake_verify_redis.get(vs._code_key("091200000001")) is None


def test_password_reset_code_logs_no_value(fake_verify_redis, caplog):
    with caplog.at_level(logging.DEBUG, logger="app.services.verification_service"):
        out = vs.request_password_reset_code("091200000002")
    assert out == (KNOWN_CODE if settings.DEBUG_ALLOW_DEV_CODE else "")
    _assert_no_code_in(caplog)
    assert "091200000002" in caplog.text
    assert KNOWN_CODE not in fake_verify_redis.store.get(vs._reset_key("091200000002"), "")
    assert vs.confirm_reset_code("091200000002", KNOWN_CODE) is True