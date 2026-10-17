# backend/app/services/coupon_service.py
"""اعتبارسنجی/رزرو/آزادسازی کوپن — جزئی از موتور قیمت سمت سرور.

چرخه: validate در compute_booking_price → reserve هنگام ساخت رزرو معلق
(Redis) → connect به booking در تأیید نهایی → release در رد/انقضاء/لغو
(uses_count کم و ردیف redemption حذف می‌شود تا کد نسوزد).
"""
from datetime import datetime, timezone
from typing import Optional, Tuple

from fastapi import HTTPException
from sqlmodel import Session

from app.models.coupon import Coupon, CouponRedemption, CouponType
from app.repositories.coupon_repository import (
    CouponRedemptionRepository, CouponRepository, normalize_code,  # noqa: F401
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _as_aware(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


class CouponService:

    # ─────────────────────────── اعتبارسنجی ───────────────────────────

    @staticmethod
    def validate_and_compute(session: Session, code: str, user_id: int,
                             venue_id: int, amount: int
                             ) -> Tuple[Coupon, int]:
        """کوپن معتبر + مبلغ تخفیف روی `amount` (قیمت لحظه، پس از قوانین/دیل).

        همه ردّها ۴۰۰ با پیام فارسی.
        """
        repo = CouponRepository(session)
        coupon = repo.get_by_code(code)
        if not coupon:
            raise HTTPException(status_code=400, detail="کد تخفیف نامعتبر است")
        if not coupon.is_active:
            raise HTTPException(status_code=400, detail="کد تخفیف غیرفعال شده است")
        if coupon.venue_id is not None and coupon.venue_id != venue_id:
            raise HTTPException(status_code=400, detail="این کد تخفیف مخصوص سالن دیگری است")
        now = _utcnow()
        start = _as_aware(coupon.valid_from)
        end = _as_aware(coupon.valid_until)
        if start is not None and now < start:
            raise HTTPException(status_code=400, detail="این کد تخفیف هنوز فعال نشده است")
        if end is not None and now > end:
            raise HTTPException(status_code=400, detail="کد تخفیف منقضی شده است")
        if coupon.max_uses is not None and coupon.uses_count >= coupon.max_uses:
            raise HTTPException(status_code=400, detail="ظرفیت استفاده از این کد تخفیف تکمیل شده است")
        # پیامِ زودهنگام؛ نگهبانِ واقعی داخل INSERTِ `reserve` است (چکِ این‌جا قفل ندارد).
        if coupon.per_user_limit:
            used = repo.user_redemption_count(coupon.id, user_id)
            if used >= coupon.per_user_limit:
                raise HTTPException(
                    status_code=400,
                    detail="سقف استفاده از این کد تخفیف برای شما پر شده است")
        if coupon.min_booking_amount and amount < coupon.min_booking_amount:
            raise HTTPException(
                status_code=400,
                detail=f"حداقل مبلغ رزرو برای این کد تخفیف {coupon.min_booking_amount:,} ریال است")
        discount = CouponService.compute_discount(coupon, amount)
        if discount <= 0:
            raise HTTPException(status_code=400, detail="مبلغ تخفیف این کد صفر است")
        return coupon, discount

    @staticmethod
    def compute_discount(coupon: Coupon, amount: int) -> int:
        if coupon.discount_type == CouponType.PERCENT:
            return min(amount, amount * int(coupon.value) // 10000)
        return min(amount, int(coupon.value))

    # ─────────────────────────── رزرو/آزادسازی ───────────────────────────

    @staticmethod
    def reserve(session: Session, coupon: Coupon, user_id: int,
                amount_discounted: int) -> CouponRedemption:
        """ثبت مصرف — یک ظرفیت با CAS + ردیف redemption (booking=null تا تأیید).

        نگهبانِ `max_uses` داخل خودِ UPDATE است (`try_consume_capacity`)؛ چکِ Pythonی
        `uses_count >= max_uses` در `validate_and_compute` فقط پیامِ زودهنگام می‌دهد و
        به‌تنهایی جلوی دو رزروِ موازی را نمی‌گیرد.

        **ترتیب اینجا بارِ اثبات است:** اول ظرفیت و بعد شمارشِ فردی. همان `UPDATE coupons`
        ردیف کوپن را تا commit تراکنش قفل می‌کند، پس رزروی که همزمان رسیده روی همان
        UPDATE می‌ایستد و وقتی آزاد می‌شود، شمارشِ `coupon_redemptions` مصرفِ اول را
        می‌بیند. اگر شمارش اول می‌آمد، دو رزروِ یک کاربر روی `per_user_limit=1` هر دو
        «صفر» می‌دیدند و هر دو ردیف می‌ساختند (نصفِ دومِ گرهٔ C13.3.1).
        """
        repo = CouponRepository(session)
        if not repo.try_consume_capacity(coupon.id):
            raise HTTPException(status_code=400, detail="ظرفیت استفاده از این کد تخفیف تکمیل شده است")
        red_repo = CouponRedemptionRepository(session)
        if coupon.per_user_limit:
            redemption = red_repo.insert_within_user_limit(
                coupon.id, user_id, amount_discounted, coupon.per_user_limit)
            if redemption is None:
                # ظرفیتی که همین‌جا گرفتیم پس داده می‌شود؛ فراخوانِ بیرون از UnitOfWork
                # هم نباید با یک صندلیِ سوخته و بی‌مصرف بماند.
                repo.release_capacity(coupon.id)
                raise HTTPException(
                    status_code=400,
                    detail="سقف استفاده از این کد تخفیف برای شما پر شده است")
            return redemption
        return red_repo.create({
            "coupon_id": coupon.id,
            "user_id": user_id,
            "booking_id": None,
            "amount_discounted": amount_discounted,
        })

    @staticmethod
    def connect_to_booking(session: Session, redemption_id: int, booking_id: int):
        red_repo = CouponRedemptionRepository(session)
        red = red_repo.get_by_id(redemption_id)
        if red:
            red_repo.update(red.id, {"booking_id": booking_id})

    @staticmethod
    def release_by_id(session: Session, redemption_id: int) -> bool:
        red_repo = CouponRedemptionRepository(session)
        red = red_repo.get_by_id(redemption_id)
        if not red:
            return False
        CouponRepository(session).release_capacity(red.coupon_id)
        session.delete(red)
        session.flush()
        return True

    @staticmethod
    def release_for_booking(session: Session, booking_id: int) -> bool:
        red = CouponRedemptionRepository(session).get_by_booking(booking_id)
        if not red:
            return False
        return CouponService.release_by_id(session, red.id)