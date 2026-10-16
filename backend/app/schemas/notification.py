from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, Any, Dict
from datetime import datetime
import json


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    type: str
    is_read: bool
    created_at: datetime

    @field_validator("data", mode="before")
    @classmethod
    def _decode_data(cls, value: Any) -> Any:
        """ستون data رشتهٔ JSON در دیتابیس است؛ در پاسخ باید شیء باشد."""
        if isinstance(value, str):
            try:
                return json.loads(value)
            except ValueError:
                return {}
        return value


class UnreadCountResponse(BaseModel):
    count: int
