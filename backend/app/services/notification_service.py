import json
from typing import Optional

from sqlmodel import Session, select

from app.database import engine
from app.models.notification import Notification
from app.models.user import User, UserRole
from app.utils.websocket import manager


class NotificationService:

    def __init__(self):
        self.sms_enabled = False

    # ─────────────────────────── ذخیره‌سازی در دیتابیس ───────────────────────────

    def _persist(self, user_id: int, title: str, message: str,
                 notif_type: str, data: Optional[dict] = None) -> Optional[int]:
        """ذخیره اعلان در دیتابیس؛ شناسه اعلان را برمی‌گرداند"""
        try:
            with Session(engine) as session:
                notif = Notification(
                    user_id=user_id,
                    title=title,
                    message=message,
                    type=notif_type,
                    data=json.dumps(data or {}, ensure_ascii=False),
                )
                session.add(notif)
                session.commit()
                session.refresh(notif)
                return notif.id
        except Exception as e:
            print(f"[NotificationService] persist failed: {e}")
            return None

    def _user_ids_by_role(self, role: UserRole) -> list:
        try:
            with Session(engine) as session:
                stmt = select(User.id).where(User.role == role, User.is_active == True)  # noqa: E712
                return list(session.exec(stmt).all())
        except Exception as e:
            print(f"[NotificationService] role query failed: {e}")
            return []

    # ─────────────────────────── ارسال ───────────────────────────

    async def send_to_user(self, user_id: int, title: str, message: str,
                           data: dict = None, notif_type: str = "info"):
        # ۱. ذخیره در DB (حتی اگر کاربر آنلاین نباشد از دست نمی‌رود)
        notif_id = self._persist(user_id, title, message, notif_type, data)

        # ۲. ارسال بلادرنگ عبر WebSocket
        notification = {
            "id": notif_id,
            "type": "user_notification",
            "notif_type": notif_type,
            "title": title,
            "message": message,
            "data": data or {},
        }
        await manager.send_to_user(user_id, notification)

    async def send_to_managers(self, title: str, message: str,
                               data: dict = None, notif_type: str = "manager"):
        for uid in self._user_ids_by_role(UserRole.VENUE_MANAGER):
            self._persist(uid, title, message, notif_type, data)

        notification = {
            "type": "manager_notification",
            "notif_type": notif_type,
            "title": title,
            "message": message,
            "data": data or {},
        }
        await manager.broadcast_to_role("managers", notification)

    async def send_to_admins(self, title: str, message: str,
                             data: dict = None, notif_type: str = "admin"):
        for uid in self._user_ids_by_role(UserRole.SUPER_ADMIN):
            self._persist(uid, title, message, notif_type, data)

        notification = {
            "type": "admin_notification",
            "notif_type": notif_type,
            "title": title,
            "message": message,
            "data": data or {},
        }
        await manager.broadcast_to_role("admins", notification)

    async def notify_manager_room(self, manager_id: Optional[int], title: str, message: str,
                                  data: dict = None, notif_type: str = "manager"):
        """اعلان مدیرِ مسئول — کانال شخصی مدیر (الگوی notify_new_pending_booking).

        broadcast به کل اتاق managers فقط برای رویدادهای عمومی (رقابت/سیستم)
        است؛ درخواست‌های قرارداد به مدیر همان سالن می‌رسد — روی کانال شخصیِ
        مدیرِ متصل، پیام در همین اتاق (managers) هم دیده می‌شود.
        بدون manager_id مشخص هیچ اعلانی داده نمی‌شود (نه query سراسری).
        """
        if not manager_id:
            return
        await self.send_to_user(manager_id, title, message, data, notif_type=notif_type)

