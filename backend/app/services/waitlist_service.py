# backend/app/services/waitlist_service.py
"""تبدیل خودکار صف انتظار به رزرو پس از پایان پنجرهٔ پاسخ‌گویی (B5).

رزرو از همان مسیر استاندارد ساخته می‌شود (BookingService.create_booking): مبلغ را
موتور قیمت سمت سرور می‌بندد، کوپن همان‌جا رزرو می‌شود و رزرو در حالت معلق می‌نشیند
تا مدیر سالن تأیید کند — job هرگز تأیید مدیر یا پرداخت را دور نمی‌زند.
"""
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from fastapi import HTTPException

from app.models.slot import SlotStatus
from app.services.booking_service import BookingService
from app.unit_of_work import UnitOfWork

WINDOW_HOURS = 2


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class WaitlistService:

    @staticmethod
    def window_hours() -> int:
        return WINDOW_HOURS

    @staticmethod
    def convert_expired(uow: UnitOfWork,
                        now: Optional[datetime] = None) -> Tuple[dict, List[dict]]:
        """نفر اول صفِ هر سانسِ بی‌صاحب‌مانده را بعد از اتمام پنجره رزرو می‌کند.

        قفل ردیف (SELECT ... FOR UPDATE) + وضعیت بازمطروحه ⇒ دو worker هم‌زمان یک
        نفر را دو بار تبدیل نمی‌کنند. هر کاندید داخل SAVEPOINT خودش می‌نشیند تا
        خطای یک سانس (سانس گرفته‌شده/قراردادی) بقیهٔ batch و تراکنش را خراب نکند.
        """
        now = now or _utcnow()
        heads = uow.slot_waitlist.expired_heads(now)
        booked = expired = 0
        notifications: List[dict] = []

        for candidate in heads:
            entry = uow.slot_waitlist.get_by_id_with_lock(candidate.id)
            if not entry or entry.status != "notified":
                continue  # یک worker دیگر قبلاً جمعش کرده
            slot = uow.slots.get_by_id(entry.slot_id)
            venue_name = (slot.venue.name if slot and slot.venue and slot.venue.name else "سالن")
            sp = uow.session.begin_nested()
            try:
                if not slot or slot.status != SlotStatus.AVAILABLE:
                    raise HTTPException(status_code=400, detail="سانس دیگر آزاد نیست")
                pending = BookingService.create_booking(uow, entry.slot_id, entry.user_id)
            except HTTPException as e:
                sp.rollback()
                entry.status = "expired"
                entry.updated_at = _utcnow()
                uow.session.add(entry)
                expired += 1
                notifications.append({
                    "user_id": entry.user_id,
                    "title": "پنجرهٔ صف انتظار بسته شد",
                    "message": f"سانس {venue_name} در دسترس نبود یا توسط نفر دیگری گرفته شد.",
                    "data": {"slot_id": entry.slot_id, "waitlist_entry_id": entry.id,
                             "reason": str(e.detail)},
                    "notif_type": "waitlist_expired",
                })
                continue
            except Exception:
                sp.rollback()
                raise
            sp.commit()
            entry.status = "booked"
            entry.updated_at = _utcnow()
            uow.session.add(entry)
            booked += 1
            notifications.append({
                "user_id": entry.user_id,
                "title": "رزرو خودکار از صف انتظار",
                "message": (f"چون در پنجرهٔ {WINDOW_HOURS} ساعته اقدام نکردید، سانس "
                            f"{venue_name} برای شما رزرو (معلق) شد تا مدیر سالن تأیید کند."),
                "data": {"slot_id": entry.slot_id, "booking_pending_id": pending.get("id"),
                         "payment_amount": pending.get("payment_amount"),
                         "waitlist_entry_id": entry.id},
                "notif_type": "waitlist_auto_booked",
            })

        return ({"candidates": len(heads), "booked": booked, "expired": expired},
                notifications)

    @staticmethod
    async def dispatch_notifications(uow: UnitOfWork, notifications: List[dict]) -> int:
        from app.services.notification_service import notification_service
        sent = 0
        for n in notifications:
            uid = n.get("user_id")
            if not uid:
                continue
            try:
                await notification_service.send_to_user(
                    uid, n["title"], n["message"], n.get("data"),
                    n.get("notif_type", "waitlist"))
                sent += 1
            except Exception as e:  # اعلان نباید جریان اصلی را بشکند
                print(f"[WaitlistService] notification failed: {e}")
        return sent
