# backend/app/services/eitaa_service.py
"""سرویس انتشار جدول سانسها در کانال ایتا.

مستندات ایتایار (https://eitaayar.ir/api) فقط سه متد دارد:
getMe / sendMessage / sendFile — متد ویرایش یا حذف پیام وجود ندارد.
پس «تیک خوردن ساعت» یعنی **ارسال مجدد همان متن** با علامت ✅ روی سانس تأییدشده.
پیام تازه بهصورت reply به پست قبلی فرستاده میشود تا زنجیرهی بهروزرسانیها
در کانال قابل دنبال کردن بماند.

چیزی که از خود ایتا نمیتوانیم بگیریم: ساخت کانال، وب-hook، دکمه و ویرایش پیام.
مدیر سالن باید کانال را دستی بسازد و ربات ایتایار را ادمین آن کند.
"""
import logging
from datetime import date, datetime, time, timezone
from typing import Optional
from zoneinfo import ZoneInfo

import httpx
from sqlmodel import select

from app.models.booking import Booking, BookingStatus
from app.models.eitaa import EitaaChannel
from app.models.slot import Slot, SlotStatus
from app.utils.jalali import jalali_string
from app.utils.token_crypto import decrypt_token

logger = logging.getLogger(__name__)

EITAA_API_BASE = "https://eitaayar.ir/api"
TEHRAN_TZ = ZoneInfo("Asia/Tehran")
MAX_MESSAGE_CHARS = 900  # حاشیهی ایمن زیر سقف ۱۰۰۰ کاراکتری ایتا

_FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")


class EitaaError(RuntimeError):
    """خطای قابل نمایش در لاگ/API — بدون نشت توکن در پیام."""


def today_tehran() -> date:
    """تاریخ محلی سالن به وقت تهران، مستقل از timezone سرور."""
    return datetime.now(TEHRAN_TZ).date()


def fa_number(value: object) -> str:
    return str(value).translate(_FA_DIGITS)


def fa_time(value: time) -> str:
    return fa_number(f"{value.hour:02d}:{value.minute:02d}")


def send_message(
    *, token: str, chat_id: str, text: str,
    pin: bool = False, reply_to_message_id: Optional[int] = None,
) -> dict:
    """فراخوانی متد sendMessage ایتایار. آدرس: /{TOKEN}/sendMessage."""
    payload = {"chat_id": chat_id, "text": text}
    if pin:
        payload["pin"] = 1
    if reply_to_message_id is not None:
        payload["id_message_to_reply"] = reply_to_message_id

    # توکن در مسیر URL است؛ آنرا در هیچ پیام خطا قرار ندهیم
    url = f"{EITAA_API_BASE}/{token}/sendMessage"
    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.post(url, data=payload)
        payload_out = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise EitaaError(f"ارسال به ایتا ناموفق بود ({type(exc).__name__})") from exc

    if not isinstance(payload_out, dict) or not payload_out.get("ok"):
        detail = payload_out.get("description") if isinstance(payload_out, dict) else None
        raise EitaaError(f"ایتا پاسخ ناموفق داد: {str(detail or 'نامشخص')[:120]}")

    result = payload_out.get("result")
    if not isinstance(result, dict):
        raise EitaaError("پاسخ ایتا فاقد result معتبر است")
    return result


def build_schedule_text(uow, venue_id: int, day: date, *, now: Optional[datetime] = None) -> str:
    """متن فارسی جدول سانسها — سانسهای تأییدشده با ✅ مشخص میشوند."""
    venue = uow.venues.get_by_id(venue_id)
    if venue is None:
        raise ValueError(f"Venue {venue_id} not found")

    slots = sorted(
        uow.slots.get_by_venue_and_date(venue_id, day),
        key=lambda s: (s.start_time, s.id or 0),
    )

    confirmed_ids: set[int] = set()
    if slots:
        slot_ids = [s.id for s in slots if s.id is not None]
        if slot_ids:
            bookings = uow.session.exec(
                select(Booking).where(
                    Booking.slot_id.in_(slot_ids),
                    Booking.status == BookingStatus.CONFIRMED,
                )
            ).all()
            confirmed_ids = {b.slot_id for b in bookings}

    lines = [f"🏟 {venue.name} — سانس‌های {fa_number(jalali_string(day))}", ""]
    if not slots:
        lines.append("سانسی برای این روز ثبت نشده است.")

    for slot in slots:
        label = fa_time(slot.start_time)
        if slot.id in confirmed_ids:
            lines.append(f"✅ {label} — رزرو تأیید شد")
            continue
        status = slot.status
        if status == SlotStatus.AVAILABLE:
            price = fa_number(f"{slot.current_price:,}")
            lines.append(f"☐ {label} — آزاد — {price} تومان")
        elif status == SlotStatus.BOOKED:
            lines.append(f"⏳ {label} — رزرو شده (در انتظار تأیید)")
        elif status == SlotStatus.RESERVED:
            lines.append(f"🔒 {label} — رزرو موقت")
        elif status == SlotStatus.BLOCKED:
            lines.append(f"⛔ {label} — بسته")
        elif status == SlotStatus.IN_COMPETITION:
            lines.append(f"🏆 {label} — رقابت قیمت")
        else:
            lines.append(f"🔒 {label} — {getattr(status, 'value', status)}")

    now = now or datetime.now(TEHRAN_TZ)
    lines += [
        "",
        f"🕒 آخرین بهروزرسانی: {fa_time(now.time())}",
        "وضعیت رزروها لحظه‌ای است؛ پیش از مراجعه تماس بگیرید.",
    ]
    if venue.phone:
        lines.append(f"📞 تماس: {fa_number(venue.phone)}")

    text = "\n".join(lines)
    if len(text) > MAX_MESSAGE_CHARS:
        text = text[: MAX_MESSAGE_CHARS - 1].rstrip() + "…"
    return text


def publish_schedule(
    uow,
    venue_id: int,
    *,
    day: Optional[date] = None,
    is_update: bool = False,
) -> dict:
    """پست روزانه یا ارسال مجدد بهروزشدهای همان جدول.

    خطاهای شبکه/API در EitaaError میماند تا تماسکننده تصمیم بگیرد (تأیید رزرو
    نباید به خاطر قطعی ایتا شکست بخورد).
    """
    channel = uow.session.exec(
        select(EitaaChannel).where(EitaaChannel.venue_id == venue_id)
    ).first()
    if channel is None:
        return {"skipped": "not_configured"}
    if not channel.is_active:
        return {"skipped": "disabled"}

    day = day or today_tehran()
    text = build_schedule_text(uow, venue_id, day)

    try:
        result = send_message(
            token=decrypt_token(channel.bot_token),
            chat_id=channel.chat_id,
            text=text,
            pin=bool(channel.pin_updates and is_update),
            reply_to_message_id=channel.last_message_id if is_update else None,
        )
    except EitaaError as exc:
        channel.last_error = str(exc)[:500]
        channel.updated_at = datetime.now(timezone.utc)
        uow.commit()
        raise

    message_id = result.get("message_id")
    if message_id is not None:
        try:
            channel.last_message_id = int(message_id)
        except (TypeError, ValueError):
            logger.warning("Eitaa returned non-integer message_id: %r", message_id)
    channel.last_post_date = day
    channel.last_text = text
    channel.last_error = None
    channel.updated_at = datetime.now(timezone.utc)
    uow.commit()

    return {
        "message_id": channel.last_message_id,
        "day": day.isoformat(),
        "reposted": bool(is_update),
        "text": text,
    }
