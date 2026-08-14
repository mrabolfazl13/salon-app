from fastapi import WebSocket
from typing import Dict, List, Optional, Tuple

class ConnectionManager:
    def __init__(self):
        # هر اتصال WebSocket به همراه user_id ذخیره می‌شود
        self.active_connections: Dict[str, List[Tuple[WebSocket, Optional[int]]]] = {
            "users": [],
            "managers": [],
            "admins": []
        }
    
    async def connect(self, websocket: WebSocket, role: str, user_id: Optional[int] = None):
        await websocket.accept()
        if role in self.active_connections:
            self.active_connections[role].append((websocket, user_id))
    
    def disconnect(self, websocket: WebSocket, role: str):
        if role in self.active_connections:
            self.active_connections[role] = [
                (ws, uid) for ws, uid in self.active_connections[role]
                if ws != websocket
            ]
    
    async def broadcast_to_role(self, role: str, message: dict):
        if role not in self.active_connections:
            return
        for connection, _ in self.active_connections[role]:
            try:
                await connection.send_json(message)
            except:
                pass
    
    async def broadcast_to_all(self, message: dict):
        for role in self.active_connections:
            await self.broadcast_to_role(role, message)
    
    async def send_to_user(self, user_id: int, message: dict):
        """فقط به کاربر مشخص‌شده پیام می‌فرستد، نه همه کاربران"""
        if user_id is None:
            return
        for role in self.active_connections:
            for connection, uid in self.active_connections[role]:
                if uid is not None and uid == user_id:
                    try:
                        await connection.send_json(message)
                    except:
                        pass

manager = ConnectionManager()
