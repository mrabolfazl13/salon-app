import json

from fastapi import HTTPException
from app.unit_of_work import UnitOfWork
from app.models.slot import SlotStatus
from app.models.booking import BookingStatus
from app.models.contract import ContractStatus
from app.services.coupon_service import CouponService
from app.services.loyalty_service import LoyaltyService
from app.services.pricing_service import PricingService


class BookingService:

    @staticmethod
    def _contract_is_active(uow: UnitOfWork, slot) -> bool:
        """آیا این سانس به قرارداد فعال وابسته است؟ (دفاع در عمق برای داده قدیمی)"""
        contract = uow.contracts.get_by_id(slot.contract_id) if slot.contract_id else None
        if contract is None:
            ref = uow.contract_slots.get_one(slot_id=slot.id)
            if ref:
                contract = uow.contracts.get_by_id(ref.contract_id)
        return bool(contract and contract.status == ContractStatus.ACTIVE)

    @staticmethod
    def create_booking(uow: UnitOfWork, slot_id: int, user_id: int,
                       current_user=None, discount_code: str = None,
                       use_loyalty_points: bool = False) -> dict:
        """ایجاد رزرو معلق (در انتظار تأیید مدیر سالن)

        قیمت از موتور سمت سرور محاسبه می‌شود (base→rules→deal→coupon→loyalty)؛
        کوپن در همین لحظه رزرو (سوزانده) می‌شود تا دو کاربر هم‌زمان از یک
        ظرفیت استفاده نکنند — در رد/انقضا/لغو آزاد می‌گردد.
        """
        from app.services.pending_booking_service import pending_booking_service

        if current_user is None:
            current_user = uow.users.get_by_id(user_id)

        # استفاده از قفل دیتابیسی (SELECT ... FOR UPDATE) برای جلوگیری از race condition
        slot = uow.slots.get_by_id_with_lock(slot_id)
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")

        if slot.status == SlotStatus.RESERVED:
            raise HTTPException(
                status_code=400,
                detail="این سانس رزروی است (ویژه قرارداد) و امکان رزرو آن وجود ندارد",
            )
        if slot.status != SlotStatus.AVAILABLE:
            raise HTTPException(status_code=400, detail="Slot is not available")

        # دفاع در عمق: سانس قراردادِ فعال حتی با وضعیت AVAILABLE رد می‌شود
        if slot.is_contract_slot and BookingService._contract_is_active(uow, slot):
            raise HTTPException(
                status_code=400,
                detail="این سانس بخشی از یک قرارداد فعال است و امکان رزرو آن وجود ندارد",
            )

        # بررسی رزرو تکراری با قفل - از race condition جلوگیری می‌کند
        existing = uow.bookings.get_by_slot_with_lock(slot_id)
        if existing:
            raise HTTPException(status_code=400, detail="Slot already booked")

        if pending_booking_service.has_pending_for_slot(slot_id):
            raise HTTPException(status_code=400, detail="Slot is already pending confirmation")

        # ── موتور قیمت سمت سرور — تنها مبدأ مبلغ قابل پرداخت ──
        pricing = PricingService.compute_booking_price(
            uow.session, slot, current_user,
            discount_code=discount_code, use_loyalty_points=use_loyalty_points)

        extra = {
            "discount_amount": pricing["discount_amount"],
            "coupon_code": pricing["coupon"]["code"] if pricing["coupon"] else None,
            "loyalty_points_used": pricing["loyalty"]["points"] if pricing["loyalty"] else 0,
            "pricing_breakdown": json.dumps(pricing["breakdown"], ensure_ascii=False),
            "deal_applied": bool(pricing.get("deal")),
        }

        # تا مدیر سالن تأیید یا رد کند، سانس رزرو شده می‌ماند تا کسی دیگر نتواند رزرو کند
        uow.slots.update(slot_id, {"status": SlotStatus.BOOKED})

        if pricing["coupon"]:
            coupon = uow.coupons.get_by_id(pricing["coupon"]["coupon_id"])
            redemption = CouponService.reserve(
                uow.session, coupon, user_id, pricing["coupon"]["discount"])
            extra["coupon_redemption_id"] = redemption.id

        pending = pending_booking_service.create(
            slot_id=slot_id,
            venue_id=slot.venue_id,
            user_id=user_id,
            payment_amount=pricing["final_price"],
            extra=extra,
        )
        if pricing["coupon"]:
            # بازتاب کوپن در پاسخ رزرو معلق
            pending["coupon_code"] = pricing["coupon"]["code"]
        return pending

    @staticmethod
    def release_pending_promotions(uow: UnitOfWork, pending: dict) -> None:
        """آزادسازی کوپن رزرومعلقِ رد/انقضا/لغوشده — کد نسوزد."""
        rid = pending.get("coupon_redemption_id")
        if rid:
            CouponService.release_by_id(uow.session, rid)

    @staticmethod
    def confirm_pending(uow: UnitOfWork, pending: dict) -> "Booking":
        """تبدیل رزرو معلق به رزرو قطعی در دیتابیس (فقط توسط مدیر سالن)"""
        from app.services.pending_booking_service import pending_booking_service

        slot = uow.slots.get_by_id(pending["slot_id"])
        if not slot:
            pending_booking_service.remove(pending["id"])
            raise HTTPException(status_code=404, detail="Slot not found")

        if slot.status != SlotStatus.BOOKED:
            # سانس دیگر در حالت رزرو نیست (مثلاً آزاد شده) — رکورد معلق را پاک کن
            pending_booking_service.remove(pending["id"])
            BookingService.release_pending_promotions(uow, pending)
            raise HTTPException(status_code=400, detail="Slot is no longer held for this booking")

        existing = uow.bookings.get_by_slot_with_lock(pending["slot_id"])
        if existing:
            pending_booking_service.remove(pending["id"])
            BookingService.release_pending_promotions(uow, pending)
            raise HTTPException(status_code=400, detail="Slot already has a confirmed booking")

        # دفاع در عمق: تأیید نهایی روی سانس قرارداد فعال مجاز نیست
        if slot.is_contract_slot and BookingService._contract_is_active(uow, slot):
            pending_booking_service.remove(pending["id"])
            BookingService.release_pending_promotions(uow, pending)
            raise HTTPException(
                status_code=400,
                detail="این سانس بخشی از یک قرارداد فعال است و امکان رزرو آن وجود ندارد",
            )

        # حالا داخل دیتابیس می‌نشیند — اجزای قیمت برای ممیزی/بازگشت وجه ثبت می‌شوند
        booking = uow.bookings.create({
            "slot_id": pending["slot_id"],
            "user_id": pending["user_id"],
            "payment_amount": pending["payment_amount"],
            "status": BookingStatus.CONFIRMED,
            "discount_amount": int(pending.get("discount_amount") or 0),
            "coupon_code": pending.get("coupon_code"),
            "loyalty_points_used": int(pending.get("loyalty_points_used") or 0),
            "pricing_breakdown": pending.get("pricing_breakdown"),
        })

        # اتصال redemption کوپن به رزرو قطعی
        if pending.get("coupon_redemption_id"):
            CouponService.connect_to_booking(
                uow.session, pending["coupon_redemption_id"], booking.id)

        # کسر امتیاز وفاداری (خرج در checkout) — متصل به همین رزرو
        pts = int(pending.get("loyalty_points_used") or 0)
        if pts > 0:
            LoyaltyService.redeem_for_booking(uow.session, pending["user_id"], pts, booking)

        # دیل صرف‌شده است — از بازار لحظه‌آخری خارج می‌شود
        if slot.is_deal and pending.get("deal_applied"):
            obj = uow.slots.get_by_id(slot.id) or slot
            obj.is_deal = False
            obj.deal_price = None
            obj.deal_expires_at = None
            uow.session.add(obj)

        pending_booking_service.remove(pending["id"])
        return booking

    @staticmethod
    def cancel_booking(uow: UnitOfWork, booking_id: int, user_id: int):
        booking = uow.bookings.get_by_id(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if booking.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not your booking")
        
        if booking.status != BookingStatus.CONFIRMED:
            raise HTTPException(status_code=400, detail="Cannot cancel this booking")
        
        slot = uow.slots.get_by_id(booking.slot_id)
        restore_status = SlotStatus.RESERVED if (slot and slot.is_contract_slot) else SlotStatus.AVAILABLE
        uow.slots.update(booking.slot_id, {"status": restore_status})
        cancelled = uow.bookings.update(booking_id, {"status": BookingStatus.CANCELLED})

        # آزادسازی ترویج‌ها — کوپن و امتیاز نسوزند
        CouponService.release_for_booking(uow.session, booking_id)
        if cancelled:
            LoyaltyService.refund_for_booking(uow.session, cancelled)

        return cancelled

    @staticmethod
    def get_user_bookings(uow: UnitOfWork, user_id: int, limit: int = 50):
        return uow.bookings.get_by_user(user_id, limit)

    @staticmethod
    def get_upcoming_bookings(uow: UnitOfWork, user_id: int, days_ahead: int = 7):
        return uow.bookings.get_user_upcoming_bookings(user_id, days_ahead)

    @staticmethod
    def get_past_bookings(uow: UnitOfWork, user_id: int, limit: int = 20):
        return uow.bookings.get_user_past_bookings(user_id, limit)