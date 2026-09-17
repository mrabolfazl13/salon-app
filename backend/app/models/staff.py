# backend/app/models/staff.py
"""کارکنان سالن (RBAC موج W7) + ممیزی امنیتی سراسری — brief §10.

- StaffAssignment: کاربر ثبت‌نام‌شده‌ی عادی (role unchanged) که به یک سالن با
  موقعیت و کدهای دسترسی تخصیص می‌یابد. permissions رشته‌ی JSON (لیست کدها)؛
  خالی = پیش‌فرض موقعیت (امکان سفارشی‌سازی بعدی بدون مهاجرت).
- unique(venue_id, user_id): حداکثر یک ردیف per user+venue؛ حذف = is_active=False
  و انتصاب مجدد همان ردیف را «زنده» می‌کند ⇒ همیشه ≤۱ ردیف فعال.
- SecurityAuditEvent: جدول سراسری رویدادهای حساس (الگوی contract/team audits؛
  ستون JSON رشته‌ای به احترام سایر ممیزی‌ها `data` نام دارد — «metadata» در
  SQLModel/SQLAlchemy رزرو است).
"""
from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint
from typing import Optional
from datetime import datetime, timezone
from enum import Enum

from app.utils.permissions import StaffPosition, permissions_for_position  # noqa: F401


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class StaffAssignment(SQLModel, table=True):
    __tablename__ = "staff_assignments"
    __table_args__ = (
        UniqueConstraint("venue_id", "user_id", name="uq_staff_active_user_venue"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    venue_id: int = Field(foreign_key="venues.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    position: StaffPosition = Field(index=True)
    permissions: str = Field(default="[]", max_length=2000,
                             description="JSON list کدهای دسترسی؛ خالی = پیش‌فرض موقعیت")
    is_active: bool = Field(default=True, index=True)
    created_by: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    removed_at: Optional[datetime] = None

    def permission_codes(self) -> list:
        """کدهای مؤثر: لیست ذخیره‌شده یا پیش‌فرض موقعیت اگر سفارشی نباشد."""
        import json
        raw = self.permissions or "[]"
        try:
            codes = json.loads(raw)
        except ValueError:
            codes = []
        codes = [c for c in codes if isinstance(c, str)]
        return codes if codes else sorted(permissions_for_position(self.position))

    def is_custom_permissions(self) -> bool:
        import json
        try:
            return bool(json.loads(self.permissions or "[]"))
        except ValueError:
            return False


class SecurityAuditEvent(SQLModel, table=True):
    """رویداد امنیتی سراسری — write-in-uow برای تغییر وضعیت؛ best-effort برای ۴۰۳."""
    __tablename__ = "security_audit_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    actor_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    action: str = Field(max_length=60, index=True,
                        description="کد اکشن مانند staff.created / permission.denied")
    target_type: Optional[str] = Field(default=None, max_length=40)
    target_id: Optional[int] = Field(default=None)
    venue_id: Optional[int] = Field(default=None, foreign_key="venues.id", index=True)
    data: str = Field(default="{}", max_length=4000, description="JSON رشته‌ای (metadata)")
    ip: Optional[str] = Field(default=None, max_length=45)
    created_at: datetime = Field(default_factory=_utcnow, index=True)