from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from datetime import date
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.schemas.booking import BookingCreate, BookingResponse, BookingDetailResponse, PendingBookingResponse
from app.services.booking_service import BookingService
from app.services.pending_booking_service import pending_booking_service
from app.utils.auth import get_current_user, get_current_manager
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
            data["slot_date"] = slot.slot_date
            data["start_time"] = slot.start_time
            data["duration"] = slot.duration
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
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager)
):
    """رزروهای در انتظار تأیید یک سالن - فقط مدیر همان سالن"""
    _check_venue_manager(uow, venue_id, current_user)
    records = pending_booking_service.list_by_venue(venue_id)
    return _enrich_pending(uow, records)


@router.post("/pending/{pending_id}/confirm", response_model=BookingResponse)
async def confirm_pending_booking(
    pending_id: str,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager)
):
    """تأیید رزرو معلق توسط مدیر سالن → ذخیره در دیتابیس"""
    pending = pending_booking_service.get(pending_id)
    if not pending:
        raise HTTPException(status_code=404, detail="Pending booking not found")
    _check_venue_manager(uow, pending["venue_id"], current_user)

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
    return booking


@router.post("/pending/{pending_id}/reject")
async def reject_pending_booking(
    pending_id: str,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager)
):
    """رد رزرو معلق توسط مدیر سالن → آزاد شدن سانس"""
    pending = pending_booking_service.get(pending_id)
    if not pending:
        raise HTTPException(status_code=404, detail="Pending booking not found")
    _check_venue_manager(uow, pending["venue_id"], current_user)

    pending_booking_service.remove(pending_id)
    slot = uow.slots.get_by_id(pending["slot_id"])
    if slot and slot.status == SlotStatus.BOOKED:
        uow.slots.update(slot.id, {"status": SlotStatus.AVAILABLE})
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
        uow.slots.update(slot.id, {"status": SlotStatus.AVAILABLE})
    uow.commit()

    await notification_service.notify_booking_cancelled(current_user.id, {})
    return {"message": "Pending booking cancelled"}


# ─────────────────────────── رزروهای قطعی (دیتابیس) ───────────────────────────

@router.post("/", response_model=PendingBookingResponse)
async def create_booking(
    booking_data: BookingCreate,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """ثبت رزرو — ابتدا در انتظار تأیید مدیر سالن قرار می‌گیرد (Redis)"""
    if current_user.role == UserRole.USER and not current_user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="برای رزرو، ابتدا ایمیل یا شماره موبایل خود را تایید کنید"
        )

    pending = BookingService.create_booking(uow, booking_data.slot_id, current_user.id)
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
        data["slot_date"] = slot.slot_date
        data["start_time"] = slot.start_time
        data["duration"] = slot.duration
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
            data["slot_date"] = slot.slot_date
            data["start_time"] = slot.start_time
            data["duration"] = slot.duration
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
    start_date: date = Query(None, description="تاریخ شروع"),
    end_date: date = Query(None, description="تاریخ پایان"),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager)
):
    """دریافت رزروهای قطعی یک سالن - فقط مدیر سالن"""
    _check_venue_manager(uow, venue_id, current_user)
    
    from datetime import date as dt_date
    if not start_date:
        start_date = dt_date.today()
    if not end_date:
        end_date = dt_date.today()
    
    return _enrich_bookings(uow, uow.bookings.get_by_venue(venue_id, start_date, end_date))

@router.get("/{booking_id}", response_model=BookingDetailResponse)
def get_booking_detail(
    booking_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """جزئیات یک رزرو + آخرین فاکتور پرداخت — مالک، مدیر سالن، یا سرپرست"""
    booking = uow.bookings.get_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
        # دسترسی مدیر سالن: سانس → سالن → manager_id
        slot = uow.slots.get_by_id(booking.slot_id)
        venue = uow.venues.get_by_id(slot.venue_id) if slot else None
        if not venue or venue.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

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
