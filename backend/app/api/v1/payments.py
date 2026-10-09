from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import List
import secrets
from datetime import datetime, timezone
import logging

from app.unit_of_work import UnitOfWork, get_unit_of_work
from app.schemas.payment import PaymentCreate, PaymentPayRequest, PaymentResponse
from app.models.booking import BookingStatus
from app.models.payment import BookingPayment, BookingPaymentStatus
from app.models.user import User
from app.models.transaction import TransactionMethod, TransactionSourceType
from app.services.finance_service import FinanceService
from app.utils.auth import get_current_user
from app.utils.rate_limit import payment_rate_limit
from app.services.notification_service import notification_service
from app.services.payment_gateway import get_payment_gateway, PaymentGatewayError, ZarinPalGateway
from app.config import settings

logger = logging.getLogger(__name__)

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
    _rate_limit: None = Depends(payment_rate_limit),
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
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
    _rate_limit: None = Depends(payment_rate_limit),
):
    """اتصال به درگاه واقعی (ZarinPal/NextPay) و شروع فرآیند پرداخت"""
    payment = uow.payments.get_by_id(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="فاکتور یافت نشد")
    if payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="این فاکتور متعلق به شما نیست")
    if payment.status == BookingPaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="این فاکتور قبلاً پرداخت شده است")
    
    # دریافت درگاه پیکربندی‌شده
    gateway = get_payment_gateway()
    
    # اگر درگاه پیکربندی نشده، از mock استفاده کن
    if gateway is None:
        # Mock mode for development
        booking = uow.bookings.get_by_id(payment.booking_id)
        uow.payments.update(payment.id, {
            "status": BookingPaymentStatus.PAID,
            "transaction_id": f"mock-{secrets.token_hex(8)}",
            "card_pan": "**** **** **** 1234",
            "paid_at": datetime.now(timezone.utc),
        })
        booking.status = BookingStatus.CONFIRMED
        uow.commit()
        
        # ارسال اعلان پرداخت موفق
        venue = uow.venues.get_by_id(booking.venue_id)
        notification_service.send_to_user(
            current_user.id,
            title="پرداخت موفق",
            message=f"پرداخت بابت رزرو سالن {venue.name} با موفقیت انجام شد.",
            data={"booking_id": booking.id, "amount": payment.amount},
        )
        
        return _to_response(payment)
    
    # حالت واقعی: ایجاد درخواست پرداخت در درگاه
    try:
        callback_url = str(request.base_url).rstrip("/") + f"/api/v1/payments/{payment_id}/callback"
        
        result = await gateway.create_payment_request(
            amount=payment.amount,
            description=f"پرداخت رزرو #{payment.booking_id}",
            callback_url=callback_url,
            mobile=current_user.phone,
        )
        
        # ذخیره authority و به‌روزرسانی وضعیت
        uow.payments.update(payment.id, {
            "authority": result["authority"],
            "gateway": "zarinpal" if isinstance(gateway, ZarinPalGateway) else "nextpay",
        })
        uow.commit()
        
        # بازگشت URL برای ریدایرکت کاربر به درگاه
        return {
            **_to_response(payment),
            "payment_url": result["payment_url"],
        }
        
    except PaymentGatewayError as e:
        raise HTTPException(status_code=502, detail=f"خطا در اتصال به درگاه: {str(e)}")


