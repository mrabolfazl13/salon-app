# backend/app/repositories/slot_repository.py
from sqlmodel import Session, select, and_, or_, func
from datetime import date, time, datetime, timedelta
from typing import Optional, List, Tuple
from app.models.slot import Slot, SlotStatus
from app.repositories.base import BaseRepository

class SlotRepository(BaseRepository[Slot]):
    
    def __init__(self, session: Session):
        super().__init__(Slot, session)
    
    def get_by_id_with_lock(self, slot_id: int) -> Optional[Slot]:
        """گرفتن سانس با قفل دیتابیسی برای جلوگیری از race condition"""
        statement = select(Slot).where(Slot.id == slot_id).with_for_update()
        return self.session.exec(statement).first()

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
    
    def check_slot_conflict(self, venue_id: int, slot_date: date, start_time: time, duration: int = 90) -> Optional[Slot]:
        """بررسی تداخل زمانی با سانس‌های دیگر"""
        end_time = (datetime.combine(slot_date, start_time) + timedelta(minutes=duration)).time()
        
        statement = select(Slot).where(
            Slot.venue_id == venue_id,
            Slot.slot_date == slot_date,
            Slot.status != SlotStatus.BLOCKED,
            or_(
                and_(Slot.start_time <= start_time, Slot.start_time + interval > start_time),
                and_(Slot.start_time >= start_time, Slot.start_time < end_time)
            )
        )
        return self.session.exec(statement).first()
    
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
        """به‌روزرسانی قیمت سانس"""
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
    
    def create_daily_slots(self, venue_id: int, slot_date: date, start_hour: int = 8, end_hour: int = 23, interval_minutes: int = 90) -> List[Slot]:
        """ایجاد خودکار سانس‌های روزانه برای یک سالن"""
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
            
            slot = self.create({
                "venue_id": venue_id,
                "slot_date": slot_date,
                "start_time": start_time,
                "duration": interval_minutes,
                "base_price": 200000,
                "current_price": 200000,
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