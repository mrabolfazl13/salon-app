# backend/app/utils/websocket.py
"""مدیر اتصالات بلادرنگ WebSocket با Redis pub/sub

هر اتصال با شناسه‌ی کاربری که از طریق JWT احراز هویت شده ثبت می‌شود
(نه ادعای کلاینت در URL)؛ در نتیجه send_to_user فقط به کانال‌های
کاربر تأییدشده پیام می‌رساند.

پیاده‌سازی جدید: به جای نگهداری اتصالات در حافظه‌ی یک worker،
از Redis pub/sub استفاده می‌کند تا چندین worker uvicorn/gunicorn
بتوانند پیام‌ها را دریافت و توزیع کنند (مقیاس‌پذیری افقی).
"""
import json
import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set, Optional
import redis.asyncio as redis
from app.config import settings


class ConnectionManager:
    def __init__(self):
        # نگاشت user_id → set of websocket برای ارسال مستقیم
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # کلاینت Redis برای pub/sub
        self.redis_client: Optional[redis.Redis] = None
        self.pubsub = None
        self._listen_task = None
        
    async def connect_redis(self):
        """اتصال به Redis برای pub/sub."""
        if self.redis_client is None:
            self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        
    async def disconnect_redis(self):
        """قطع اتصال Redis."""
        if self.pubsub:
            await self.pubsub.unsubscribe()
            await self.pubsub.close()
        if self._listen_task:
            self._listen_task.cancel()
        if self.redis_client:
            await self.redis_client.close()
            
    async def start_listening(self):
        """شروع گوش‌دادن به کانال‌های Redis.

        اگر Redis در دسترس نباشد، سرور باید بالا بیاید و pub/sub غیرفعال بماند
        (مثل rate-limit که fail-open است)؛ در غیر این صورت یک وابستگی جانبی
        کل API را از کار می‌اندازد.
        """
        await self.connect_redis()
        try:
            self.pubsub = self.redis_client.pubsub()
            await self.pubsub.subscribe("websocket:users", "websocket:managers", "websocket:admins")
        except Exception as e:
            print(f"Redis unavailable - WebSocket pub/sub disabled ({e})")
            self.pubsub = None
            self.redis_client = None
            return

        # تسک پس‌زمینه برای دریافت پیام‌ها
        self._listen_task = asyncio.create_task(self._listen_for_messages())

    async def _publish(self, channel: str, payload: dict):
        """انتشار امن؛ نبود/قطع Redis نباید مسیر درخواست را بشکند."""
        if not self.redis_client:
            return
        try:
            await self.redis_client.publish(channel, json.dumps(payload))
        except Exception as e:
            print(f"Redis publish failed ({channel}): {e}")
        
    async def _listen_for_messages(self):
        """دریافت پیام‌های pub/sub و ارسال به کاربران متصل."""
        try:
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    target_type = data.get("target_type")  # user_id یا role
                    payload = data.get("payload")
                    
                    if isinstance(target_type, int):
                        # ارسال به کاربر خاص
                        await self._send_to_connected_user(target_type, payload)
                    elif target_type in ["managers", "admins"]:
                        # ارسال به اتاق نقش‌محور
                        await self._broadcast_to_role(target_type, payload)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Redis listen error: {e}")
    
    async def _send_to_connected_user(self, user_id: int, payload: dict):
        """ارسال پیام به تمام وب‌سوکت‌های متصل یک کاربر."""
        if user_id in self.active_connections:
            disconnected = []
            for ws in list(self.active_connections[user_id]):
                try:
                    await ws.send_json(payload)
                except Exception:
                    disconnected.append(ws)
            # حذف اتصالات مرده
            for ws in disconnected:
                self.active_connections[user_id].discard(ws)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def _broadcast_to_role(self, role: str, payload: dict):
        """ارسال پیام به تمام کاربران متصل در یک نقش."""
        all_users = set()
        for user_id, connections in self.active_connections.items():
            if connections:
                all_users.add(user_id)
        
        # در پیاده‌سازی ساده، به همه ارسال می‌کنیم
        # در پیاده‌سازی کامل باید نقش هر کاربر را چک کنیم
        for user_id in all_users:
            await self._send_to_connected_user(user_id, payload)

    async def connect(self, websocket: WebSocket, room: str, user_id: Optional[int] = None):
        """ثبت اتصال وب‌سوکت جدید."""
        await websocket.accept()
        if user_id:
            self.active_connections.setdefault(user_id, set()).add(websocket)
            
            # اطلاع‌رسانی به Redis که این کاربر آنلاین است
            if self.redis_client:
                await self._publish(
                    f"websocket:user:{user_id}",
                    {"event": "connected", "room": room}
                )

    def disconnect(self, websocket: WebSocket, user_id: Optional[int] = None):
        """حذف اتصال وب‌سوکت."""
        if user_id and user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def broadcast_to_role(self, role: str, message: dict):
        """ارسال پیام به تمام کاربران یک نقش از طریق Redis."""
        if self.redis_client:
            await self._publish(
                f"websocket:{role}",
                {
                    "target_type": role,
                    "payload": message
                }
            )

    async def broadcast_to_all(self, message: dict):
        """ارسال پیام به تمام کاربران از طریق Redis."""
        if self.redis_client:
            await self._publish(
                "websocket:all",
                {
                    "target_type": "all",
                    "payload": message
                }
            )

    async def send_to_user(self, user_id: int, message: dict):
        """ارسال پیام به کاربر خاص از طریق Redis pub/sub.
        
        اگر کاربر به همین worker متصل باشد، مستقیم ارسال می‌شود.
        در غیر این صورت، Redis پیام را به worker درست می‌رساند.
        """
        if user_id is None:
            return
            
        # اول سعی کن مستقیم بفرست (اگر به همین worker متصل است)
        if user_id in self.active_connections:
            disconnected = []
            for ws in list(self.active_connections[user_id]):
                try:
                    await ws.send_json(message)
                except Exception:
                    disconnected.append(ws)
            for ws in disconnected:
                self.active_connections[user_id].discard(ws)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            return
        
        # اگر کاربر به این worker نیست، از Redis pub/sub استفاده کن
        if self.redis_client:
            await self._publish(
                "websocket:users",
                {
                    "target_type": user_id,
                    "payload": message
                }
            )


manager = ConnectionManager()
