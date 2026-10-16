# backend/app/services/pricing_insight_service.py
"""تحلیل تقاضا و پیشنهاد قیمت (P008/C5) — آمارِ توصیفی از دادهٔ واقعی، بدون ML.

چرا این‌طور و چرا صادقانه:
- موتور قیمت (PricingService) تنها مبدأ قیمت است؛ این سرویس هیچ چیزی ذخیره یا اعمال
  نمی‌کند — فقط یک عدد پیشنهادی کنار قیمت موتور و دلیلی که به آن رسیده می‌گذارد.
- سیگنال از `Booking` خوانده می‌شود نه `Slot.status`: رزروِ لغوشده سانس را به AVAILABLE
  برمی‌گرداند و تاریخچهٔ status را پاک می‌کند، اما رزرو در دیتابیس می‌ماند و نباید
  در اشغال شمار شود.
- هر عددی که دادهٔ کافی پشتش نیست `None` است (نه صفر) و `confidence: "low"` برمی‌گردد —
  همان قاعدهٔ C4: سیگنالِ دست‌نیافتنی از مخرج بیرون می‌رود، نه با صفرِ گمراه‌کننده.
- ریل ایمن: پیشنهاد هرگز بیشتر از `PRICING_SUGGESTION_MAX_DELTA_PERCENT` از قیمت موتور
  جابه‌جا نمی‌شود و بین کف/سقف درصدی clamp می‌ماند. (موتور قبلاً فقط کف داشت، سقف نداشت.)

سازگاری روز هفته: همه‌جا `date.weekday()` یعنی ۰=دوشنبه — همان کلید `PricingRule.day_of_week`.
`SlotRepository.demand_profile` دامنهٔ دیگری دارد (۰=یکشنبه) و عمداً اینجا استفاده نشده.
"""
from datetime import date, time as dtime, timedelta
from typing import List, Optional, Tuple

from sqlmodel import Session

from app.config import settings
from app.repositories.booking_repository import BookingRepository
from app.repositories.slot_repository import SlotRepository
from app.services.pricing_service import PricingService
from app.utils.weekdays import WEEKDAY_NAMES_PY

# بازهٔ مجاز پنجرهٔ تاریخچه — نه آن‌قدر کوتاه که نویز شود، نه کوئری سنگین شود
MIN_WINDOW_DAYS = 7
MAX_WINDOW_DAYS = 365

_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")


def fa_num(value) -> str:
    """عدد/متن لاتین → متن فارسی با جداکنندهٔ هزارگان (برای پیام‌های توضیحی API)."""
    if isinstance(value, (int,)):
        text = f"{value:,}"
    elif isinstance(value, float):
        text = f"{value:,.1f}".rstrip("0").rstrip(".") if value % 1 else f"{int(value):,}"
    else:
        text = str(value)
    return text.replace("-", "−").translate(_DIGITS)


def _resolve_window(days: Optional[int]) -> Tuple[int, date, date]:
    """(روز، شروع، پایان) — پنجره فقط گذشته است: سانس‌های آینده هنوز اشغال نشده‌اند
    و وارد کردنشان مخرجِ اشغال را رقیق و نرخ را کاذب پایین می‌کند."""
    window = int(days or settings.PRICING_INSIGHT_WINDOW_DAYS)
    window = max(MIN_WINDOW_DAYS, min(MAX_WINDOW_DAYS, window))
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=window - 1)
    return window, start, end


def _ratio(numerator: int, denominator: int) -> Optional[float]:
    if denominator <= 0:
        return None
    return round(numerator / denominator * 100, 1)


def _round_to_step(value: int, step: int) -> int:
    if step <= 1:
        return int(value)
    return int(round(value / step) * step)


def _bucket_label(weekday: int, hour: int) -> str:
    return f"{WEEKDAY_NAMES_PY[weekday]} {fa_num(f'{hour:02d}')}:۰۰"


