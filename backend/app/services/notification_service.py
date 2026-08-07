from app.utils.websocket import manager

class NotificationService:
    
    def __init__(self):
        self.sms_enabled = False
    
    async def send_to_user(self, user_id: int, title: str, message: str, data: dict = None):
        notification = {
            "type": "user_notification",
            "title": title,
            "message": message,
            "data": data or {},
        }
        await manager.send_to_user(user_id, notification)
    
    async def send_to_managers(self, title: str, message: str, data: dict = None):
        notification = {
            "type": "manager_notification",
            "title": title,
            "message": message,
            "data": data or {},
        }
        await manager.broadcast_to_role("managers", notification)
    
    async def send_to_admins(self, title: str, message: str, data: dict = None):
        notification = {
            "type": "admin_notification",
            "title": title,
            "message": message,
            "data": data or {},
        }
        await manager.broadcast_to_role("admins", notification)
    
    async def notify_booking_confirmed(self, user_id: int, booking_details: dict):
        await self.send_to_user(user_id, "✅ رزرو شما تایید شد", 
            f"رزرو سالن {booking_details.get('venue_name')} برای تاریخ {booking_details.get('date')} ساعت {booking_details.get('time')} با موفقیت ثبت شد.",
            booking_details)
    
    async def notify_booking_cancelled(self, user_id: int, booking_details: dict):
        await self.send_to_user(user_id, "❌ لغو رزرو",
            f"رزرو شما در تاریخ {booking_details.get('date')} لغو شد.",
            booking_details)
    
    async def notify_new_competition(self, slot_details: dict):
        await self.send_to_managers("🏆 رقابت قیمت جدید",
            f"رقابت قیمت برای سانس {slot_details.get('date')} ساعت {slot_details.get('time')} در سالن {slot_details.get('venue_name')} آغاز شد.",
            slot_details)
    
    async def notify_contract_created(self, user_id: int, contract_details: dict):
        await self.send_to_user(user_id, "📄 قرارداد جدید ثبت شد",
            f"قرارداد شما برای سالن {contract_details.get('venue_name')} با موفقیت ثبت شد.",
            contract_details)

notification_service = NotificationService()
