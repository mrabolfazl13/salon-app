# backend/app/services/verification_service.py
"""سرویس تأیید هویت کاربر — کد یکبار مصرف (OTP) ارسال‌شده به ایمیل

روش رایگان: ارسال کد به ایمیل. در نبود SMTP، فقط «درخواست کد برای فلان
شماره» در لاگ ثبت می‌شود — هرگز خودِ کد. قرار دادن کد در پاسخ API
(dev_code) تنها با flag توسعه DEBUG_ALLOW_DEV_CODE=true مجاز است.
"""
import logging
import random
import hashlib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import redis

from app.config import settings

logger = logging.getLogger(__name__)

_client: "redis.Redis | None" = None
OTP_TTL_SECONDS = 600  # ۱۰ دقیقه


def _get_redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _client


def _code_key(phone: str) -> str:
    return f"verify:code:{phone}"


def _reset_key(phone: str) -> str:
    return f"reset:code:{phone}"


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def request_email_code(phone: str, email: str) -> str:
    """تولید کد و ارسال به ایمیل.

    برگشتی: خودِ کد فقط وقتی DEBUG_ALLOW_DEV_CODE روشن است برمی‌گردد؛ وگرنه رشته خالی.
    """
    code = f"{random.randint(0, 999999):06d}"
    _get_redis().set(_code_key(phone), _hash_code(code), ex=OTP_TTL_SECONDS)

    sent = _send_email(email, code)
    if not sent:
        # هرگز مقدار کد در لاگ ثبت نمی‌شود — فقط اینکه برای چه کسی کد درخواست شد
        logger.warning("verification code requested for email %s (phone %s) — SMTP not configured",
                       email, phone)
    # افشای کد در پاسخ API فقط با flag توسعه؛ در لاگ هیچ‌وقت مقدار کد نمی‌ماند
    return code if settings.DEBUG_ALLOW_DEV_CODE else ""


def confirm_code(phone: str, code: str) -> bool:
    r = _get_redis()
    stored = r.get(_code_key(phone))
    if not stored or stored != _hash_code(code.strip()):
        return False
    r.delete(_code_key(phone))
    return True


# ─────────────────────────── بازیابی رمز عبور (OTP) ───────────────────────────

def request_password_reset_code(phone: str) -> str:
    """تولید کد یکبار مصرف بازیابی رمز.

    کد بازیابی هیچ‌جا (لاگ یا پاسخ) افشا نمی‌شود؛ در پاسخ API
    (dev_code) تنها با DEBUG_ALLOW_DEV_CODE=true بازگردانده می‌شود.
    """
    code = f"{random.randint(0, 999999):06d}"
    _get_redis().set(_reset_key(phone), _hash_code(code), ex=OTP_TTL_SECONDS)
    # مقدار کد هرگز لاگ نمی‌شود — دفتر لاگ‌ها کانال کم‌امنیت است
    logger.info("password reset code requested for phone %s", phone)
    # بدون flag توسعه، کد هرگز در پاسخ API قرار نمی‌گیرد
    return code if settings.DEBUG_ALLOW_DEV_CODE else ""


def confirm_reset_code(phone: str, code: str) -> bool:
    """اعتبارسنجی کد بازیابی؛ در صورت موفقیت کد باطل می‌شود."""
    r = _get_redis()
    stored = r.get(_reset_key(phone))
    if not stored or stored != _hash_code(code.strip()):
        return False
    r.delete(_reset_key(phone))
    return True


def _send_email(email: str, code: str) -> bool:
    if not settings.SMTP_HOST:
        return False
    msg = MIMEMultipart()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = email
    msg["Subject"] = "کد تأیید — رزرو سالن فوتسال"
    msg.attach(MIMEText(
        f"سلام!\n\nکد تأیید شما: {code}\n\nاین کد تا ۱۰ دقیقه معتبر است.",
        "plain", "utf-8",
    ))
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, [email], msg.as_string())
        return True
    except Exception as e:  # noqa: BLE001
        logger.error("email send failed: %s", e)
        return False
