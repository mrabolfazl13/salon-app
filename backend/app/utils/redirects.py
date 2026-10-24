# backend/app/utils/redirects.py
"""Location ریدایرکت‌های همان-میزبان را نسبی می‌کند.

مسیر واقعی: مسیرهای API روی «/» ثبت شده‌اند، پس `/api/v1/venues` (بدون اسلش) یک
۳۰۷ می‌گیرد و Starlette آن Location را مطلق و از روی طرح‌واژهٔ دیده‌شده توسط
uvicorn می‌سازد؛ چون nginx به‌صورت http وصل می‌شود آن آدرس `http://…` است.
مرورگر روی صفحهٔ `https://…` دنبال‌کردنِ ریدایرکتِ `http://` را به‌عنوان
mixed-content می‌بندد و پاسخ اصلاً به اپ نمی‌رسد (یافتهٔ ۱۴۰۵/۰۸/۰۲: لیست
سالن‌ها روی پروداکشن «جواب نمی‌داد»). Location نسبی طرح‌واژهٔ خودِ درخواست را
به ارث می‌برد، پس برای مرورگر HTTPS، کلاینت HTTP و APK هر سه درست کار می‌کند.
"""
from urllib.parse import urlsplit, urlunsplit

REDIRECT_STATUSES = {301, 302, 303, 307, 308}
LOCATION_HEADER = b"location"


def _authority(netloc: str) -> str:
    """میزبان بدون پورت — مقایسهٔ میزبان، نه آدرس کامل."""
    host, _, port = netloc.lower().rpartition(":")
    return host if (host and port.isdigit()) else netloc.lower()


def _request_authority(scope) -> str:
    host = ""
    for name, value in scope.get("headers", []):
        lowered = name.lower()
        if lowered == b"x-forwarded-host":
            return _authority(value.decode("latin-1"))
        if lowered == b"host":
            host = value.decode("latin-1")
    return _authority(host)


def relative_location(location: str, request_authority: str) -> str:
    """اگر Location به همین میزبان اشاره کند، آن را به مسیر+کوئری تبدیل می‌کند.

    ریدایرکت بیرونی (مثلاً درگاه پرداخت) دست‌نخورده می‌ماند.
    """
    parts = urlsplit(location)
    if not parts.scheme or not parts.netloc:
        return location
    if _authority(parts.netloc) != _authority(request_authority):
        return location
    return urlunsplit(("", "", parts.path or "/", parts.query, ""))


class RelativeRedirectMiddleware:
    """میانه‌ٔ خالص ASGI — روی پاسخ‌های ریدایرکت فقط هدر Location را عوض می‌کند."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_authority = _request_authority(scope)

        async def send_with_relative_location(message):
            if (
                message["type"] == "http.response.start"
                and message.get("status") in REDIRECT_STATUSES
            ):
                headers = [
                    (
                        (LOCATION_HEADER, relative_location(value.decode("latin-1"), request_authority).encode("latin-1"))
                        if name.lower() == LOCATION_HEADER
                        else (name, value)
                    )
                    for name, value in message["headers"]
                ]
                message = {**message, "headers": headers}
            await send(message)

        await self.app(scope, receive, send_with_relative_location)