class PricingInsightService:

    # ─────────────────────────── C5.1 — سیگنال اشغال ───────────────────────────

    @staticmethod
    def occupancy(session: Session, venue_id: int, days: Optional[int] = None) -> dict:
        """نرخ اشغال و میانگین پرداخت واقعی به تفکیک دستهٔ (روز هفته, ساعت).

        فقط دسته‌هایی برمی‌گردند که یا سانسِ فعال دارند یا رزرو — هیچ دسته‌ای
        از خود ساخته نمی‌شود. `occupancy`/`avg_paid` در نبود داده `None` است.
        """
        window, start, end = _resolve_window(days)
        totals = SlotRepository(session).slot_bucket_totals(venue_id, start, end)
        stats = BookingRepository(session).realized_bucket_stats(venue_id, start, end)

        buckets: List[dict] = []
        for weekday, hour in sorted(set(totals) | set(stats)):
            slot_count = int(totals.get((weekday, hour), 0))
            booked = int(stats.get((weekday, hour), {}).get("bookings", 0))
            revenue = int(stats.get((weekday, hour), {}).get("revenue", 0))
            buckets.append({
                "weekday": weekday,
                "hour": hour,
                "label": _bucket_label(weekday, hour),
                "slots": slot_count,
                "bookings": booked,
                "occupancy": _ratio(booked, slot_count),
                "avg_paid": int(round(revenue / booked)) if booked else None,
            })

        overall_slots = sum(int(v) for v in totals.values())
        overall_bookings = sum(int(v["bookings"]) for v in stats.values())
        overall_revenue = sum(int(v["revenue"]) for v in stats.values())
        return {
            "venue_id": venue_id,
            "days": window,
            "start_date": start,
            "end_date": end,
            "total_slots": overall_slots,
            "total_bookings": overall_bookings,
            "overall_occupancy": _ratio(overall_bookings, overall_slots),
            "overall_avg_paid": (int(round(overall_revenue / overall_bookings))
                                 if overall_bookings else None),
            "buckets": buckets,
        }

    # ─────────────────────────── C5.2 — پیشنهاد قیمت ───────────────────────────

    @staticmethod
    def suggest_price(session: Session, venue_id: int, slot_date: date,
                      start_time: dtime, duration: int = 90,
                      days: Optional[int] = None) -> dict:
        """پیشنهاد قیمت از تاریخچه، چسبیده به قیمت موتور و clamp شده بین کف و سقف.

        `recommended_price` همیشه عدد است اما فقط وقتی `applies: True` باشد توصیه‌شدنی است؛
        در کمبود داده برابر قیمت موتور می‌ماند و `confidence: "low"` برمی‌گردد.
        """
        base = PricingService.venue_base_price(session, venue_id)
        engine_price, applied, _ids = PricingService.resolve_price_detail(
            session, venue_id, slot_date, start_time, base_price=base,
            duration=duration)

        floor = engine_price * int(settings.PRICING_SUGGESTION_FLOOR_PERCENT) // 100
        ceiling = engine_price * int(settings.PRICING_SUGGESTION_CEILING_PERCENT) // 100
        result = {
            "venue_id": venue_id,
            "slot_date": slot_date,
            "start_time": start_time,
            "weekday": slot_date.weekday(),
            "hour": start_time.hour,
            "days": int(settings.PRICING_INSIGHT_WINDOW_DAYS),
            "duration": duration,
            "base_price": base,
            "engine_price": engine_price,
            "rules": applied,
            "floor_price": floor,
            "ceiling_price": ceiling,
            "recommended_price": engine_price,
            "applies": False,
            "confidence": "low",
            "delta_percent": 0.0,
            "demand_gap": None,
            "bucket": None,
            "overall_occupancy": None,
            "reasons": [],
        }
        reasons: List[str] = []

        if engine_price <= 0:
            result["reasons"] = ["قیمت موتور برای این سانس صفر است؛ پیشنهادی داده نمی‌شود."]
            return result

        insight = PricingInsightService.occupancy(session, venue_id, days)
        result["days"] = insight["days"]
        result["overall_occupancy"] = insight["overall_occupancy"]
        bucket = next((b for b in insight["buckets"]
                       if b["weekday"] == slot_date.weekday()
                       and b["hour"] == start_time.hour), None)
        result["bucket"] = bucket

        min_samples = int(settings.PRICING_INSIGHT_MIN_SAMPLES)

        if bucket is None or bucket["slots"] == 0:
            reasons.append(
                "در پنجرهٔ اخیر هیچ سانسِ فعالی برای این روز هفته و ساعت ثبت نشده؛ "
                "سیگنال تقاضایی برای پیشنهاد دادن وجود ندارد.")
            result["reasons"] = reasons
            return result

        if bucket["bookings"] < min_samples:
            reasons.append(
                f"فقط {fa_num(bucket['bookings'])} رزروِ تأییدشده در این دسته وجود دارد "
                f"(حداقل {fa_num(min_samples)}) — داده برای پیشنهاد قیمت کافی نیست.")
            reasons.append(
                f"اشغال مشاهده‌شدهٔ این دسته {fa_num(bucket['occupancy'])}٪ از "
                f"{fa_num(bucket['slots'])} نمونهٔ سانس است، ولی با نمونهٔ کم تصمیم گرفته نمی‌شود.")
            result["reasons"] = reasons
            return result

        if bucket["occupancy"] is None or insight["overall_occupancy"] is None:
            reasons.append("مخرجِ اشغال محاسبه نمی‌شود؛ پیشنهاد داده نمی‌شود.")
            result["reasons"] = reasons
            return result

        gap = (bucket["occupancy"] - insight["overall_occupancy"]) / 100.0
        sensitivity = int(settings.PRICING_DEMAND_SENSITIVITY_PERCENT) / 100.0
        max_delta = int(settings.PRICING_SUGGESTION_MAX_DELTA_PERCENT) / 100.0
        factor = 1.0 + gap * sensitivity
        limited = max(1.0 - max_delta, min(1.0 + max_delta, factor))
        stepped = _round_to_step(int(round(engine_price * limited)),
                                 int(settings.PRICING_SUGGESTION_ROUND_STEP))
        recommended = max(0, min(max(stepped, floor), ceiling))

        result.update({
            "recommended_price": recommended,
            "applies": recommended != engine_price,
            "delta_percent": round((recommended - engine_price) / engine_price * 100, 1),
            "demand_gap": round(gap * 100, 1),
            "confidence": "high" if bucket["bookings"] >= min_samples * 3 else "medium",
        })

        if gap > 0:
            reasons.append(
                f"اشغال این دسته {fa_num(bucket['occupancy'])}٪ در برابر میانگین سالن "
                f"{fa_num(insight['overall_occupancy'])}٪ ⇒ تقاضای بالاتر از میانگین.")
        elif gap < 0:
            reasons.append(
                f"اشغال این دسته {fa_num(bucket['occupancy'])}٪ در برابر میانگین سالن "
                f"{fa_num(insight['overall_occupancy'])}٪ ⇒ تقاضای پایین‌تر از میانگین.")
        else:
            reasons.append(
                f"اشغال این دسته برابر میانگین سالن ({fa_num(insight['overall_occupancy'])}٪) است؛ "
                "جابه‌جایی قیمت توجیهی ندارد.")

        if bucket["avg_paid"] is not None:
            reasons.append(
                f"میانگین مبلغ واقعیِ پرداختی در این دسته {fa_num(bucket['avg_paid'])} ریال از "
                f"{fa_num(bucket['bookings'])} رزرو در پنجرهٔ {fa_num(insight['days'])} روز گذشته.")

        reasons.append(
            f"قیمت موتور برای این تاریخ و ساعت {fa_num(engine_price)} ریال است "
            f"(مبنا {fa_num(base)} ریال) و پیشنهاد هرگز از آن مستقل ساخته نمی‌شود.")

        if limited != factor:
            reasons.append(
                f"ضریب تقاضا به ±{fa_num(round(max_delta * 100, 1))}٪ محدود شد تا پیشنهاد "
                f"بیش از این از قیمت موتور فاصله نگیرد.")
        if recommended != stepped:
            reasons.append(
                f"عدد پیشنهادی روی بازهٔ ایمن {fa_num(floor)} تا {fa_num(ceiling)} ریال تنظیم شد.")
        if not result["applies"]:
            reasons.append("پس از clamp پیشنهاد با قیمت موتور برابر شد؛ تغییری توصیه نمی‌شود.")

        result["reasons"] = reasons
        return result
