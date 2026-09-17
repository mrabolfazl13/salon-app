# backend/app/repositories/holiday_repository.py
"""ریپازیتوری تقویم مناسبت‌ها — کوئری تعطیلیِ (سراسری یا سالن‌محور) یک تاریخ."""
from sqlmodel import Session, select, or_
from datetime import date
from typing import List, Optional

from app.models.holiday import Holiday
from app.repositories.base import BaseRepository


class HolidayRepository(BaseRepository[Holiday]):

    def __init__(self, session: Session):
        super().__init__(Holiday, session)

    def get_on_date(self, when: date, venue_id: Optional[int] = None) -> List[Holiday]:
        """تعطیل‌های یک تاریخ — سراسری (venue_id=null) + سالن مشخص."""
        # venue_id=None ⇒ فقط سراسری؛ سالن ⇒ سراسری + همان سالن.
        # ردیف‌های سالن‌های دیگر هیچ‌وقت روی تاریخ مبهم شمار نمی‌آیند.
        stmt = select(Holiday).where(Holiday.holiday_date == when)
        if venue_id is None:
            stmt = stmt.where(Holiday.venue_id == None)  # noqa: E711
        else:
            stmt = stmt.where(or_(Holiday.venue_id == None,
                                  Holiday.venue_id == venue_id))  # noqa: E711
        return self.session.exec(stmt).all()

    def is_holiday(self, when: date, venue_id: Optional[int] = None) -> bool:
        return len(self.get_on_date(when, venue_id)) > 0

    def list_range(self, start: date, end: date,
                   venue_ids: Optional[List[int]] = None,
                   include_global: bool = True) -> List[Holiday]:
        stmt = select(Holiday).where(Holiday.holiday_date >= start,
                                      Holiday.holiday_date <= end)
        if venue_ids is not None:
            conds = [Holiday.venue_id.in_(venue_ids)]
            if include_global:
                conds.append(Holiday.venue_id == None)  # noqa: E711
            stmt = stmt.where(or_(*conds))
        return self.session.exec(stmt.order_by(Holiday.holiday_date)).all()

    def exists_on(self, when: date, venue_id: Optional[int]) -> bool:
        stmt = select(Holiday).where(Holiday.holiday_date == when,
                                     Holiday.venue_id == venue_id)
        return self.session.exec(stmt).first() is not None

    def bulk_add(self, items: List[dict]) -> List[Holiday]:
        """Seed helper — افزودن دسته‌ای {date,name,...}؛ تاریخ‌های تکراری رد می‌شوند
        (یکتایی holiday_date روی کل تقویم برقرار می‌ماند)."""
        created = []
        for item in items:
            when = item["date"] if "date" in item else item["holiday_date"]
            venue_id = item.get("venue_id")
            if self.get_one(holiday_date=when):
                continue
            created.append(self.create({
                "holiday_date": when,
                "name": item.get("name", "مناسبت"),
                "is_national": item.get("is_national", venue_id is None),
                "venue_id": venue_id,
            }))
        return created