# backend/app/repositories/slot_repository.py
from sqlmodel import Session, select, and_, or_, func
from sqlalchemy import case
from datetime import date, time, datetime, timedelta
from typing import Optional, List, Tuple
from app.models.slot import Slot, SlotStatus
from app.repositories.base import BaseRepository
from app.utils.time_guard import is_past_slot

class SlotRepository(BaseRepository[Slot]):
    
    def __init__(self, session: Session):
        super().__init__(Slot, session)
    
    def get_by_id_with_lock(self, slot_id: int) -> Optional[Slot]:
        """گرفتن سانس با قفل دیتابیسی برای جلوگیری از race condition"""
        statement = select(Slot).where(Slot.id == slot_id).with_for_update()
        return self.session.exec(statement).first()

    def get_by_ids(self, ids: List[int]) -> List[Slot]:
        """گرفتن چند سانس به‌صورت یکجا (جلوگیری از N+1)"""
        if not ids:
            return []
        statement = select(Slot).where(Slot.id.in_(ids))
        return self.session.exec(statement).all()

    def get_by_venue_and_date(self, venue_id: int, slot_date: date) -> List[Slot]:
        """گرفتن سانس‌های یک سالن در تاریخ مشخص"""
        return self.get_all(venue_id=venue_id, slot_date=slot_date)
    
    def get_by_venue_and_date_range(self, venue_id: int, start_date: str, end_date: str) -> List[Slot]:
        """گرفتن سانس‌های یک سالن در بازه زمانی"""
        statement = select(Slot).where(
            Slot.venue_id == venue_id,
            Slot.slot_date >= start_date,
            Slot.slot_date <= end_date
        ).order_by(Slot.slot_date, Slot.start_time)
        return self.session.exec(statement).all()
    
    def get_available_slots(self, venue_id: int, slot_date: date) -> List[Slot]:
        """گرفتن سانس‌های آزاد یک سالن"""
        return self.get_all(
            venue_id=venue_id,
            slot_date=slot_date,
            status=SlotStatus.AVAILABLE
        )
    
    def get_slots_in_competition(self) -> List[Slot]:
        """گرفتن سانس‌هایی که در رقابت هستند"""
        return self.get_all(is_competition_enabled=True)
    
    def get_booked_slots(self, venue_id: int, start_date: date, end_date: date) -> List[Slot]:
        """گرفتن سانس‌های رزرو شده"""
        statement = select(Slot).where(
            Slot.venue_id == venue_id,
            Slot.slot_date >= start_date,
            Slot.slot_date <= end_date,
            Slot.status == SlotStatus.BOOKED
        )
        return self.session.exec(statement).all()
    
    def get_contract_slots(self, contract_id: int) -> List[Slot]:
        """گرفتن سانس‌های مربوط به یک قرارداد"""
        statement = select(Slot).where(Slot.contract_id == contract_id)
        return self.session.exec(statement).all()
    
    def is_slot_available(self, venue_id: int, slot_date: date, start_time: time) -> bool:
        """بررسی موجود بودن یک سانس مشخص"""
        existing = self.get_one(
            venue_id=venue_id,
            slot_date=slot_date,
            start_time=start_time
        )
        if not existing:
            return True
        return existing.status == SlotStatus.AVAILABLE
    def check_slot_conflict(self, venue_id: int, slot_date: date, start_time: time, duration: int = 90, exclude_slot_id: Optional[int] = None) -> Optional[Slot]:
        """بررسی تداخل زمانی با سانس‌های دیگر (بر اساس مدت واقعی هر سانس).

        exclude_slot_id: در جابه‌جایی سانس قرارداد (reschedule) سانسِ خودش
        نباید با خودش تداخل شمرده شود.
        """
        new_start = datetime.combine(slot_date, start_time)
        new_end = new_start + timedelta(minutes=duration)

        existing = self.get_all(venue_id=venue_id, slot_date=slot_date, limit=1000)
        for slot in existing:
            if exclude_slot_id is not None and slot.id == exclude_slot_id:
                continue
            if slot.status == SlotStatus.BLOCKED:
                continue
            s_start = datetime.combine(slot_date, slot.start_time)
            s_end = s_start + timedelta(minutes=slot.duration or duration)
            # تداخل زمانی: شروع هرکدام قبل از پایان دیگری باشد
            if s_start < new_end and s_end > new_start:
                return slot
        return None

    def release_contract_slot(self, slot_id: int) -> Optional[Slot]:
        """آزادسازی سانس قرارداد از ید قرارداد (رد/لغو/استثنای سانس).

        نوشتن مستقیم attribute چون BaseRepository.update مقدار None را
        نادیده می‌گیرد و باید contract_id هم null شود.
        """
        slot = self.get_by_id(slot_id)
        if not slot:
            return None
        slot.status = SlotStatus.AVAILABLE
        slot.is_contract_slot = False
        slot.contract_id = None
        self.session.add(slot)
        self.session.flush()
        return slot

    def relocate_contract_slot(self, slot_id: int, new_date: date, new_time: time) -> Optional[Slot]:
        """جابه‌جایی فیزیکی سانس قرارداد (reschedule / move_whole)."""
        slot = self.get_by_id(slot_id)
        if not slot:
            return None
        slot.slot_date = new_date
        slot.start_time = new_time
        self.session.add(slot)
        self.session.flush()
        return slot

    def block_slot(self, slot_id: int, reason: str = None) -> Optional[Slot]:
        """مسدود کردن سانس (برای تعمیرات و غیره)"""
        return self.update(slot_id, {
            "status": SlotStatus.BLOCKED,
            "blocked_reason": reason
        })
    
    def release_slot(self, slot_id: int) -> Optional[Slot]:
        """آزاد کردن سانس"""
        return self.update(slot_id, {"status": SlotStatus.AVAILABLE})
    
    def update_price(self, slot_id: int, new_price: int) -> Optional[Slot]:
        """به‌روزرسانی قیمت سانس — سانس‌های گذشته تغییر قیمت نمی‌گیرند"""
        slot = self.get_by_id(slot_id)
        if slot is None:
            return None
        if is_past_slot(slot.slot_date, slot.start_time):
            return None
        return self.update(slot_id, {"current_price": new_price})
    
    def enable_competition(self, slot_id: int) -> Optional[Slot]:
        """فعال کردن رقابت برای سانس"""
        return self.update(slot_id, {
            "is_competition_enabled": True,
            "status": SlotStatus.IN_COMPETITION
        })
    
    def disable_competition(self, slot_id: int) -> Optional[Slot]:
        """غیرفعال کردن رقابت برای سانس"""
        return self.update(slot_id, {
            "is_competition_enabled": False,
            "status": SlotStatus.AVAILABLE
        })
    
    def get_upcoming_slots(self, user_id: int, days_ahead: int = 7) -> List[Slot]:
        """گرفتن سانس‌های آینده یک کاربر (از طریق رزروها)"""
        from app.models.booking import Booking
        statement = select(Slot).join(Booking).where(
            Booking.user_id == user_id,
            Slot.slot_date >= date.today(),
            Slot.slot_date <= date.today() + timedelta(days=days_ahead),
            Booking.status == "confirmed"
        ).order_by(Slot.slot_date, Slot.start_time)
        return self.session.exec(statement).all()
    
    def get_daily_report(self, venue_id: int, report_date: date) -> dict:
        """گزارش روزانه سانس‌های یک سالن"""
        slots = self.get_by_venue_and_date(venue_id, report_date)
        
        total_slots = len(slots)
        booked_slots = len([s for s in slots if s.status == SlotStatus.BOOKED])
        available_slots = len([s for s in slots if s.status == SlotStatus.AVAILABLE])
        competition_slots = len([s for s in slots if s.is_competition_enabled])
        blocked_slots = len([s for s in slots if s.status == SlotStatus.BLOCKED])
        
        total_revenue = sum([s.current_price for s in slots if s.status == SlotStatus.BOOKED])
        
        return {
            "date": report_date.isoformat(),
            "total_slots": total_slots,
            "booked_slots": booked_slots,
            "available_slots": available_slots,
            "competition_slots": competition_slots,
            "blocked_slots": blocked_slots,
            "occupancy_rate": round(booked_slots / total_slots * 100, 2) if total_slots > 0 else 0,
            "total_revenue": total_revenue
        }
    
    def create_daily_slots(self, venue_id: int, slot_date: date, start_hour: int = 8, end_hour: int = 23, interval_minutes: int = 90, base_price: Optional[int] = None) -> List[Slot]:
        """ایجاد خودکار سانس‌های روزانه — قیمت هر سانس از موتور قیمت سمت سرور.

        مبنای قیمت: venue.default_slot_price (fallback config.DEFAULT_SLOT_PRICE)؛
        base_price روی سانس همان لنگر قوانین می‌ماند و current_price خروجی
        resolve_price (بدون قوانین: برابر مبنای پیش‌فرض — سازگار با رفتار قبلی).
        """
        from app.services.pricing_service import PricingService

        if base_price is None:
            base_price = PricingService.venue_base_price(self.session, venue_id)
        slots_created = []
        current_hour = start_hour
        current_minute = 0
        
        while current_hour < end_hour:
            start_time = time(current_hour, current_minute)
            
            # بررسی نبودن تداخل
            if not self.is_slot_available(venue_id, slot_date, start_time):
                current_minute += interval_minutes
                if current_minute >= 60:
                    current_hour += current_minute // 60
                    current_minute = current_minute % 60
                continue
            
            final_price, _rule_ids = PricingService.resolve_price(
                self.session, venue_id, slot_date, start_time,
                base_price=base_price, duration=interval_minutes)
            slot = self.create({
                "venue_id": venue_id,
                "slot_date": slot_date,
                "start_time": start_time,
                "duration": interval_minutes,
                "base_price": base_price,
                "current_price": final_price,
                "status": SlotStatus.AVAILABLE
            })
            slots_created.append(slot)
            
            current_minute += interval_minutes
            if current_minute >= 60:
                current_hour += current_minute // 60
                current_minute = current_minute % 60
        
        return slots_created
    
    def get_time_slots_analytics(self, venue_id: int, start_date: date, end_date: date) -> dict:
        """تحلیل محبوبیت ساعات مختلف"""
        slots = self.get_by_venue_and_date_range(venue_id, start_date, end_date)
        
        hourly_stats = {}
        for slot in slots:
            hour = slot.start_time.hour
            if hour not in hourly_stats:
                hourly_stats[hour] = {"total": 0, "booked": 0}
            hourly_stats[hour]["total"] += 1
            if slot.status == SlotStatus.BOOKED:
                hourly_stats[hour]["booked"] += 1
        
        for hour in hourly_stats:
            hourly_stats[hour]["occupancy"] = round(
                hourly_stats[hour]["booked"] / hourly_stats[hour]["total"] * 100, 2
            ) if hourly_stats[hour]["total"] > 0 else 0
        
        return hourly_stats
    
    def get_min_price_for_venue(self, venue_id: int, start_date: date = None, end_date: date = None) -> int:
        """گرفتن حداقل قیمت سانس‌های آزاد یک سالن"""
        if not start_date:
            start_date = date.today()
        if not end_date:
            end_date = start_date + timedelta(days=3)
        
        slots = self.get_by_venue_and_date_range(venue_id, start_date, end_date)
        available_slots = [s for s in slots if s.status == SlotStatus.AVAILABLE]
        
        if available_slots:
            return min(s.current_price for s in available_slots)
        return 0


    # ---------- تحلیل‌های مالی/ occupancy ----------

    def occupancy_summary(
        self, venue_ids: Optional[List[int]], start_date: date, end_date: date
    ) -> Tuple[int, int]:
        """(total_active, occupied) — فعال = هر وضعیتی جز مسدود؛ اشغال = booked/reserved."""
        active = [SlotStatus.AVAILABLE, SlotStatus.BOOKED, SlotStatus.RESERVED, SlotStatus.IN_COMPETITION]
        stmt = select(
            func.count(),
            func.sum(case((Slot.status.in_([SlotStatus.BOOKED, SlotStatus.RESERVED]), 1), else_=0)),
        ).where(Slot.status.in_(active), Slot.slot_date >= start_date, Slot.slot_date <= end_date)
        if venue_ids is not None:
            stmt = stmt.where(Slot.venue_id.in_(venue_ids))
        total, occupied = self.session.exec(stmt).one()
        return int(total or 0), int(occupied or 0)

    def occupancy_by_venue(
        self, venue_ids: List[int], start_date: date, end_date: date
    ) -> dict:
        """occupancy تفکیک‌شده بر حسب سالن در بازه — {venue_id: (total_active, occupied)}."""
        active = [SlotStatus.AVAILABLE, SlotStatus.BOOKED, SlotStatus.RESERVED, SlotStatus.IN_COMPETITION]
        stmt = select(
            Slot.venue_id,
            func.count(),
            func.sum(case((Slot.status.in_([SlotStatus.BOOKED, SlotStatus.RESERVED]), 1), else_=0)),
        ).where(
            Slot.status.in_(active),
            Slot.venue_id.in_(venue_ids),
            Slot.slot_date >= start_date,
            Slot.slot_date <= end_date,
        ).group_by(Slot.venue_id)
        return {int(v): (int(t or 0), int(o or 0)) for v, t, o in self.session.exec(stmt).all()}

    def demand_profile(
        self, venue_ids: Optional[List[int]], start_date: date, end_date: date
    ) -> dict:
        """پروفایل تقاضا به تفکیک (روز هفته, ساعت) — wire get_time_slots_analytics در مقیاس چند سالنه.

        خروجی: {(weekday:int 0=یکشنبه, hour:int): {"total": n, "booked": m}} — تک کوئری.
        """
        active = [SlotStatus.AVAILABLE, SlotStatus.BOOKED, SlotStatus.RESERVED, SlotStatus.IN_COMPETITION]
        stmt = select(Slot.slot_date, Slot.start_time, Slot.status).where(
            Slot.status.in_(active), Slot.slot_date >= start_date, Slot.slot_date <= end_date
        )
        if venue_ids is not None:
            stmt = stmt.where(Slot.venue_id.in_(venue_ids))
        profile: dict = {}
        for slot_date, start_time, status in self.session.exec(stmt).all():
            key = ((slot_date.weekday() + 1) % 7, start_time.hour)  # دامنه %w (0=یکشنبه)
            bucket = profile.setdefault(key, {"total": 0, "booked": 0})
            bucket["total"] += 1
            if status in (SlotStatus.BOOKED, SlotStatus.RESERVED):
                bucket["booked"] += 1
        return profile
