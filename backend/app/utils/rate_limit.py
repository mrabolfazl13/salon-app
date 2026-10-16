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
# آخرین باری که Redis پاسخ نداد — تا پایان مهلٔ «سرد شدن» اصلاً به آن دست نمی‌زنیم.
# دلیل: بدون timeout، getaddrinfo برای میزبان غیرقابل‌حل (مثلاً redis://redis در
# محیط لوکال/CI) چند دقیقه بلاک می‌کند و هر درخواست یک ترد را می‌خورد؛ fail-open
# فقط وقتی کار می‌کند که استثنا raised شود.
_down_until = 0.0
DOWN_COOLDOWN_SECONDS = 30.0


def _get_redis():
    """کلاینت Redis مشترک ماژول (decode_responses) — قابل monkeypatch در تست‌ها"""
    global _client
    if _client is None:
        _client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            # اتصال/خوانده‌شدن باید کران‌دار باشد وگرنه قطعی Redis خودِ hang می‌شود
            socket_connect_timeout=settings.REDIS_SOCKET_TIMEOUT_SECONDS,
            socket_timeout=settings.REDIS_SOCKET_TIMEOUT_SECONDS,
        )
    return _client


def _bump(key: str, ttl: int) -> int | None:
    """شمارندهٔ پنجره‌ای؛ None ⇒ Redis در دسترس نیست (خطا یا در cooldown).

    موفقیت، شکست‌شمار را صفر می‌کند تا بازگشت Redis بلافاصله effects داشته باشد.
    """
    global _down_until
    now = time.monotonic()
    if now < _down_until:
        return None
    try:
        r = _get_redis()
        count = int(r.incr(key))
        if count == 1:
            r.expire(key, ttl)
    except Exception as e:  # noqa: BLE001 — قطعی Redis نباید سرویس را بخواباند
        _down_until = now + DOWN_COOLDOWN_SECONDS
        logger.warning(
            "rate_limit: Redis در دسترس نیست — %s ثانیه از آن عبور می‌کنیم: %s",
            int(DOWN_COOLDOWN_SECONDS), e,
        )
        return None
    _down_until = 0.0
    return count


RATE_LIMIT_DETAIL = "تعداد درخواست‌ها بیش از حد مجاز است، لطفاً چند دقیقه دیگر تلاش کنید"


def _client_ip(request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(times, seconds: int, scope: str = "default") -> Callable:
    """سازنده وابستگی: حداکثر `times` درخواست در هر `seconds` ثانیه به‌ازای IP+مسیر.

    `times` می‌تواند عدد یا callable باشد؛ callable باعث می‌شود مقدار از settings
    هنگام درخواست خوانده شود، نه فقط یک‌بار در import.
    """

    def dependency(request: Request) -> None:
        limit = times() if callable(times) else times
        window = int(time.time() // seconds)
        key = f"ratelimit:{scope}:{_client_ip(request)}:{request.url.path}:{window}"
        count = _bump(key, seconds + 1)
        if count is None:
            logger.warning("rate_limit: بدون Redis — درخواست آزاد عبور کرد (%s)", scope)
            return
        if count > limit:
            raise HTTPException(
                status_code=429,
                detail=RATE_LIMIT_DETAIL,
                headers={"Retry-After": str(int(seconds))},
            )

    return dependency


# نمونه‌های مشترک برای سیم‌کشی در routerها (تست‌ها می‌توانند override کنند)
_auth_burst = rate_limit(5, 60, scope="auth")
_auth_hourly = rate_limit(lambda: settings.AUTH_RATE_LIMIT_PER_HOUR, 3600, scope="auth-hourly")


def _auth_guard(request: Request) -> None:
    """سقف دوپنجره‌ای برای مسیرهای احراز هویت: ریزش ناگهانی + تلاش مستمر در ساعت.

    AUTH_RATE_LIMIT_PER_HOUR پیش‌تر در config تعریف شده ولی هیچ‌جا خوانده نمی‌شد.
    """
    _auth_burst(request)
    _auth_hourly(request)


auth_rate_limit = _auth_guard
verification_rate_limit = rate_limit(5, 60, scope="verify")
booking_rate_limit = rate_limit(20, 60, scope="booking")
payment_rate_limit = rate_limit(10, 60, scope="payment")


# ─────────────── سقف سراسری روی همهٔ مسیرهای API ───────────────
# ۲۷ روتر بدون هیچ محدودیتی بودند؛ این middleware حد پیش‌فرض را به همهٔ /api/* می‌دهد
# و سقف‌های تخصصی بالا (auth/booking/payment) را لغو نمی‌کند، بلکه کنارشان می‌نشیند.
_EXEMPT_PREFIXES = ("/health", "/api/v1/health", "/docs", "/redoc", "/openapi.json")


def _is_exempt(path: str, method: str) -> bool:
    if method == "OPTIONS":  # پیش‌درخواست CORS نباید شمرده شود
        return True
    clean = path.rstrip("/") or "/"
    if not clean.startswith("/api"):
        return True  # /static، /minio، ریشه و مستندات از این قفل مستثناوند
    return any(clean == p.rstrip("/") or clean.startswith(p + "/") for p in _EXEMPT_PREFIXES)


async def global_rate_limit_middleware(request: Request, call_next):
    """حداکثر RATE_LIMIT_PER_MINUTE درخواست در دقیقه به‌ازای IP روی همهٔ مسیرهای API."""
    from fastapi.responses import JSONResponse

    if _is_exempt(request.url.path, request.method):
        return await call_next(request)

    seconds = 60
    window = int(time.time() // seconds)
    key = f"ratelimit:global:{_client_ip(request)}:{window}"
    limit = settings.RATE_LIMIT_PER_MINUTE
    count = _bump(key, seconds + 1)
    if count is None:
        if settings.RATE_LIMIT_FAIL_OPEN:
            logger.warning("rate_limit(global): Redis در دسترس نیست — درخواست بدون محدودیت عبور کرد")
            return await call_next(request)
        logger.error("rate_limit(global): Redis خراب است و FAIL_OPEN خاموش — 503")
        return JSONResponse(
            status_code=503,
            content={"detail": "سرویس موقتاً در دسترس نیست، چند دقیقه دیگر تلاش کنید"},
            headers={"Retry-After": str(seconds)},
        )

    if count > limit:
        # پاسخ مستقیم، نه raise: خطای throw‌شده داخل http-middleware به
        # ExceptionMiddleware نمی‌رسد و به ۵۰۰ تبدیل می‌شود
        return JSONResponse(
            status_code=429,
            content={"detail": RATE_LIMIT_DETAIL},
            headers={"Retry-After": str(seconds)},
        )
    return await call_next(request)


def cooldown_guard(ident: str, seconds: int) -> bool:
    """نگهبان خنک‌سر یک‌کلیده (SET NX + TTL) — True ⇒ مجاز.

    برای «حداکثر یک بار در دقیقه به‌ازای X» (مثل یادآوری پرداخت بازی).
    بدون Redis ⇒ آزاد عبور می‌کند (graceful، هم‌را با rate_limit).
    """
    key = f"cooldown:{ident}"
    global _down_until
    now = time.monotonic()
    if now < _down_until:
        return True  # در cooldown: همان graceful قبلی، بدون تلاش اتصال
    try:
        r = _get_redis()
        allowed = bool(r.set(key, "1", nx=True, ex=seconds))
    except Exception as e:  # noqa: BLE001
        _down_until = now + DOWN_COOLDOWN_SECONDS
        logger.warning("cooldown_guard: Redis در دسترس نیست — آزاد عبور کرد (%s)", e)
        return True
    _down_until = 0.0
    return allowed
