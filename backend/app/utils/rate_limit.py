# backend/app/utils/rate_limit.py
"""محدودکننده نرخ پنجره‌ثابت (fixed-window) مبتنی بر Redis برای نقاط‌پایانی حساس

- وابستگی FastAPI می‌سازد که با کلید «قلمرو + IP کلاینت + مسیر + شماره پنجره زمانی»
  درخواست‌ها را می‌شمارد و پس از سقف، خطای 429 با پیام فارسی برمی‌گرداند.
- اگر Redis در دسترس نباشد، درخواست با هشدار لاگ آزاد عبور می‌کند
  (degrade graceful) — قطعی Redis سرویس را از کار نمی‌اندازد.
- از همان روش اتصال redis.from_url که pending_booking_service استفاده می‌کند.
"""
import logging
import time
from typing import Callable

import redis
from fastapi import HTTPException, Request

from app.config import settings

logger = logging.getLogger(__name__)

_client = None


def _get_redis():
    """کلاینت Redis مشترک ماژول (decode_responses) — قابل monkeypatch در تست‌ها"""
    global _client
    if _client is None:
        _client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _client


RATE_LIMIT_DETAIL = "تعداد درخواست‌ها بیش از حد مجاز است، لطفاً چند دقیقه دیگر تلاش کنید"


def _client_ip(request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(times: int, seconds: int, scope: str = "default") -> Callable:
    """سازنده وابستگی: حداکثر `times` درخواست در هر `seconds` ثانیه به‌ازای IP+مسیر"""

    def dependency(request: Request) -> None:
        window = int(time.time() // seconds)
        key = f"ratelimit:{scope}:{_client_ip(request)}:{request.url.path}:{window}"
        try:
            r = _get_redis()
            count = r.incr(key)
            if count == 1:
                r.expire(key, seconds + 1)
        except Exception as e:  # noqa: BLE001 — قطعی Redis نباید سرویس را بخواباند
            logger.warning("rate_limit: Redis در دسترس نیست — درخواست بدون محدودیت عبور کرد (%s): %s", scope, e)
            return
        if count > times:
            raise HTTPException(
                status_code=429,
                detail=RATE_LIMIT_DETAIL,
                headers={"Retry-After": str(int(seconds))},
            )

    return dependency


# نمونه‌های مشترک برای سیم‌کشی در routerها (تست‌ها می‌توانند override کنند)
auth_rate_limit = rate_limit(5, 60, scope="auth")
verification_rate_limit = rate_limit(5, 60, scope="verify")
booking_rate_limit = rate_limit(20, 60, scope="booking")
payment_rate_limit = rate_limit(10, 60, scope="payment")


def cooldown_guard(ident: str, seconds: int) -> bool:
    """نگهبان خنک‌سر یک‌کلیده (SET NX + TTL) — True ⇒ مجاز.

    برای «حداکثر یک بار در دقیقه به‌ازای X» (مثل یادآوری پرداخت بازی).
    بدون Redis ⇒ آزاد عبور می‌کند (graceful، هم‌را با rate_limit).
    """
    key = f"cooldown:{ident}"
    try:
        r = _get_redis()
        return bool(r.set(key, "1", nx=True, ex=seconds))
    except Exception as e:  # noqa: BLE001
        logger.warning("cooldown_guard: Redis در دسترس نیست — آزاد عبور کرد (%s)", e)
        return True
