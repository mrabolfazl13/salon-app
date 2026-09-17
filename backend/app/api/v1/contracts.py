# backend/app/api/v1/contracts.py
"""API قراردادها — چرخه عمر کامل: درخواست(PENDING) → تأیید/رد → اقساط → قواعد سانس.

سطوح دسترسی:
- کاربر: ساخت/مشاهده/لغو قرارداد خودش + پرداخت اقساط + درخواست لغو سانس
- مدیر (مالک venue یا super_admin): صف تأیید، تأیید/رد، استثناء/جابه‌جایی سانس،
  جابه‌جایی کل قرارداد، ابطال قسط، مشاهده/ممیزی قرارداد سالن‌هایش
مالکیت با الگوی _check_venue_manager در bookings.py؛ دسترسی بین‌سالنی ۴۰۳.
مسیرهای ایستا (/manager/...) قبل از /{contract_id} تعریف می‌شوند.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import List, Optional

from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.schemas.contract import (
    ContractCreate, ContractResponse,
    ContractApprove, ContractReject, ContractCancel,
    ContractSessionExclude, ContractSessionCancel, ContractSessionReschedule,
    ContractMoveWhole, ContractPaymentPay, ContractPaymentVoid,
)
from app.services.contract_service import ContractService
from app.services.notification_service import notification_service
from app.utils.auth import get_current_user, get_current_manager
from app.utils.permissions import Perm
from app.utils.staff_access import (
    ensure_venue_permission, log_security_event, manager_or_staff_venue_ids,
)
from app.utils.rate_limit import payment_rate_limit
from app.models.contract import Contract, ContractStatus
from app.models.user import User, UserRole
from app.models.venue import Venue
from sqlmodel import select

router = APIRouter(prefix="/contracts", tags=["Contracts"])


# ─────────────────────────── کمکى دسترسی ───────────────────────────

def _load_contract_or_404(uow: UnitOfWork, contract_id: int) -> Contract:
    contract = uow.contracts.get_by_id(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="قرارداد یافت نشد")
    return contract


def _check_venue_manager(uow: UnitOfWork, venue_id: int, current_user: User,
                         codes: List[str], request: Request = None) -> Venue:
    """RBAC wave: manager or staff with codes — pass-through for owner/super_admin."""
    return ensure_venue_permission(uow, current_user, venue_id, codes, request)


def _ensure_owner_or_manager(uow: UnitOfWork, contract: Contract, user: User,
                             request: Request = None,
                             manager_codes: Optional[List[str]] = None) -> None:
    """Owner/supervisor; manager side of venue by code (default contract.view)."""
    manager_codes = manager_codes or [Perm.CONTRACT_VIEW]
    if user.role == UserRole.SUPER_ADMIN or contract.user_id == user.id:
        return
    try:
        ensure_venue_permission(uow, user, contract.venue_id, manager_codes, request)
    except HTTPException as e:
        if e.status_code == 404:
            # contract is linked to venue that does not exist — equivalent to access denied
            raise HTTPException(status_code=403, detail="دسترسی به این قرارداد مجاز نیست")
        raise


def _manager_venue_ids(uow: UnitOfWork, user: User) -> Optional[List[int]]:
    """None یعنی بدون فیلتر (super_admin). USER: staff venues with contract.view."""
    return manager_or_staff_venue_ids(uow, user, [Perm.CONTRACT_VIEW])


# ─────────────────────────── اعلان مشترك ───────────────────────────

async def _notify_parties(uow: UnitOfWork, contract: Contract, title: str, message: str,
                          notif_type: str, also_manager_room: bool = False):
    """اعلان به هر دو طرف: مالک قرارداد + مدیر سالن (الگوی pending bookings)."""
    venue = uow.venues.get_by_id(contract.venue_id)
    payload = {"contract_id": contract.id, "venue_name": venue.name if venue else None}
    await notification_service.send_to_user(contract.user_id, title, message, payload,
                                            notif_type=notif_type)
    if venue and venue.manager_id and venue.manager_id != contract.user_id:
        await notification_service.send_to_user(venue.manager_id, title, message, payload,
                                                notif_type=notif_type)
    if also_manager_room:
        await notification_service.send_to_managers(title, message, payload,
                                                    notif_type=notif_type)
# ─────────────────────────── درخواست (کاربر) ───────────────────────────

@router.post("/", response_model=ContractResponse)
async def create_contract(
    contract_data: ContractCreate,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """ثبت درخواست جدید قرارداد — وضعیت PENDING؛ سانس‌ها از همین لحظه RESERVED."""
    service = ContractService(uow)
    contract = service.create_contract(contract_data, current_user.id)
    venue = uow.venues.get_by_id(contract.venue_id)
    uow.commit()

    await notification_service.notify_contract_created(current_user.id, {
        "contract_id": contract.id,
        "venue_name": venue.name if venue else "نامشخص",
        "total_amount": contract.total_amount,
        "sessions": len(service.uow.contract_slots.get_by_contract(contract.id)),
    })
    if venue and venue.manager_id:
        await notification_service.notify_contract_pending_review(venue.manager_id, {
            "contract_id": contract.id,
            "venue_name": venue.name,
            "requested_by": current_user.full_name,
            "price_per_session": contract.discounted_price,
            "start_date": str(contract.start_date),
            "end_date": str(contract.end_date),
        })
    return contract


@router.get("/", response_model=List[ContractResponse])
def get_my_contracts(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """قراردادهای خودِ کاربر (مالکیت؛ لیست کاربر عادی فقط خودش را می‌بیند)."""
    contracts = uow.contracts.get_all(user_id=current_user.id, limit=limit, offset=offset,
                                      order_by="created_at", order_desc=True)
    if status:
        contracts = [c for c in contracts if c.status.value == status]
    return contracts


# ─────────────────────────── پنل مدیر (مسیرهای ایستا — قبل از /{contract_id}) ───────────────────────────

@router.get("/manager/pending")
def manager_pending_contracts(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """درخواست‌های PENDING سالن‌های مدیر — با اطلاعات سالن/کاربر/سانس."""
    venue_ids = _manager_venue_ids(uow, current_user)
    if venue_ids is not None and not venue_ids:
        return []
    contracts = uow.contracts.get_pending_for_venues(venue_ids if venue_ids is not None else
                                                     list(uow.session.exec(select(Venue.id)).all()))
    service = ContractService(uow)
    return service.manager_rows(contracts)


@router.get("/manager/all")
def manager_all_contracts(
    request: Request,
    status: Optional[str] = Query(None, description="pending|active|rejected|expired|cancelled|suspended"),
    venue_id: Optional[int] = Query(None),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """همه قراردادها با فیلتر وضعیت/سالن — فقط سالن‌های تحت مدیریت (یا همه برای سرپرست)."""
    scope = _manager_venue_ids(uow, current_user)
    if venue_id is not None:
        _check_venue_manager(uow, venue_id, current_user, [Perm.CONTRACT_VIEW], request)
        venue_ids = [venue_id]
    else:
        venue_ids = scope if scope is not None else None
    cs_enum = None
    if status:
        try:
            cs_enum = ContractStatus(status.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail="وضعیت نامعتبر است")
    if venue_ids is None:
        contracts = (uow.contracts.get_for_manager_venues(
            list(uow.session.exec(select(Venue.id)).all()), cs_enum))
    else:
        contracts = uow.contracts.get_for_manager_venues(venue_ids, cs_enum)
    return ContractService(uow).manager_rows(contracts)


# ─────────────────────────── جزئیات / گردش / جلسات / مالی ───────────────────────────

@router.get("/{contract_id}")
def get_contract(
    contract_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """جزئیات کامل — مالک، مدیر/کارکنان سالن قرارداد (contract.view)، یا سرپرست."""
    contract = _load_contract_or_404(uow, contract_id)
    _ensure_owner_or_manager(uow, contract, current_user, request)
    return ContractService(uow).to_detail(contract)


@router.post("/{contract_id}/approve", response_model=ContractResponse)
async def approve_contract(
    contract_id: int,
    request: Request,
    data: Optional[ContractApprove] = None,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """تأیید درخواست (با/بدون اصلاح قیمت/سقف سانس) → ACTIVE + تقویم اقساط. کارکنan: contract.manage."""
    contract = _load_contract_or_404(uow, contract_id)
    _check_venue_manager(uow, contract.venue_id, current_user,
                         [Perm.CONTRACT_MANAGE], request)
    service = ContractService(uow)
    approved = service.approve_contract(contract, current_user, data or ContractApprove())
    detail = service.to_detail(approved)
    log_security_event(uow, "contract.approved", current_user.id,
                       target_type="contract", target_id=approved.id,
                       venue_id=approved.venue_id,
                       data={"total_amount": approved.total_amount}, request=request)
    uow.commit()

    await _notify_parties(
        uow, approved,
        "✅ قرارداد تأیید شد",
        f"قرارداد شما برای سالن {detail['venue_name']} تأیید و فعال شد"
        + (f" با قیمت جدید هر سانس: {approved.discounted_price:,}."
           if (data and data.adjusted_price_per_session) else "."),
        "contract_approved",
    )
    return approved


@router.post("/{contract_id}/reject", response_model=ContractResponse)
async def reject_contract(
    contract_id: int,
    data: ContractReject,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """رد درخواست — سانس‌های آینده در همان ترنزکشن آزاد می‌شوند. کارکنان: contract.manage."""
    contract = _load_contract_or_404(uow, contract_id)
    _check_venue_manager(uow, contract.venue_id, current_user,
                         [Perm.CONTRACT_MANAGE], request)
    service = ContractService(uow)
    rejected = service.reject_contract(contract, current_user, data)
    venue = uow.venues.get_by_id(rejected.venue_id)
    log_security_event(uow, "contract.rejected", current_user.id,
                       target_type="contract", target_id=rejected.id,
                       venue_id=rejected.venue_id,
                       data={"reason": data.reason[:200]}, request=request)
    uow.commit()

    await notification_service.notify_contract_rejected(rejected.user_id, {
        "contract_id": rejected.id,
        "venue_name": venue.name if venue else None,
        "reason": data.reason,
    })
    await notification_service.send_to_user(current_user.id, "🗂 درخواست قرارداد رد شد",
        f"درخواست قرارداد #{contract_id} با دلیل «{data.reason}» رد و سانس‌ها آزاد شدند.",
        {"contract_id": contract_id}, notif_type="contract_rejected")
    return rejected


@router.post("/{contract_id}/cancel", response_model=ContractResponse)
async def cancel_contract(
    contract_id: int,
    data: ContractCancel,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """لغو توسط مالک یا مدیر/branch_manager (contract.manage) — سیاست + آزادی آینده‌ها."""
    contract = _load_contract_or_404(uow, contract_id)
    is_owner = contract.user_id == current_user.id or current_user.role == UserRole.SUPER_ADMIN
    _ensure_owner_or_manager(uow, contract, current_user, request,
                             None if is_owner else [Perm.CONTRACT_MANAGE])
    service = ContractService(uow)
    cancelled = service.cancel_contract(contract, current_user, data)
    log_security_event(uow, "contract.cancelled", current_user.id,
                       target_type="contract", target_id=cancelled.id,
                       venue_id=cancelled.venue_id,
                       data={"reason": data.reason[:200], "by_owner": is_owner},
                       request=request)
    uow.commit()

    await _notify_parties(uow, cancelled, "🚫 قرارداد لغو شد",
                          f"قرارداد #{contract_id} لغو شد. دلیل: {data.reason}",
                          "contract_cancelled")
    return cancelled
# ─────────────────────────── قواعد تک‌سانس ───────────────────────────

@router.post("/{contract_id}/sessions/{cs_id}/exclude")
async def exclude_session(
    contract_id: int,
    cs_id: int,
    data: ContractSessionExclude,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """استثنای سانس آینده — contract.manage (branch_manager/مالک). اقساط ثابت."""
    contract = _load_contract_or_404(uow, contract_id)
    _check_venue_manager(uow, contract.venue_id, current_user,
                         [Perm.CONTRACT_MANAGE], request)
    service = ContractService(uow)
    cs = service.exclude_session(contract, cs_id, current_user, data.reason)
    view = service.session_view(contract, cs)
    uow.commit()
    await _notify_parties(uow, contract, "⏹ سانس قرارداد استثنا شد",
                          f"سانس {cs.session_date} قرارداد #{contract_id} استثنا شد: {data.reason}",
                          "contract_session")
    return view


@router.post("/{contract_id}/sessions/{cs_id}/reschedule")
async def reschedule_session(
    contract_id: int,
    cs_id: int,
    data: ContractSessionReschedule,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """جابه‌جایی یک سانس — contract.manage؛ تداخل (DB+Redis)؛ سانس گذشته ۴۰۰ فارسی."""
    contract = _load_contract_or_404(uow, contract_id)
    _check_venue_manager(uow, contract.venue_id, current_user,
                         [Perm.CONTRACT_MANAGE], request)
    service = ContractService(uow)
    cs = service.reschedule_session(contract, cs_id, data, current_user)
    view = service.session_view(contract, cs)
    uow.commit()
    await _notify_parties(uow, contract, "🔁 سانس قرارداد جابه‌جا شد",
                          f"سانس قرارداد #{contract_id} به {data.new_date} ساعت {data.new_time} منتقل شد.",
                          "contract_session")
    return view


@router.post("/{contract_id}/sessions/{cs_id}/cancel-request")
async def request_session_cancel(
    contract_id: int,
    cs_id: int,
    data: ContractSessionCancel,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """درخواست لغو تک‌سانس توسط مالک — اجرا (استثنا/جابه‌جایی) با مدیر است."""
    contract = _load_contract_or_404(uow, contract_id)
    if contract.user_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
        # مدیر/branch_manager (contract.manage) هم می‌تواند به‌نیابت ثبت کند
        _check_venue_manager(uow, contract.venue_id, current_user,
                             [Perm.CONTRACT_MANAGE], request)
    service = ContractService(uow)
    cs = service.request_session_cancel(contract, cs_id, current_user, data.reason)
    venue = uow.venues.get_by_id(contract.venue_id)
    uow.commit()
    await notification_service.notify_contract_session_cancel_request(
        venue.manager_id if venue else None,
        {"contract_id": contract.id, "session_date": str(cs.session_date),
         "reason": data.reason, "requested_by": current_user.full_name})
    await notification_service.send_to_user(current_user.id, "📩 درخواست لغو سانس ثبت شد",
        f"درخواست لغو سانس {cs.session_date} برای مدیر سالن ارسال شد.",
        {"contract_id": contract.id, "contract_slot_id": cs.id}, notif_type="contract_session_request")
    return service.session_view(contract, cs)


@router.post("/{contract_id}/move")
async def move_whole_contract(
    contract_id: int,
    data: ContractMoveWhole,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """جابه‌جایی کل سانس‌های آینده — contract.manage؛ تداخل ⇒ ۴۰۰ با لیست تصادم‌ها."""
    contract = _load_contract_or_404(uow, contract_id)
    _check_venue_manager(uow, contract.venue_id, current_user,
                         [Perm.CONTRACT_MANAGE], request)
    service = ContractService(uow)
    moved = service.move_whole_contract(contract, data, current_user)
    uow.commit()
    await _notify_parties(uow, contract, "🔁 برنامه قرارداد منتقل شد",
                          f"{moved} سانس آینده قرارداد #{contract_id} به "
                          f"روز {data.day_of_week} ساعت {data.start_time} منتقل شد.",
                          "contract_session")
    return {"moved_sessions": moved, "day_of_week": data.day_of_week, "start_time": str(data.start_time)}


# ─────────────────────────── اقساط ───────────────────────────

@router.get("/{contract_id}/payments")
def list_contract_payments(
    contract_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """تقویم اقساط — مالک یا مدیر/کارکنان سالن قرارداد (contract.view)."""
    contract = _load_contract_or_404(uow, contract_id)
    _ensure_owner_or_manager(uow, contract, current_user, request)
    return ContractService(uow).payment_rows(contract)


@router.post("/{contract_id}/payments/{payment_id}/mark-paid")
async def mark_contract_installment_paid(
    contract_id: int,
    payment_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
    _rate_limit: None = Depends(payment_rate_limit),
):
    """Cash-mark سمت سالن (brief §8a) — مالک/branch_manager/cashier (finance.record_payment).

    جدا از پرداخت درگاهی (`/pay` که مالک-محور می‌ماند): تسویه نقدی ثبت‌شده در
    دفتر کل با method=cash و idempotency همان `contract-payment:{id}` ⇒
    دوباره‌فشاری ردیف تکرار نمی‌سازد و خطا نمی‌دهد.
    """
    contract = _load_contract_or_404(uow, contract_id)
    ensure_venue_permission(uow, current_user, contract.venue_id,
                            [Perm.FINANCE_RECORD_PAYMENT], request)
    payment = uow.contract_payments.get_by_id(payment_id)
    if not payment or payment.contract_id != contract.id:
        raise HTTPException(status_code=404, detail="قسط یافت نشد")
    service = ContractService(uow)
    if payment.is_paid:
        # idempotent — قسط پیش‌تر تسویه شده (درگاهی یا نقدی)
        rows = [r for r in service.payment_rows(contract) if r["id"] == payment.id]
        return rows[0] if rows else {"id": payment.id, "is_paid": True}
    if payment.is_voided:
        raise HTTPException(status_code=400, detail="این قسط باطل شده است")
    paid = service.pay_installment(contract, payment, current_user, None)  # card=None ⇒ cash
    log_security_event(uow, "contract.installment_cash_marked", current_user.id,
                       target_type="contract_payment", target_id=paid.id,
                       venue_id=contract.venue_id,
                       data={"contract_id": contract.id, "amount": paid.amount,
                             "method": "cash"}, request=request)
    uow.commit()
    venue = uow.venues.get_by_id(contract.venue_id)
    await notification_service.notify_contract_payment(contract.user_id, {
        "contract_id": contract.id, "payment_id": paid.id, "amount": paid.amount,
        "message": f"«{paid.label}» قرارداد {venue.name if venue else ''} به‌صورت نقدی "
                   f"توسط کارکنان سالن ثبت شد.",
    })
    rows = [r for r in service.payment_rows(contract) if r["id"] == paid.id]
    return rows[0]


@router.post("/{contract_id}/payments/{payment_id}/pay")
async def pay_contract_installment(
    contract_id: int,
    payment_id: int,
    data: ContractPaymentPay,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
    _rate_limit: None = Depends(payment_rate_limit),
):
    """پرداخت قسط (شبیه‌سازی درگاه) — تسویه از طریق دفتر کل؛ idempotency=شناسه قسط."""
    contract = _load_contract_or_404(uow, contract_id)
    if contract.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="این قرارداد متعلق به شما نیست")
    payment = uow.contract_payments.get_by_id(payment_id)
    if not payment or payment.contract_id != contract.id:
        raise HTTPException(status_code=404, detail="قسط یافت نشد")
    service = ContractService(uow)
    paid = service.pay_installment(contract, payment, current_user, data.card_number)
    uow.commit()

    venue = uow.venues.get_by_id(contract.venue_id)
    await notification_service.notify_contract_payment(current_user.id, {
        "contract_id": contract.id, "payment_id": paid.id, "amount": paid.amount,
        "message": f"پرداخت «{paid.label}» قرارداد {venue.name if venue else ''} با موفقیت انجام شد.",
    })
    if venue and venue.manager_id:
        await notification_service.send_to_user(venue.manager_id, "💰 قسط قرارداد پرداخت شد",
            f"کاربر {current_user.full_name} «{paid.label}» ({paid.amount:,}) قرارداد #{contract.id} را پرداخت کرد.",
            {"contract_id": contract.id, "payment_id": paid.id, "amount": paid.amount},
            notif_type="contract_payment")
    rows = service.payment_rows(contract)
    return next(r_ for r_ in rows if r_["id"] == paid.id)


@router.post("/{contract_id}/payments/{payment_id}/void")
async def void_contract_installment(
    contract_id: int,
    payment_id: int,
    data: ContractPaymentVoid,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """ابطال قسط — finance.manage (حسابدار/branch/مالک)؛ ledger void + ممیزی سراسری."""
    contract = _load_contract_or_404(uow, contract_id)
    _check_venue_manager(uow, contract.venue_id, current_user,
                         [Perm.FINANCE_MANAGE], request)
    payment = uow.contract_payments.get_by_id(payment_id)
    if not payment or payment.contract_id != contract.id:
        raise HTTPException(status_code=404, detail="قسط یافت نشد")
    service = ContractService(uow)
    voided = service.void_installment(contract, payment, current_user, data.reason)
    log_security_event(uow, "contract.installment_void", current_user.id,
                       target_type="contract_payment", target_id=voided.id,
                       venue_id=contract.venue_id,
                       data={"contract_id": contract.id, "reason": data.reason[:200]},
                       request=request)
    uow.commit()
    await _notify_parties(uow, contract, "↩️ ابطال قسط قرارداد",
                          f"«{voided.label}» قرارداد #{contract.id} باطل شد. دلیل: {data.reason}",
                          "contract_payment")
    for row in service.payment_rows(contract):
        if row["id"] == voided.id:
            return row
    return {"id": voided.id, "voided": True}


# ─────────────────────────── ممیزی ───────────────────────────

@router.get("/{contract_id}/audit")
def get_contract_audit(
    contract_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """روند کامل ممیزی (کرونولوژیک) — مالک یا مدیر/کارکنان سالن (contract.view)."""
    contract = _load_contract_or_404(uow, contract_id)
    _ensure_owner_or_manager(uow, contract, current_user, request)
    return ContractService(uow).audit_trail(contract)