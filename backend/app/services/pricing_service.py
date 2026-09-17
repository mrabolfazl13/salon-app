# backend/app/services/pricing_service.py
"""موتور قیمت سمت سرور — تنها منبع اقتدار محاسبه قیمت.

ترتیب نهایی (MODULE 7):
    base_price → قوانین قیمت‌گذاری → قیمت دیل (اگر سانس is_deal باشد) → کوپن → امتیاز وفاداری → PAYABLE

اصول:
- هیچ عددی از سمت کلاینت به‌عنوان قیمت پذیرفته نمی‌شود؛ فرانت‌اند فقط
  slot_id/discount_code/use_loyalty_points می‌فرستد.
- قوانین روی base_price (لنگر) حل می‌شوند؛ بنابراین تغییر قوانین پس از تولید
  سانس هم در لحظه رزرو اعمال می‌شود (سرور، not cache).
- percent = ضریب×۱۰۰ با علامت، fixed = ریال با علامت، absolute = جایگزین.
  بعد از هر قانون clamp روی min_floor انجام می‌شود (قیمت منفی/زیرکف غیرممکن).
"""
from datetime import date, datetime, time as dtime, timedelta, timezone
from typing import List, Optional, Tuple

from fastapi import HTTPException
from sqlmodel import Session

from app.config import settings
from app.models.booking import Booking
from app.models.holiday import Holiday
from app.models.pricing_rule import ModifierType, PricingRule
from app.models.slot import Slot
from app.models.user import User
from app.models.venue import Venue
from app.repositories.holiday_repository import HolidayRepository
from app.repositories.loyalty_repository import LoyaltyRepository
from app.repositories.pricing_rule_repository import PricingRuleRepository
from app.services.coupon_service import CouponService


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _as_aware(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


class PricingService:

    # ─────────────────────────── مبنای قیمت ───────────────────────────

    @staticmethod
    def venue_base_price(session: Session, venue_id: int) -> int:
        venue = session.get(Venue, venue_id)
        if venue and venue.default_slot_price:
            return int(venue.default_slot_price)
        return int(settings.DEFAULT_SLOT_PRICE)

    # ─────────────────────────── تطبیق قوانین ───────────────────────────

    @staticmethod
    def is_holiday(session: Session, when: date, venue_id: Optional[int] = None) -> bool:
        return HolidayRepository(session).is_holiday(when, venue_id)

    @staticmethod
    def _window_overlap(rule: PricingRule, start_time: dtime, duration: int) -> bool:
        if rule.start_time is None and rule.end_time is None:
            return True
        slot_start = start_time.hour * 60 + start_time.minute
        slot_end = slot_start + (duration or 90)
        if rule.start_time is not None:
            r_start = rule.start_time.hour * 60 + rule.start_time.minute
            if slot_end <= r_start:
                return False
        if rule.end_time is not None:
            r_end = rule.end_time.hour * 60 + rule.end_time.minute
            if slot_start >= r_end:
                return False
        return True

    @staticmethod
    def rule_matches(rule: PricingRule, slot_date: date, start_time: dtime,
                     duration: int, holiday: bool) -> bool:
        """معنادارِ holiday_applies: True ⇒ فقط در تعطیل (بدون شرط روز هفته)؛
        False ⇒ در روز تعطیل هرگز اجرا نمی‌شود."""
        if rule.holiday_applies:
            if not holiday:
                return False
        else:
            if holiday:
                return False
            if rule.day_of_week is not None and rule.day_of_week != slot_date.weekday():
                return False
        return PricingService._window_overlap(rule, start_time, duration)

    # ─────────────────────────── حل قیمت ───────────────────────────

    @staticmethod
    def resolve_price_detail(session: Session, venue_id: int, slot_date: date,
                             start_time: dtime, base_price: Optional[int] = None,
                             duration: int = 90, min_floor: int = 0
                             ) -> Tuple[int, List[dict], List[int]]:
        if base_price is None:
            base_price = PricingService.venue_base_price(session, venue_id)
        holiday = PricingService.is_holiday(session, slot_date, venue_id)
        price = int(base_price)
        applied: List[dict] = []
        for rule in PricingRuleRepository(session).get_active_for_venue(venue_id):
            if not PricingService.rule_matches(rule, slot_date, start_time, duration, holiday):
                continue
            before = price
            mt = rule.modifier_type
            if mt == ModifierType.ABSOLUTE:
                price = int(rule.value)
            elif mt == ModifierType.PERCENT:
                price = int(round(price * (10000 + rule.value) / 10000))
            else:  # FIXED
                price = price + int(rule.value)
            price = max(price, min_floor)
            applied.append({
                "rule_id": rule.id,
                "label": rule.label,
                "modifier_type": mt.value if hasattr(mt, "value") else str(mt),
                "value": rule.value,
                "delta": price - before,
            })
        return price, applied, [a["rule_id"] for a in applied]

    @staticmethod
    def resolve_price(session: Session, venue_id: int, slot_date: date,
                      start_time: dtime, base_price: Optional[int] = None,
                      duration: int = 90, min_floor: int = 0
                      ) -> Tuple[int, List[int]]:
        price, _, ids = PricingService.resolve_price_detail(
            session, venue_id, slot_date, start_time, base_price, duration, min_floor)
        return price, ids

    # ─────────────────────────── دیل (سانس لحظه آخری) ───────────────────────────

    @staticmethod
    def deal_active(slot: Slot, now: Optional[datetime] = None) -> bool:
        if not slot.is_deal or slot.deal_price is None:
            return False
        expires = _as_aware(slot.deal_expires_at)
        if expires is not None and (now or _utcnow()) >= expires:
            return False
        return True

    # ─────────────────────────── محاسبه نهایی رزرو ───────────────────────────

    @staticmethod
    def compute_booking_price(session: Session, slot: Slot, user: User,
                              discount_code: Optional[str] = None,
                              use_loyalty_points: bool = False) -> dict:
        """ترتیب کامل: base → rules → deal → coupon → loyalty → PAYABLE.

        فقط محاسبه و اعتبارسنجی می‌کند؛ ثبت redemption/کسر امتیاز
        بر عهده فراخوان (booking flow) است تا اتمیک با رزرو بماند.
        """
        from app.utils.time_guard import is_past_slot
        if is_past_slot(slot.slot_date, slot.start_time):
            raise HTTPException(
                status_code=400, detail="این سانس گذشته است و قابل رزرو نیست")

        base = int(slot.base_price)
        duration = int(slot.duration or 90)
        price, rules, _ids = PricingService.resolve_price_detail(
            session, slot.venue_id, slot.slot_date, slot.start_time,
            base_price=base, duration=duration)

        steps = [{"step": "base", "amount": base},
                 {"step": "pricing_rules", "amount": price - base,
                  "rules": rules}]

        # current_price فقط به‌عنوان اصلاحِ کاهنده‌ی سمت سرور (برنده رقابت قیمت /
        # مذاکره قرارداد) پذیرفته می‌شود؛ هرگز قیمت را بالا نمی‌برد.
        adjust_savings = 0
        if slot.current_price is not None and int(slot.current_price) < price:
            adjust_savings = price - int(slot.current_price)
            price = int(slot.current_price)
            steps.append({"step": "server_adjustments", "amount": -adjust_savings})

        deal_info = None
        if PricingService.deal_active(slot) and slot.deal_price is not None:
            effective_after_rules = price
            deal_price = max(int(slot.deal_price), 0)
            if deal_price < effective_after_rules:
                price = deal_price
                deal_info = {"deal_price": deal_price,
                             "savings": effective_after_rules - deal_price}
                steps.append({"step": "deal", "amount": -deal_info["savings"]})

        coupon_info = None
        if discount_code:
            coupon, discount = CouponService.validate_and_compute(
                session, discount_code, user_id=user.id,
                venue_id=slot.venue_id, amount=price)
            price = max(price - discount, 0)
            coupon_info = {"coupon_id": coupon.id, "code": coupon.code,
                           "discount": discount}
            steps.append({"step": "coupon", "amount": -discount, "code": coupon.code})

        loyalty_info = None
        if use_loyalty_points:
            points, ldisc = PricingService.max_loyalty_redeem(session, user.id, price)
            if points > 0:
                price = max(price - ldisc, 0)
                loyalty_info = {"points": points, "discount": ldisc}
            else:
                loyalty_info = {"points": 0, "discount": 0}
            if loyalty_info["points"]:
                steps.append({"step": "loyalty", "amount": -ldisc,
                              "points": points})

        discount_total = adjust_savings
        if deal_info:
            discount_total += deal_info["savings"]
        if coupon_info:
            discount_total += coupon_info["discount"]
        if loyalty_info:
            discount_total += loyalty_info["discount"]

        return {
            "final_price": price,
            "base": base,
            "rules": rules,
            "rule_ids": _ids,
            "deal": deal_info,
            "coupon": coupon_info,
            "loyalty": loyalty_info,
            "discount_amount": discount_total,
            "breakdown": steps,
        }

    # ─────────────────────────── سقف خرج امتیاز ───────────────────────────

    @staticmethod
    def max_loyalty_redeem(session: Session, user_id: int, price: int) -> Tuple[int, int]:
        """حداکثر امتیاز خرج‌شدنی: min(موجودی کاربر، سقف درصدی قیمت) → (points, rials)."""
        balance = LoyaltyRepository(session).balance(user_id)
        if balance <= 0 or price <= 0:
            return 0, 0
        cap_rial = price * int(settings.LOYALTY_REDEEM_MAX_PERCENT) // 100
        per_point = int(settings.LOYALTY_RIALS_PER_POINT) or 1
        max_points = min(balance, cap_rial // per_point)
        if max_points <= 0:
            return 0, 0
        return max_points, max_points * per_point