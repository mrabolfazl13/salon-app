from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    type: str
    is_read: bool
    created_at: datetime


class UnreadCountResponse(BaseModel):
    count: int