@router.post("/{payment_id}/callback")
async def payment_callback(
    payment_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """Webhook callback from payment gateway to verify payment completion."""
    payment = uow.payments.get_by_id(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="فاکتور یافت نشد")
    
    if payment.status == BookingPaymentStatus.PAID:
        # Idempotency: already processed
        return {"status": "already_paid"}
    
    # Parse callback data
    try:
        body = await request.json()
    except Exception:
        body = {}
    
    # Get query parameters (for ZarinPal style callbacks)
    query_params = dict(request.query_params)
    
    # Merge both sources
    callback_data = {**body, **query_params}
    
    authority = callback_data.get("Authority") or callback_data.get("authority") or payment.authority
    status = callback_data.get("Status") or callback_data.get("status")
    
    # Verify with gateway
    gateway = get_payment_gateway()
    if gateway is None:
        raise HTTPException(status_code=500, detail="درگاه پیکربندی نشده")
    
    try:
        # Verify payment amount matches
        verification = await gateway.verify_payment(
            authority=authority,
            amount=payment.amount,
        )
        
        # Payment successful - update records
        booking = uow.bookings.get_by_id(payment.booking_id)
        slot = uow.slots.get_by_id(booking.slot_id) if booking else None
        
        uow.payments.update(payment.id, {
            "status": BookingPaymentStatus.PAID,
            "transaction_id": verification.get("ref_id", f"gateway-{secrets.token_hex(8)}"),
            "card_pan": verification.get("card_pan", ""),
            "paid_at": datetime.now(timezone.utc),
        })
        
        if booking:
            booking.status = BookingStatus.CONFIRMED
        
        # دفتر کل: ثبت درآمد با idempotency
        FinanceService.record_income(
            uow,
            amount=payment.amount,
            source_type=TransactionSourceType.BOOKING_PAYMENT,
            source_id=payment.id,
            venue_id=slot.venue_id if slot else None,
            counterparty_user_id=payment.user_id,
            method=TransactionMethod.GATEWAY,
            description=f"پرداخت رزرو #{payment.booking_id} (webhook)",
            idempotency_key=f"booking-payment:{payment.id}",
            created_by=payment.user_id,
        )
        
        uow.commit()
        
        # اعلان‌ها
        venue = uow.venues.get_by_id(slot.venue_id) if slot else None
        venue_name = venue.name if venue else "نامشخص"
        date_str = str(slot.slot_date) if slot else ""
        time_str = str(slot.start_time) if slot else ""
        
        user = uow.users.get_by_id(payment.user_id)
        await notification_service.send_to_user(
            payment.user_id,
            title="💳 پرداخت موفق",
            message=f"پرداخت رزرو {venue_name} برای تاریخ {date_str} ساعت {time_str} با موفقیت انجام شد.",
            data={"booking_id": payment.booking_id, "transaction_id": payment.transaction_id},
            notif_type="payment",
        )
        
        if venue and venue.manager_id:
            await notification_service.send_to_user(
                venue.manager_id,
                title="💰 پرداخت رزرو انجام شد",
                message=f"کاربر {user.full_name if user else 'نامشخص'} رزرو {venue_name} ({date_str} {time_str}) را پرداخت کرد.",
                data={"booking_id": payment.booking_id, "amount": payment.amount},
                notif_type="payment",
            )
        
        return {"status": "success", "payment_id": payment_id}
        
    except PaymentGatewayError as e:
        # Payment failed
        uow.payments.update(payment.id, {
            "status": BookingPaymentStatus.FAILED,
        })
        uow.commit()
        logger.error(f"Payment verification failed for {payment_id}: {e}")
        return {"status": "failed", "error": str(e)}


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


@router.post("/{payment_id}/refund")
async def refund_payment(
    payment_id: int,
    reason: str = Query(..., min_length=4, max_length=500),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """بازگشت وجه از طریق درگاه (فقط برای مدیران سالن یا ادمین)"""
    payment = uow.payments.get_by_id(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="فاکتور یافت نشد")
    
    if payment.status != BookingPaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="فقط پرداخت‌های موفق قابل بازگشت هستند")
    
    # بررسی دسترسی: فقط مدیر همان سالن یا سوپرادمین
    booking = uow.bookings.get_by_id(payment.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="رزرو یافت نشد")
    
    slot = uow.slots.get_by_id(booking.slot_id)
    venue = uow.venues.get_by_id(slot.venue_id) if slot else None
    
    is_authorized = (
        current_user.role.value == "super_admin" or
        (current_user.role.value == "club_admin" and venue and venue.manager_id == current_user.id)
    )
    
    if not is_authorized:
        raise HTTPException(status_code=403, detail="شما مجوز بازگشت وجه این رزرو را ندارید")
    
    # تلاش برای بازگشت وجه از طریق درگاه
    gateway = get_payment_gateway()
    refunded_via_gateway = False
    
    if gateway and payment.transaction_id:
        try:
            # ZarinPal refund API
            if isinstance(gateway, ZarinPalGateway):
                await gateway.refund_payment(
                    authority=payment.authority,
                    amount=payment.amount,
                    description=f"بازگشت وجه: {reason}",
                )
                refunded_via_gateway = True
        except PaymentGatewayError as e:
            logger.warning(f"Gateway refund failed for {payment_id}, proceeding with local refund: {e}")
            # Continue with local refund even if gateway fails
    
    # ثبت بازگشت وجه محلی
    uow.payments.update(payment.id, {"status": BookingPaymentStatus.REFUNDED})
    
    FinanceService.record_refund(
        uow,
        amount=payment.amount,
        original_source_id=payment.id,
        venue_id=slot.venue_id if slot else None,
        counterparty_user_id=payment.user_id,
        description=f"بازگشت وجه: {reason}" + (" (gateway)" if refunded_via_gateway else ""),
        idempotency_key=f"booking-refund:{payment.id}",
        created_by=current_user.id,
    )
    
    uow.commit()
    
    # اعلان به کاربر
    user = uow.users.get_by_id(payment.user_id)
    await notification_service.send_to_user(
        payment.user_id,
        title="↩️ بازگشت وجه انجام شد",
        message=f"مبلغ {payment.amount:,} تومان بابت رزرو #{booking.id} بازگشت داده شد.",
        data={"payment_id": payment_id, "amount": payment.amount, "reason": reason},
        notif_type="payment",
    )
    
    return {
        "status": "refunded",
        "payment_id": payment_id,
        "amount": payment.amount,
        "via_gateway": refunded_via_gateway,
    }
