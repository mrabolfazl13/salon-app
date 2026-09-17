from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import List
import json
from datetime import date
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.schemas.booking import BookingCreate, BookingResponse, BookingDetailResponse, PendingBookingResponse
from app.services.booking_service import BookingService
from app.services.pending_booking_service import pending_booking_service
from app.services.finance_service import FinanceService
from app.utils.auth import get_current_user, get_current_manager
from app.utils.permissions import Perm
from app.utils.staff_access import ensure_venue_permission
from app.utils.rate_limit import booking_rate_limit
from app.models.user import User, UserRole
from app.models.slot import SlotStatus
from app.services.notification_service import notification_service
from app.models.payment import BookingPaymentStatus

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def _check_venue_manager(uow: UnitOfWork, venue_id: int, current_user: User) -> "Venue":
    venue = uow.venues.get_by_id(venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    if venue.manager_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    return venue


def _venue_image_list(venue) -> list:
    """تصاویر سالن از JSON رشته‌ای به لیست اسامی/URLها"""
    import json
    if not venue or not getattr(venue, "images", None):
        return []
    raw = venue.images
    if isinstance(raw, list):
        return [str(x) for x in raw]
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, list) else []
    except (ValueError, TypeError):
        return []


def _enrich_pending(uow: UnitOfWork, records: list) -> list:
    """افزودن اطلاعات سانس و سالن به رزروهای معلق (Redis)"""
    if not records:
        return records

    slot_ids = [r["slot_id"] for r in records]
    slots = {s.id: s for s in uow.slots.get_by_ids(slot_ids)}
    venue_ids = list({s.venue_id for s in slots.values()})
    venues = {v.id: v for v in uow.venues.get_by_ids(venue_ids)} if venue_ids else {}

    enriched: List[PendingBookingResponse] = []
    for r in records:
        data = dict(r)
        slot = slots.get(r["slot_id"])
        if slot:
            venue = venues.get(slot.venue_id)
            data["venue_name"] = venue.name if venue else None
            data["venue_images"] = _venue_image_list(venue)
            data["slot_date"] = slot.slot_date
            data["start_time"] = slot.start_time
            data["duration"] = slot.duration
        if isinstance(data.get("pricing_breakdown"), str):
            data["pricing_breakdown"] = json.loads(data["pricing_breakdown"])
        enriched.append(PendingBookingResponse(**data))
    return enriched


# ─────────────────────────── رزروهای معلق (در انتظار تأیید) ───────────────────────────

