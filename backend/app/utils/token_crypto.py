# backend/app/utils/token_crypto.py
"""رمزنگاری متقارن توکن ایتایار هنگام ذخیره در دیتابیس.

کلید عمومی نیست: سرور برای ارسال پستهای زمانبندیشده و بلافاصله بعد از تأیید رزرو
باید توکن را بداند؛ پس نمیتوان آنرا فقط در مرورگر مدیر نگه داشت. آنچه میشود کرد:
۱) توکن بهصورت رمزشده در DB بماند (Fernet/AES)؛
۲) هرگز در پاسخ API یا لاگ برگردانده نشود؛
۳) کلید از EITAA_TOKEN_KEY (یا JWT_SECRET) مشتق شود، نه از خود توکن.

مقادیر قدیمیِ متن ساده (پیش از اضافهشدن این ماژول) هنوز خوانده میشوند تا
استقرار روی DB موجود شکست نخورد.
"""
import base64
import hashlib
import logging

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings

logger = logging.getLogger(__name__)

_PREFIX = "enc:"
_FALLBACK_KEY = "dev-only-eitaa-token-key"


def _fernet() -> Fernet:
    secret = settings.EITAA_TOKEN_KEY or settings.JWT_SECRET or _FALLBACK_KEY
    key = base64.urlsafe_b64encode(hashlib.sha256(secret.encode("utf-8")).digest())
    return Fernet(key)


def encrypt_token(plain: str) -> str:
    """توکن را با پیشوندenc: رمز میکند تا در DB ذخیره شود."""
    if not plain:
        return ""
    return _PREFIX + _fernet().encrypt(plain.encode("utf-8")).decode("ascii")


def decrypt_token(stored: str | None) -> str:
    """توکن رمزشده را برمیگرداند؛ مقدار قدیمیِ متن ساده را هم قبول میکند."""
    if not stored:
        return ""
    if not stored.startswith(_PREFIX):
        return stored  # legacy plaintext — تا زمانی که دوباره ذخیره شود
    try:
        return _fernet().decrypt(stored[len(_PREFIX):].encode("ascii")).decode("utf-8")
    except (InvalidToken, ValueError, UnicodeDecodeError):
        logger.warning("Eitaa token could not be decrypted (key changed?)")
        return ""
