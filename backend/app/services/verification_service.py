# backend/app/services/verification_service.py
"""سرویس تأیید هویت کاربر — کد یکبار مصرف (OTP) ارسال‌شده به ایمیل

روش رایگان: ارسال کد به ایمیل. اگر SMTP پیکربندی نشده باشد (حالت توسعه)،
کد در پاسخ API و لاگ برمی‌گردد تا فرآیند قابل تست باشد.
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

    برگشتی: در حالت توسعه (بدون SMTP) خودِ کد را برمی‌گرداند، وگرنه رشته خالی.
    """
    code = f"{random.randint(0, 999999):06d}"
    _get_redis().set(_code_key(phone), _hash_code(code), ex=OTP_TTL_SECONDS)

    sent = _send_email(email, code)
    if not sent:
        logger.warning("SMTP not configured — verification code for %s (phone %s): %s", email, phone, code)
        return code
    return ""


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

    چون درگاه پیامک در دسترس نیست، کد همیشه در حالت توسعه برگردانده
    می‌شود (dev_code) تا کاربر بتواند جریان را کامل کند.
    """
    code = f"{random.randint(0, 999999):06d}"
    _get_redis().set(_reset_key(phone), _hash_code(code), ex=OTP_TTL_SECONDS)
    logger.info("password reset code for %s: %s", phone, code)
    return code


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