@router.get("/pending/my", response_model=List[PendingBookingResponse])
def get_my_pending_bookings(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """رزروهای در انتظار تأیید کاربر فعلی"""
    records = pending_booking_service.list_by_user(current_user.id)
    return _enrich_pending(uow, records)


@router.get("/venue/{venue_id}/pending", response_model=List[PendingBookingResponse])
def get_venue_pending_bookings(
    venue_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """رزروهای در انتظار تأیید یک سالن — مالک سالن یا کارکنان با booking.pending_list"""
    ensure_venue_permission(uow, current_user, venue_id,
                            [Perm.BOOKING_PENDING_LIST], request)
    records = pending_booking_service.list_by_venue(venue_id)
    return _enrich_pending(uow, records)


@router.post("/pending/{pending_id}/confirm", response_model=BookingResponse)
async def confirm_pending_booking(
    pending_id: str,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """تأیید رزرو معلق — مدیر سالن یا کارکنان با booking.confirm → ذخیره در دیتابیس"""
    pending = pending_booking_service.get(pending_id)
    if not pending:
        raise HTTPException(status_code=404, detail="Pending booking not found")
    ensure_venue_permission(uow, current_user, pending["venue_id"],
                            [Perm.BOOKING_CONFIRM], request)

    booking = BookingService.confirm_pending(uow, pending)
    uow.commit()

    slot = uow.slots.get_by_id(pending["slot_id"])
    venue = uow.venues.get_by_id(pending["venue_id"])
    await notification_service.notify_booking_confirmed(
        pending["user_id"],
        {
            "venue_name": venue.name if venue else "Unknown",
            "date": str(slot.slot_date) if slot else "",
            "time": str(slot.start_time) if slot else "",
        }
    )
    # commit باعث expire شدن نمونه می‌شود؛ قبل از model_dump تازه‌سازی لازم است
    uow.session.refresh(booking)
    data = booking.model_dump()
    if isinstance(data.get("pricing_breakdown"), str):
        data["pricing_breakdown"] = json.loads(data["pricing_breakdown"])
    return BookingResponse(**data)


@router.post("/pending/{pending_id}/reject")
async def reject_pending_booking(
    pending_id: str,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """رد رزرو معلق — مدیر سالن یا کارکنان با booking.confirm → آزاد شدن سانس"""
    pending = pending_booking_service.get(pending_id)
    if not pending:
        raise HTTPException(status_code=404, detail="Pending booking not found")
    ensure_venue_permission(uow, current_user, pending["venue_id"],
                            [Perm.BOOKING_CONFIRM], request)

    pending_booking_service.remove(pending_id)
    slot = uow.slots.get_by_id(pending["slot_id"])
    if slot and slot.status == SlotStatus.BOOKED:
        # سانس قرارداد پس از رد شدن دوباره RESERVED می‌شود، نه AVAILABLE
        restore = SlotStatus.RESERVED if slot.is_contract_slot else SlotStatus.AVAILABLE
        uow.slots.update(slot.id, {"status": restore})
    BookingService.release_pending_promotions(uow, pending)
    uow.commit()

    venue = uow.venues.get_by_id(pending["venue_id"])
    await notification_service.notify_booking_rejected(pending["user_id"], {
        "venue_name": venue.name if venue else "Unknown",
    })
    return {"message": "Pending booking rejected"}


@router.delete("/pending/{pending_id}")
async def cancel_pending_booking(
    pending_id: str,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """لغو رزرو معلق توسط خود کاربر قبل از تأیید مدیر"""
    pending = pending_booking_service.get(pending_id)
    if not pending:
        raise HTTPException(status_code=404, detail="Pending booking not found")
    if pending["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not your booking")

    pending_booking_service.remove(pending_id)
    slot = uow.slots.get_by_id(pending["slot_id"])
    if slot and slot.status == SlotStatus.BOOKED:
        restore = SlotStatus.RESERVED if slot.is_contract_slot else SlotStatus.AVAILABLE
        uow.slots.update(slot.id, {"status": restore})
    BookingService.release_pending_promotions(uow, pending)
    uow.commit()

    await notification_service.notify_booking_cancelled(current_user.id, {})
    return {"message": "Pending booking cancelled"}


# ─────────────────────────── رزروهای قطعی (دیتابیس) ───────────────────────────

@router.post("/", response_model=PendingBookingResponse)
async def create_booking(
    booking_data: BookingCreate,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
    _rate_limit: None = Depends(booking_rate_limit),
):
    """ثبت رزرو — ابتدا در انتظار تأیید مدیر سالن قرار می‌گیرد (Redis)"""
    if current_user.role == UserRole.USER and not current_user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="برای رزرو، ابتدا ایمیل یا شماره موبایل خود را تایید کنید"
        )

    pending = BookingService.create_booking(
        uow, booking_data.slot_id, current_user.id,
        current_user=current_user,
        discount_code=booking_data.discount_code,
        use_loyalty_points=booking_data.use_loyalty_points,
    )
    uow.commit()

    slot = uow.slots.get_by_id(booking_data.slot_id)
    if slot:
        venue = uow.venues.get_by_id(slot.venue_id)
        if venue:
            await notification_service.notify_new_pending_booking(
                venue.manager_id,
                {"venue_name": venue.name, "date": str(slot.slot_date), "time": str(slot.start_time)}
            )

    # افزودن اطلاعات تکمیلی برای نمایش در فرانت‌اند
    slot = uow.slots.get_by_id(booking_data.slot_id)
    venue = uow.venues.get_by_id(slot.venue_id) if slot else None
    data = dict(pending)
    if slot:
        data["venue_name"] = venue.name if venue else None
        data["venue_images"] = _venue_image_list(venue)
        data["slot_date"] = slot.slot_date
        data["start_time"] = slot.start_time
        data["duration"] = slot.duration
    for k in ("discount_amount", "coupon_code", "loyalty_points_used", "pricing_breakdown"):
        if k in pending:
            data[k] = pending[k]
    if isinstance(data.get("pricing_breakdown"), str):
        data["pricing_breakdown"] = json.loads(data["pricing_breakdown"])
    return PendingBookingResponse(**data)

def _enrich_bookings(uow: UnitOfWork, bookings: list) -> list:
    """افزودن اطلاعات سانس و سالن به پاسخ‌های رزرو (بدون N+1)"""
    if not bookings:
        return bookings

    slot_ids = [b.slot_id for b in bookings]
    slots = {s.id: s for s in uow.slots.get_by_ids(slot_ids)}
    venue_ids = list({s.venue_id for s in slots.values()})
    venues = {v.id: v for v in uow.venues.get_by_ids(venue_ids)}

    enriched: List[BookingResponse] = []
    for b in bookings:
        data = b.model_dump()
        slot = slots.get(b.slot_id)
        if slot:
            venue = venues.get(slot.venue_id)
            data["venue_name"] = venue.name if venue else None
            data["venue_images"] = _venue_image_list(venue)
            data["slot_date"] = slot.slot_date
            data["start_time"] = slot.start_time
            data["duration"] = slot.duration
        if isinstance(data.get("pricing_breakdown"), str):
            data["pricing_breakdown"] = json.loads(data["pricing_breakdown"])
        enriched.append(BookingResponse(**data))
    return enriched


@router.get("/", response_model=List[BookingResponse])
def get_my_bookings(
    limit: int = 50,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    return _enrich_bookings(uow, BookingService.get_user_bookings(uow, current_user.id, limit))


# NOTE: مسیرهای ایستا باید قبل از /{booking_id} تعریف شوند تا با آن تداخل نکنند

@router.get("/upcoming", response_model=List[BookingResponse])
def get_upcoming_bookings(
    days_ahead: int = Query(7, ge=1, le=90, description="چند روز آینده"),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """رزروهای تأییدشده کاربر از امروز تا days_ahead روز آینده (مرتب بر اساس تاریخ)"""
    bookings = BookingService.get_upcoming_bookings(uow, current_user.id, days_ahead)
    return _enrich_bookings(uow, bookings)


@router.get("/past", response_model=List[BookingResponse])
def get_past_bookings(
    limit: int = Query(20, ge=1, le=100, description="حداکثر تعداد"),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """تاریخچه رزروهای تأییدشده کاربر (تاریخ‌های گذشته، جدیدترین اول)"""
    bookings = BookingService.get_past_bookings(uow, current_user.id, limit)
    return _enrich_bookings(uow, bookings)


@router.get("/venue/{venue_id}", response_model=List[BookingResponse])
def get_venue_bookings(
    venue_id: int,
    request: Request,
    start_date: date = Query(None, description="تاریخ شروع"),
    end_date: date = Query(None, description="تاریخ پایان"),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """دریافت رزروهای قطعی یک سالن — مدیر سالن یا کارکنان با booking.view"""
    ensure_venue_permission(uow, current_user, venue_id, [Perm.BOOKING_VIEW], request)
    
    from datetime import date as dt_date
    if not start_date:
        start_date = dt_date.today()
    if not end_date:
        end_date = dt_date.today()
    
    return _enrich_bookings(uow, uow.bookings.get_by_venue(venue_id, start_date, end_date))

@router.get("/{booking_id}", response_model=BookingDetailResponse)
def get_booking_detail(
    booking_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """جزئیات یک رزرو + آخرین فاکتور پرداخت — مالک، مدیر/کارکنان سالن (booking.view)، سرپرست"""
    booking = uow.bookings.get_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
        # دسترسی سلسله‌مراتبی: سانس → سالن → مالک/کارکنان با booking.view
        slot = uow.slots.get_by_id(booking.slot_id)
        if slot is None:
            raise HTTPException(status_code=403, detail="Access denied")
        ensure_venue_permission(uow, current_user, slot.venue_id,
                                [Perm.BOOKING_VIEW], request)

    data = _enrich_bookings(uow, [booking])[0].model_dump()
    payment = uow.payments.get_latest_for_booking(booking_id)
    data["payment"] = payment
    return BookingDetailResponse(**data)


@router.delete("/{booking_id}")
async def cancel_booking(
    booking_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    # قبل از لغو، پرداخت موفق را برای بازگشت وجه پیدا می‌کنیم
    paid_payment = uow.payments.get_paid_for_booking(booking_id)

    result = BookingService.cancel_booking(uow, booking_id, current_user.id)
    if not result:
        raise HTTPException(status_code=400, detail="Cannot cancel")

    # بازگشت وجه (شبیه‌سازی): فاکتور پرداختی به refunded تبدیل می‌شود
    refunded_amount = 0
    if paid_payment:
        uow.payments.update(paid_payment.id, {"status": BookingPaymentStatus.REFUNDED})
        refunded_amount = paid_payment.amount
        # دفتر کل: ردیف بازگشت وجه متناظر با پرداخت اولیه — ردیف اصلی دست‌نخورده
        paid_tx = uow.transactions.get_by_idempotency_key(f"booking-payment:{paid_payment.id}")
        slot = uow.slots.get_by_id(result.slot_id) if result and result.slot_id else None
        FinanceService.record_refund(
            uow,
            amount=refunded_amount,
            original_source_id=paid_payment.id,
            venue_id=slot.venue_id if slot else None,
            counterparty_user_id=paid_payment.user_id,
            description=f"بازگشت وجه لغو رزرو #{booking_id}",
            idempotency_key=f"booking-refund:{paid_payment.id}",
            created_by=current_user.id,
        )

    uow.commit()

    # اطلاعات سالن/سانس برای پیام اعلان
    slot = uow.slots.get_by_id(result.slot_id) if result.slot_id else None
    venue = uow.venues.get_by_id(slot.venue_id) if slot else None
    venue_name = venue.name if venue else "نامشخص"
    date_str = str(slot.slot_date) if slot else ""
    time_str = str(slot.start_time) if slot else ""

    await notification_service.notify_booking_cancelled(current_user.id, {
        "booking_id": booking_id, "venue_name": venue_name,
    })

    if paid_payment:
        await notification_service.send_to_user(
            current_user.id,
            title="↩️ بازگشت وجه انجام شد",
            message=f"مبلغ {refunded_amount:,} تومان بابت لغو رزرو {venue_name} "
                    f"({date_str} {time_str}) به حساب شما بازگردانده شد.",
            data={"booking_id": booking_id, "amount": refunded_amount,
                  "payment_id": paid_payment.id},
            notif_type="payment",
        )
        if venue and venue.manager_id:
            await notification_service.send_to_user(
                venue.manager_id,
                title="⚠️ لغو رزرو پرداختی",
                message=f"کاربر {current_user.full_name} رزرو پرداختی {venue_name} "
                        f"({date_str} {time_str}) را لغو کرد. مبلغ {refunded_amount:,} تومان بازگشت داده شد.",
                data={"booking_id": booking_id, "amount": refunded_amount},
                notif_type="payment",
            )

    return {"message": "Booking cancelled", "refunded": bool(paid_payment),
            "refunded_amount": refunded_amount}
