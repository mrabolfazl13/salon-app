from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
import secrets

from app.unit_of_work import UnitOfWork, get_unit_of_work
from app.schemas.payment import PaymentCreate, PaymentPayRequest, PaymentResponse
from app.models.booking import BookingStatus
from app.models.payment import BookingPayment, BookingPaymentStatus
from app.models.user import User
from app.utils.auth import get_current_user
from app.services.notification_service import notification_service

router = APIRouter(prefix="/payments", tags=["Payments"])


def _to_response(p: BookingPayment) -> PaymentResponse:
    return PaymentResponse(
        id=p.id,
        booking_id=p.booking_id,
        user_id=p.user_id,
        amount=p.amount,
        status=p.status.value if hasattr(p.status, "value") else str(p.status),
        gateway=p.gateway,
        authority=p.authority,
        transaction_id=p.transaction_id,
        card_pan=p.card_pan,
        created_at=p.created_at,
        paid_at=p.paid_at,
    )


def _normalize_digits(value: str) -> str:
    return "".join(
        ch for ch in value
        if ch.isdigit() or "۰" <= ch <= "۹" or "٠" <= ch <= "٩"
    ).translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789"))


@router.post("/", response_model=PaymentResponse, status_code=201)
def create_payment(
    data: PaymentCreate,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """ایجاد فاکتور پرداخت برای یک رزرو تأییدشده (در انتظار پرداخت کاربر)"""
    booking = uow.bookings.get_by_id(data.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="رزرو یافت نشد")
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="این رزرو متعلق به شما نیست")
    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(
            status_code=400,
            detail="فقط رزروهای تأییدشده قابل پرداخت هستند",
        )
    if uow.payments.has_paid_for_booking(booking.id):
        raise HTTPException(status_code=400, detail="این رزرو قبلاً پرداخت شده است")

    # اگر فاکتور معوق وجود داشته باشد، همان را برمی‌گردانیم
    existing = uow.payments.get_pending_for_booking(booking.id)
    if existing:
        return _to_response(existing)

    payment = BookingPayment(
        booking_id=booking.id,
        user_id=current_user.id,
        amount=booking.payment_amount,
        status=BookingPaymentStatus.PENDING,
        gateway="mock",
        authority=secrets.token_hex(16),
    )
    uow.payments.create(payment)
    uow.commit()
    return _to_response(payment)


@router.post("/{payment_id}/pay", response_model=PaymentResponse)
async def pay_payment(
    payment_id: int,
    data: PaymentPayRequest,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """شبیه‌سازی درگاه پرداخت — تأیید پرداخت با اطلاعات کارت"""
    payment = uow.payments.get_by_id(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="فاکتور یافت نشد")
    if payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="این فاکتور متعلق به شما نیست")
    if payment.status == BookingPaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="این فاکتور قبلاً پرداخت شده است")

    card = _normalize_digits(data.card_number)
    if len(card) != 16 or not card.isdigit():
        payment.status = BookingPaymentStatus.FAILED
        uow.payments.update(payment.id, {"status": payment.status})
        uow.commit()
        raise HTTPException(status_code=400, detail="شماره کارت نامعتبر است (۱۶ رقم)")

    # پرداخت موفق (شبیه‌سازی)
    from datetime import datetime, timezone
    transaction_id = secrets.token_hex(8).upper()
    payment.status = BookingPaymentStatus.PAID
    payment.transaction_id = transaction_id
    payment.card_pan = card[-4:]
    payment.paid_at = datetime.now(timezone.utc)
    uow.payments.update(payment.id, {
        "status": payment.status,
        "transaction_id": transaction_id,
        "card_pan": payment.card_pan,
        "paid_at": payment.paid_at,
    })

    # ثبت شناسه تراکنش روی رزرو
    booking = uow.bookings.get_by_id(payment.booking_id)
    if booking:
        uow.bookings.update(booking.id, {"payment_transaction_id": transaction_id})
    uow.commit()

    # اعلان‌ها
    slot = uow.slots.get_by_id(booking.slot_id) if booking else None
    venue = uow.venues.get_by_id(slot.venue_id) if slot else None
    venue_name = venue.name if venue else "نامشخص"
    date_str = str(slot.slot_date) if slot else ""
    time_str = str(slot.start_time) if slot else ""

    await notification_service.send_to_user(
        current_user.id,
        title="💳 پرداخت موفق",
        message=f"پرداخت رزرو {venue_name} برای تاریخ {date_str} ساعت {time_str} با موفقیت انجام شد.",
        data={"booking_id": payment.booking_id, "transaction_id": transaction_id},
        notif_type="payment",
    )
    if venue and venue.manager_id:
        await notification_service.send_to_user(
            venue.manager_id,
            title="💰 پرداخت رزرو انجام شد",
            message=f"کاربر {current_user.full_name} رزرو {venue_name} ({date_str} {time_str}) را پرداخت کرد.",
            data={"booking_id": payment.booking_id, "amount": payment.amount},
            notif_type="payment",
        )

    return _to_response(payment)


@router.get("/my", response_model=List[PaymentResponse])
def get_my_payments(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """تاریخچه پرداخت‌های کاربر جاری"""
    payments = uow.payments.get_by_user(current_user.id, limit=limit, offset=offset)
    return [_to_response(p) for p in payments]
