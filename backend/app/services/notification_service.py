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
            f"قرارداد شما برای سالن {contract_details.get('venue_name')} با موفقیت ثبت شد.",
            contract_details, notif_type="contract")


notification_service = NotificationService()
