from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {
            "users": [],
            "managers": [],
            "admins": []
        }
    
    async def connect(self, websocket: WebSocket, role: str):
        await websocket.accept()
        if role in self.active_connections:
            self.active_connections[role].append(websocket)
    
    def disconnect(self, websocket: WebSocket, role: str):
        if role in self.active_connections and websocket in self.active_connections[role]:
            self.active_connections[role].remove(websocket)
    
    async def broadcast_to_role(self, role: str, message: dict):
        if role not in self.active_connections:
            return
        for connection in self.active_connections[role]:
            try:
                await connection.send_json(message)
            except:
                pass
    
    async def broadcast_to_all(self, message: dict):
        for role in self.active_connections:
            await self.broadcast_to_role(role, message)
    
    async def send_to_user(self, user_id: int, message: dict):
        await self.broadcast_to_role("users", message)

manager = ConnectionManager()
