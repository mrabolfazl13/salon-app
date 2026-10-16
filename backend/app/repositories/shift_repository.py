# backend/app/repositories/shift_repository.py
from datetime import datetime
from typing import List, Optional

from sqlmodel import Session, col, select

from app.models.staff_shift import StaffShift, ShiftStatus
from app.repositories.base import BaseRepository

# لغوشده نه در تضاد شمرده می‌شود نه در ساعت کاری (الگوی coach_repository)
_NOT_CANCELLED = (ShiftStatus.SCHEDULED, ShiftStatus.DONE)


class StaffShiftRepository(BaseRepository[StaffShift]):

    def __init__(self, session: Session):
        super().__init__(StaffShift, session)

    def overlapping(self, user_id: int, starts_at: datetime, ends_at: datetime,
                    exclude_id: Optional[int] = None) -> List[StaffShift]:
        """شیفت‌های غیرلغوشدهٔ **همان شخص در همهٔ سالن‌ها** با هم‌پوشانی بازه.

        سراسری بودن (بدون فیلتر venue_id) عمدی است: تضاد به‌خوردن شخص در دو جا
        در یک لحظه، نه دوبه‌کاری در یک سالن.
        """
        stmt = select(StaffShift).where(
            StaffShift.user_id == user_id,
            StaffShift.status.in_(_NOT_CANCELLED),
            StaffShift.starts_at < ends_at,
            StaffShift.ends_at > starts_at,
        )
        if exclude_id is not None:
            stmt = stmt.where(StaffShift.id != exclude_id)
        return list(self.session.exec(stmt.order_by(col(StaffShift.starts_at))).all())

    def in_window(self, venue_id: int, date_from: Optional[datetime] = None,
                  date_to: Optional[datetime] = None,
                  status: Optional[ShiftStatus] = None,
                  user_id: Optional[int] = None) -> List[StaffShift]:
        """شیفت‌هایی که بازه‌شان به پنجرهٔ خواسته‌شده می‌خورد (overlap، نه فقط شروع)."""
        conds = [StaffShift.venue_id == venue_id]
        if date_from is not None:
            conds.append(StaffShift.ends_at > date_from)
        if date_to is not None:
            conds.append(StaffShift.starts_at < date_to)
        if status is not None:
            conds.append(StaffShift.status == status)
        if user_id is not None:
            conds.append(StaffShift.user_id == user_id)
        stmt = (select(StaffShift).where(*conds)
                .order_by(col(StaffShift.starts_at), col(StaffShift.id)))
        return list(self.session.exec(stmt).all())
