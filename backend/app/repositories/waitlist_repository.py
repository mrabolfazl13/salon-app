# backend/app/repositories/waitlist_repository.py
"""ریپازیتوری صف انتظار سانس (waitlist_entries).

دو خواندهٔ پرتکرار: نفرِ اول صفِ یک سانس (برای اعلان/تبدیل) و کاندیدهای
پنجرهٔ ۲ ساعتهٔ تمام‌شده. مبنای ترتیب همیشه position است، نه created_at.
"""
from datetime import datetime
from typing import List, Optional

from sqlmodel import Session, col, select

from app.models.waitlist import WaitlistEntry
from app.repositories.base import BaseRepository

ACTIVE = ("pending", "notified")


class WaitlistRepository(BaseRepository[WaitlistEntry]):

    def __init__(self, session: Session):
        super().__init__(WaitlistEntry, session)

    def head_of_queue(self, slot_id: int) -> Optional[WaitlistEntry]:
        stmt = (
            select(WaitlistEntry)
            .where(col(WaitlistEntry.slot_id) == slot_id,
                   col(WaitlistEntry.status).in_(ACTIVE))
            .order_by(col(WaitlistEntry.position), col(WaitlistEntry.id))
        )
        return self.session.exec(stmt).first()

    def queue(self, slot_id: int) -> List[WaitlistEntry]:
        stmt = (
            select(WaitlistEntry)
            .where(col(WaitlistEntry.slot_id) == slot_id,
                   col(WaitlistEntry.status).in_(ACTIVE))
            .order_by(col(WaitlistEntry.position), col(WaitlistEntry.id))
        )
        return self.session.exec(stmt).all()

    def expired_heads(self, now: datetime) -> List[WaitlistEntry]:
        """نفر اول هر سانس که به او اعلان شده و پنجره‌اش تمام شده است.

        یک سانس حداکثر یک کاندید دارد: نفرهای بعدی هنوز نوبتشان نشده و
        باید منتظر اعلانِ لغوِ رزروِ نفر بعدی بمانند.
        """
        stmt = (
            select(WaitlistEntry)
            .where(col(WaitlistEntry.status) == "notified",
                   col(WaitlistEntry.expires_at).is_not(None),
                   col(WaitlistEntry.expires_at) <= now)
            .order_by(col(WaitlistEntry.slot_id), col(WaitlistEntry.position))
        )
        heads: List[WaitlistEntry] = []
        seen = set()
        for row in self.session.exec(stmt).all():
            if row.slot_id in seen:
                continue
            seen.add(row.slot_id)
            heads.append(row)
        return heads