# ─────────────────────────── اعلان‌های دامنه ───────────────────────────

    async def notify_new_pending_booking(self, user_id: int, booking_details: dict):
        await self.send_to_user(user_id, "⏳ رزرو جدید در انتظار تأیید",
            f"یک رزرو جدید برای سالن {booking_details.get('venue_name')} در تاریخ {booking_details.get('date')} ساعت {booking_details.get('time')} ثبت شده و نیاز به تأیید شما دارد.",
            booking_details, notif_type="new_booking")

    async def notify_booking_confirmed(self, user_id: int, booking_details: dict):
        await self.send_to_user(user_id, "✅ رزرو شما تایید شد",
            f"رزرو سالن {booking_details.get('venue_name')} برای تاریخ {booking_details.get('date')} ساعت {booking_details.get('time')} با موفقیت ثبت شد.",
            booking_details, notif_type="booking_confirmed")

    async def notify_booking_cancelled(self, user_id: int, booking_details: dict):
        await self.send_to_user(user_id, "❌ لغو رزرو",
            f"رزرو شما در تاریخ {booking_details.get('date')} لغو شد.",
            booking_details, notif_type="booking_cancelled")

    async def notify_booking_rejected(self, user_id: int, booking_details: dict):
        await self.send_to_user(user_id, "❌ رزرو شما تأیید نشد",
            f"رزرو شما برای سالن {booking_details.get('venue_name')} توسط مدیر سالن رد شد و سانس آزاد گردید.",
            booking_details, notif_type="booking_rejected")

    async def notify_new_competition(self, slot_details: dict):
        await self.send_to_managers("🏆 رقابت قیمت جدید",
            f"رقابت قیمت برای سانس {slot_details.get('date')} ساعت {slot_details.get('time')} در سالن {slot_details.get('venue_name')} آغاز شد.",
            slot_details, notif_type="competition")

    async def notify_contract_created(self, user_id: int, contract_details: dict):
        await self.send_to_user(user_id, "📄 قرارداد جدید ثبت شد",
            f"قرارداد شما برای سالن {contract_details.get('venue_name')} با موفقیت ثبت شد و در انتظار تأیید مدیر است.",
            contract_details, notif_type="contract")

    async def notify_contract_pending_review(self, manager_id: Optional[int], contract_details: dict):
        await self.notify_manager_room(
            manager_id, "📄 درخواست قرارداد جدید",
            f"درخواست قرارداد جدید برای سالن {contract_details.get('venue_name')} ثبت شد؛ برای بررسی به پنل مدیریتی مراجعه کنید.",
            contract_details, notif_type="contract_pending")

    async def notify_contract_approved(self, user_id: int, contract_details: dict):
        await self.send_to_user(user_id, "✅ قرارداد شما تأیید شد",
            f"قرارداد سالن {contract_details.get('venue_name')} تأیید و فعال شد. جزئیات پرداخت در پرونده قرارداد قابل مشاهده است.",
            contract_details, notif_type="contract_approved")

    async def notify_contract_rejected(self, user_id: int, contract_details: dict):
        await self.send_to_user(user_id, "❌ قرارداد رد شد",
            f"متأسفانه درخواست قرارداد شما برای سالن {contract_details.get('venue_name')} رد شد. دلیل: {contract_details.get('reason', 'بدون ذکر دلیل')}",
            contract_details, notif_type="contract_rejected")

    async def notify_contract_cancelled(self, user_id: int, contract_details: dict):
        await self.send_to_user(user_id, "🚫 قرارداد لغو شد",
            f"قرارداد سالن {contract_details.get('venue_name')} لغو شد و سانس‌های آینده آزاد گردیدند.",
            contract_details, notif_type="contract_cancelled")

    async def notify_contract_renewal_objection(self, manager_id: Optional[int], contract_details: dict):
        await self.notify_manager_room(
            manager_id, "🔁 درخواست تمدید قرارداد",
            f"قرارداد {contract_details.get('contract_id')} در آستانه تمدید خودکار است؛ کاربر اعتراض ثبت کرده است.",
            contract_details, notif_type="contract_renewal")

    async def notify_contract_session_change(self, user_id: int, session_details: dict):
        await self.send_to_user(user_id, session_details.get("title", "تغییر سانس قرارداد"),
            session_details.get("message", ""), session_details, notif_type="contract_session")

    async def notify_contract_session_cancel_request(self, manager_id: Optional[int], request_details: dict):
        await self.notify_manager_room(
            manager_id, "⏹ درخواست لغو سانس قرارداد",
            f"کاربر لغو سانس {request_details.get('session_date')} قرارداد #{request_details.get('contract_id')} را درخواست کرد.",
            request_details, notif_type="contract_session_request")

    async def notify_contract_overdue(self, user_id: int, overdue_details: dict):
        await self.send_to_user(user_id, "⚠️ قسط قرارداد معوق شد",
            overdue_details.get("message", f"قسط قرارداد #{overdue_details.get('contract_id')} سررسید را رد کرده است."),
            overdue_details, notif_type="contract_overdue")

    async def notify_contract_overdue_manager(self, manager_id: Optional[int], overdue_details: dict):
        await self.notify_manager_room(
            manager_id, "⚠️ قسط معوق قرارداد",
            overdue_details.get("message", f"قرارداد #{overdue_details.get('contract_id')} قسط معوق دارد."),
            overdue_details, notif_type="contract_overdue")

    async def notify_contract_payment(self, user_id: int, payment_details: dict):
        await self.send_to_user(user_id, "💳 پرداخت قسط قرارداد",
            payment_details.get("message", "پرداخت قسط قرارداد ثبت شد."),
            payment_details, notif_type="contract_payment")


notification_service = NotificationService()