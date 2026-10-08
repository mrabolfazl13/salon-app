# Payment Gateway Integration Plan

**Priority:** P0 (Critical)  
**Status:** Framework Ready - Implementation Pending  
**Date:** 2026-10-09

---

## Current State

### Problem
- Line 73 in `backend/app/api/v1/payments.py`: `gateway="mock"` 
- No real payment processing
- No webhook for payment verification
- Refund flow broken (fixed in previous commit)

### What's Done ✅
- Payment gateway abstraction layer created (`app/services/payment_gateway.py`)
- ZarinPal integration implemented
- NextPay integration implemented (fallback option)
- Error handling and logging in place

---

## Implementation Steps

### Step 1: Configure Environment Variables

Add to `.env` or GitHub Secrets:

```bash
# ZarinPal Configuration
ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ZARINPAL_SANDBOX=true  # Set to false in production

# Payment Callback URL
PAYMENT_CALLBACK_URL=https://yourdomain.com/api/v1/payments/webhook/zarinpal
```

### Step 2: Update create_payment Endpoint

Replace mock gateway with real one:

```python
@router.post("/", response_model=PaymentResponse, status_code=201)
async def create_payment(
    data: PaymentCreate,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    # ... existing validation code ...
    
    # Get payment gateway
    gateway = get_payment_gateway()
    
    if gateway:
        # Real gateway mode
        callback_url = f"{settings.FRONTEND_URL}/payment/callback?payment_id={{payment_id}}"
        
        result = await gateway.create_payment_request(
            amount=booking.payment_amount,
            description=f"پرداخت رزرو #{booking.id}",
            callback_url=callback_url,
            mobile=current_user.phone,
        )
        
        payment = BookingPayment(
            booking_id=booking.id,
            user_id=current_user.id,
            amount=booking.payment_amount,
            status=BookingPaymentStatus.PENDING,
            gateway="zarinpal",
            authority=result["authority"],
        )
    else:
        # Mock mode (development fallback)
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
    
    response = _to_response(payment)
    if gateway:
        response.payment_url = result["payment_url"]
    
    return response
```

### Step 3: Add Webhook Endpoint

Add to `backend/app/api/v1/payments.py`:

```python
@router.post("/webhook/zarinpal")
async def zarinpal_webhook(
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
):
    """Handle ZarinPal payment callback.
    
    ZarinPal sends:
    - Authority: The payment authority code
    - Status: OK or NOK
    """
    data = await request.json()
    authority = data.get("Authority")
    status = data.get("Status")
    
    if status != "OK":
        logger.warning(f"Payment failed for authority {authority}")
        return {"status": "failed"}
    
    # Find payment by authority
    payment = uow.payments.get_by_authority(authority)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Verify with gateway
    gateway = get_payment_gateway()
    try:
        verification = await gateway.verify_payment(
            authority=authority,
            amount=payment.amount,
        )
        
        # Update payment
        payment.status = BookingPaymentStatus.PAID
        payment.transaction_id = verification["ref_id"]
        payment.card_pan = verification["card_pan"][-4:]
        payment.paid_at = datetime.now(timezone.utc)
        
        uow.payments.update(payment.id, {
            "status": payment.status,
            "transaction_id": verification["ref_id"],
            "card_pan": payment.card_pan,
            "paid_at": payment.paid_at,
        })
        
        # Record in ledger
        booking = uow.bookings.get_by_id(payment.booking_id)
        slot = uow.slots.get_by_id(booking.slot_id) if booking else None
        
        FinanceService.record_income(
            uow,
            amount=payment.amount,
            source_type=TransactionSourceType.BOOKING_PAYMENT,
            source_id=payment.id,
            venue_id=slot.venue_id if slot else None,
            counterparty_user_id=payment.user_id,
            method=TransactionMethod.GATEWAY,
            description=f"پرداخت رزرو #{payment.booking_id} (ZarinPal)",
            idempotency_key=f"booking-payment:{payment.id}",
            created_by=payment.user_id,
        )
        
        uow.commit()
        
        # Send notifications
        await notification_service.send_to_user(
            payment.user_id,
            title="💳 پرداخت موفق",
            message=f"پرداخت شما با موفقیت انجام شد. کد پیگیری: {verification['ref_id']}",
            data={"payment_id": payment.id, "transaction_id": verification["ref_id"]},
            notif_type="payment",
        )
        
        return {"status": "success", "ref_id": verification["ref_id"]}
    
    except PaymentGatewayError as e:
        logger.error(f"Webhook verification failed: {e}")
        payment.status = BookingPaymentStatus.FAILED
        uow.payments.update(payment.id, {"status": payment.status})
        uow.commit()
        
        return {"status": "failed", "error": str(e)}
```

### Step 4: Update Payment Schema

Add `payment_url` field to `PaymentResponse`:

```python
# backend/app/schemas/payment.py
class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    user_id: int
    amount: int
    status: str
    gateway: str
    authority: Optional[str]
    transaction_id: Optional[str]
    card_pan: Optional[str]
    payment_url: Optional[str] = None  # NEW FIELD
    created_at: datetime
    paid_at: Optional[datetime]
    
    class Config:
        from_attributes = True
```

### Step 5: Frontend Integration

Update frontend to redirect to payment URL:

```typescript
// frontend/src/services/payment.ts
export const paymentService = {
  create: async (data: PaymentCreate): Promise<PaymentResponse & { payment_url?: string }> => {
    const response = await apiClient.post('/payments/', data)
    return response.data
  },
}

// In payment flow component
const handlePayment = async () => {
  const payment = await paymentService.create({ booking_id: bookingId })
  
  if (payment.payment_url) {
    // Redirect to ZarinPal
    window.location.href = payment.payment_url
  }
}
```

---

## Testing Checklist

- [ ] Sandbox payment creation works
- [ ] Webhook receives and processes callbacks
- [ ] Payment status updates correctly
- [ ] Ledger entry created for successful payments
- [ ] Notifications sent to user and manager
- [ ] Failed payments handled gracefully
- [ ] Idempotency prevents duplicate entries
- [ ] Production mode with real merchant ID tested

---

## Security Considerations

1. **Webhook Verification**: Always verify with gateway API, don't trust callback data
2. **Amount Validation**: Ensure callback amount matches original payment amount
3. **Idempotency**: Use payment ID as idempotency key to prevent duplicates
4. **HTTPS Only**: Webhook endpoint must be HTTPS in production
5. **Secret Validation**: Optionally validate webhook signature from gateway

---

## Migration Path

1. **Week 1**: Test in ZarinPal sandbox with test cards
2. **Week 2**: Deploy to staging with sandbox merchant ID
3. **Week 3**: Switch to production merchant ID, monitor first real transactions
4. **Week 4**: Enable refund flow using verified payment records

---

## Estimated Effort

- Backend implementation: 2 hours
- Frontend integration: 1 hour
- Testing: 2 hours
- **Total: 5 hours**

---

**Next Action:** Obtain ZarinPal merchant ID from https://zarinpal.com and configure environment variables.
