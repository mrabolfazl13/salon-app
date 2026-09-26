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
    for _f in ("receipt_amount", "receipt_reference", "receipt_bank",
               "receipt_image", "receipt_submitted_at", "receipt_reviewed_at",
               "receipt_review_note", "receipt_reviewed_by"):
        data[_f] = getattr(booking, _f, None)
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

    # Notify first person in waitlist if slot became available
    if result.slot_id:
        from app.tasks.reminder_tasks import notify_waitlist_on_cancellation
        notify_waitlist_on_cancellation.delay(result.slot_id)

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

    ref_slot = uow.slots.get_by_id(result.slot_id) if result and result.slot_id else None
    ref_user = (uow.bookings.get_by_id(booking_id) or None)
    for _tpl, _lbl in (("booking-receipt:{id}", "فیش واریزی"), ("booking-inperson:{id}", "در محل")):
        _orig = uow.transactions.get_by_idempotency_key(_tpl.format(id=booking_id))
        if _orig and _orig.status not in ("voided",):
            FinanceService.record_refund(uow, amount=_orig.amount, original_source_id=_orig.id,
                venue_id=ref_slot.venue_id if ref_slot else None,
                counterparty_user_id=ref_user.user_id if ref_user else None,
                description=f"بازگشت وجه لغو رزرو #{booking_id} ({_lbl})",
                idempotency_key=f"booking-refund:{_orig.id}", created_by=current_user.id)

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


# فیش واریزی / پرداخت در محل
from datetime import datetime as _dt, timezone as _tza
from typing import Optional as _Opt
from pydantic import BaseModel as _BM, Field as _F
from app.models.booking import Booking as _BK, BookingStatus as _BS, ReceiptStatus as _RS
from app.models.venue import VenuePaymentMode as _PM
from app.models.transaction import TransactionMethod as _TM, TransactionSourceType as _TS

class _ReceiptBody(_BM):
    amount: int = _F(gt=0); image_url: str
    reference_number: _Opt[str] = _F(default=None, max_length=120)
    bank_name: _Opt[str] = _F(default=None, max_length=100)
class _RejectBody(_BM):
    reason: str = _F(min_length=4, max_length=500)
class _InPersonBody(_BM):
    amount: _Opt[int] = _F(default=None, gt=0)
    method: _TM = _TM.CASH

def _bk_paid(uow, bid):
    return uow.payments.has_paid_for_booking(bid) or uow.transactions.get_by_idempotency_key(f"booking-receipt:{bid}") is not None or uow.transactions.get_by_idempotency_key(f"booking-inperson:{bid}") is not None
def _load_bk(uow, bid):
    b = uow.bookings.get_by_id(bid)
    if not b: raise HTTPException(status_code=404, detail="رزرو یافت نشد")
    return b

@router.post("/{booking_id}/receipt", status_code=201)
async def submit_booking_receipt(booking_id: int, data: _ReceiptBody, uow: UnitOfWork = Depends(get_unit_of_work), current_user: User = Depends(get_current_user)):
    bk = _load_bk(uow, booking_id)
    if bk.user_id != current_user.id: raise HTTPException(status_code=403, detail="این رزرو متعلق به شما نیست")
    if bk.payment_mode != _PM.BANK_RECEIPT: raise HTTPException(status_code=400, detail="این رزرو از روش فیش واریزی استفاده نمی‌کند")
    if _bk_paid(uow, booking_id): raise HTTPException(status_code=400, detail="این رزرو قبلا پیشرفته است")
    uow.bookings.update(bk.id, {
        "needs_receipt": True, "receipt_status": _RS.SUBMITTED,
        "receipt_amount": data.amount, "receipt_reference": data.reference_number,
        "receipt_bank": data.bank_name, "receipt_image": data.image_url,
        "receipt_submitted_at": _dt.now(_tza.utc),
        "receipt_review_note": None, "receipt_reviewed_at": None, "receipt_reviewed_by": None})
    uow.commit()
    slot = uow.slots.get_by_id(bk.slot_id); venue = uow.venues.get_by_id(slot.venue_id) if slot else None
    if venue and venue.manager_id:
        await notification_service.send_to_user(venue.manager_id,
            title="📎 فیش واریزی رزرو ثبت شد",
            message=f"کاربر {current_user.full_name or ''} فیش واریزی رزرو {venue.name} ({slot.slot_date if slot else ''} {slot.start_time if slot else ''}) به مبلغ {data.amount:,} تومان را ارسال کرد.",
            data={"booking_id": booking_id, "amount": data.amount}, notif_type="booking_receipt_submitted")
    return {"message": "رسید ثبت شد و در انتظار بررسی مدیر سالن است", "receipt_status": "submitted"}

