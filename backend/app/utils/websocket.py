# backend/app/utils/websocket.py
"""مدیر اتصالات بلادرنگ WebSocket

هر اتصال با شناسه‌ی کاربری که از طریق JWT احراز هویت شده ثبت می‌شود
(نه ادعای کلاینت در URL)؛ در نتیجه send_to_user فقط به کانال‌های
کاربر تأییدشده پیام می‌رساند.
"""
from fastapi import WebSocket
from typing import Dict, List, Optional, Set, Tuple


class ConnectionManager:
    def __init__(self):
        # اتاق‌های نقش‌محور + کانال شخصی کاربران
        # هر عضو: (websocket, user_id_تأییدشده)
        self.active_connections: Dict[str, List[Tuple[WebSocket, Optional[int]]]] = {
            "users": [],
            "managers": [],
            "admins": []
        }

    async def connect(self, websocket: WebSocket, room: str, user_id: Optional[int] = None):
        await websocket.accept()
        self.active_connections.setdefault(room, []).append((websocket, user_id))

    def disconnect(self, websocket: WebSocket, room: str):
        if room in self.active_connections:
            self.active_connections[room] = [
                (ws, uid) for ws, uid in self.active_connections[room]
                if ws is not websocket
            ]

    async def broadcast_to_role(self, role: str, message: dict):
        if role not in self.active_connections:
            return
        for connection, _ in list(self.active_connections[role]):
            try:
                await connection.send_json(message)
            except Exception:  # noqa: BLE001 — اتصال مرده حذف می‌شود
                self.disconnect(connection, role)

    async def broadcast_to_all(self, message: dict):
        for role in list(self.active_connections.keys()):
            await self.broadcast_to_role(role, message)

    async def send_to_user(self, user_id: int, message: dict):
        """فقط به کانال‌های کاربر مشخص‌شده (کلید = شناسه‌ی تأییدشده) پیام می‌فرستد

        اگر یک کاربر هم‌زمان در چند اتاق (مثلاً کانال شخصی + اتاق مدیران)
        متصل باشد، هر اتصال حداکثر یک نسخه دریافت می‌کند.
        """
        if user_id is None:
            return
        seen: Set[int] = set()
        for room in list(self.active_connections.keys()):
            for connection, uid in list(self.active_connections[room]):
                if uid is not None and uid == user_id and id(connection) not in seen:
                    seen.add(id(connection))
                    try:
                        await connection.send_json(message)
                    except Exception:  # noqa: BLE001
                        self.disconnect(connection, room)


manager = ConnectionManager()