@router.post("/{booking_id}/receipt/approve")
async def approve_booking_receipt(booking_id: int, request: Request, uow: UnitOfWork = Depends(get_unit_of_work), current_user: User = Depends(get_current_user)):
    bk = _load_bk(uow, booking_id)
    slot = uow.slots.get_by_id(bk.slot_id)
    venue = ensure_venue_permission(uow, current_user, slot.venue_id, [Perm.FINANCE_RECORD_PAYMENT], request, denial_action="booking.receipt.approve")
    if bk.receipt_status != _RS.SUBMITTED: raise HTTPException(status_code=400, detail="رسید این رزرو ارسال نشده است")
    if _bk_paid(uow, booking_id): raise HTTPException(status_code=400, detail="این رزرو قبلا پیشرفته است")
    amount = bk.payment_amount or bk.receipt_amount or 0
    FinanceService.record_income(uow, amount=amount, source_type=_TS.BOOKING, source_id=bk.id,
        venue_id=venue.id, counterparty_user_id=bk.user_id, method=_TM.CARD_TO_CARD,
        description=f"تایید فیش واریزی رزرو #{bk.id}", idempotency_key=f"booking-receipt:{bk.id}", created_by=current_user.id)
    uow.bookings.update(bk.id, {
        "receipt_status": _RS.APPROVED, "receipt_review_note": "تایید شد",
        "receipt_reviewed_at": _dt.now(_tza.utc), "receipt_reviewed_by": current_user.id,
        "status": _BS.CONFIRMED, "payment_amount": bk.payment_amount or amount,
        "payment_transaction_id": bk.receipt_reference or f"receipt-{bk.id}"})
    uow.commit()
    await notification_service.send_to_user(bk.user_id, title="✅ فیش واریزی شما تایید شد",
        message=f"رسید رزرو {venue.name if venue else 'نامشخص'} ({slot.slot_date if slot else ''} {slot.start_time if slot else ''}) تایید شد و رزرو شما فعال است.",
        data={"booking_id": booking_id, "amount": amount}, notif_type="booking_receipt_approved")
    return {"message": "رسید تایید و رزرو فعال شد", "receipt_status": "approved", "amount": amount}

@router.post("/{booking_id}/receipt/reject")
async def reject_booking_receipt(booking_id: int, data: _RejectBody, request: Request, uow: UnitOfWork = Depends(get_unit_of_work), current_user: User = Depends(get_current_user)):
    bk = _load_bk(uow, booking_id)
    slot = uow.slots.get_by_id(bk.slot_id)
    venue = ensure_venue_permission(uow, current_user, slot.venue_id, [Perm.FINANCE_RECORD_PAYMENT], request, denial_action="booking.receipt.reject")
    if bk.receipt_status != _RS.SUBMITTED: raise HTTPException(status_code=400, detail="رسید این رزرو ارسال نشده است")
    uow.bookings.update(bk.id, {
        "receipt_status": _RS.REJECTED, "receipt_review_note": data.reason,
        "receipt_reviewed_at": _dt.now(_tza.utc), "receipt_reviewed_by": current_user.id})
    uow.commit()
    await notification_service.send_to_user(bk.user_id, title="⚠️ فیش واریزی رد شد",
        message=f"رسید رزرو {venue.name if venue else 'نامشخص'} ({slot.slot_date if slot else ''}) رد شد: {data.reason} — می‌توانید فیش جدیدی ارسال کنید.",
        data={"booking_id": booking_id, "reason": data.reason}, notif_type="booking_receipt_rejected")
    return {"message": "رسید رد شد؛ کاربر می‌تواند دوباره ارسال کند", "receipt_status": "rejected"}

@router.post("/{booking_id}/collect-in-person")
async def collect_payment_in_person(booking_id: int, data: _InPersonBody, request: Request, uow: UnitOfWork = Depends(get_unit_of_work), current_user: User = Depends(get_current_user)):
    bk = _load_bk(uow, booking_id)
    slot = uow.slots.get_by_id(bk.slot_id)
    venue = ensure_venue_permission(uow, current_user, slot.venue_id, [Perm.FINANCE_RECORD_PAYMENT, Perm.BOOKING_CONFIRM], request, denial_action="booking.receipt.inperson")
    if bk.payment_mode != _PM.PAY_IN_PLACE: raise HTTPException(status_code=400, detail="روش پرداخت این رزرو در محل نیست")
    if _bk_paid(uow, booking_id): raise HTTPException(status_code=400, detail="این رزرو قبلا پیشرفته است")
    amount = data.amount or bk.payment_amount
    FinanceService.record_income(uow, amount=amount, source_type=_TS.BOOKING, source_id=bk.id,
        venue_id=venue.id, counterparty_user_id=bk.user_id, method=data.method,
        description=f"دریافت وجه در محل رزرو #{bk.id}", idempotency_key=f"booking-inperson:{bk.id}", created_by=current_user.id)
    uow.bookings.update(bk.id, {"payment_transaction_id": f"inplace-{bk.id}", "payment_amount": bk.payment_amount or amount, "status": _BS.CONFIRMED})
    uow.commit()
    await notification_service.send_to_user(bk.user_id, title="✅ پرداخت شما در محل ثبت شد",
        message=f"مبلغ {amount:,} تومان بابت رزرو {venue.name if venue else 'نامشخص'} ({slot.slot_date if slot else ''} {slot.start_time if slot else ''}) در محل دریافت شد.",
        data={"booking_id": booking_id, "amount": amount}, notif_type="booking_paid_in_person")
    return {"message": "پرداخت در محل ثبت شد", "amount": amount}
