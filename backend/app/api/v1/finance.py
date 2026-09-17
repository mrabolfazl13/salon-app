# backend/app/api/v1/finance.py
"""API مالی — داشبورد، دفتر کل، اشخاص و گزارش‌ها.

دامنه دسترسی (موج RBAC §10):
- super_admin: بدون فیلتر. مالک سالن/باشگاه: دامنه مدیریتی سابق (بدون تغییر).
- کارکنan (role=user): با کدهای دسترسی روی همان venue_id; venue_id الزامی است.
- کدها: finance.view (خواندن ردیف‌ها) | reports.view (تجمیعی) |
  finance.record_payment (ثبت دریافت) | finance.expense.create |
  finance.manage (void/دسته‌بندی اصلاح/حذف و خروجی export — مستند در permissions.py).
الگوی مالکیت مطابق `_check_venue_manager` سابق در bookings.py.
"""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response

from app.unit_of_work import UnitOfWork, get_unit_of_work
from app.models.user import User
from app.schemas.finance import (
    AccountListResponse,
    AccountPaymentCreate,
    AccountStatementResponse,
    DashboardResponse,
    ExpenseCategoryCreate,
    ExpenseCategoryResponse,
    ExpenseCategoryUpdate,
    LowDemandSlot,
    OccupancyResponse,
    RevenueBySourceResponse,
    SeriesResponse,
    TransactionCreate,
    TransactionListResponse,
    TransactionResponse,
    TransactionVoidRequest,
)
from app.services.finance_service import FinanceService
from app.utils.auth import get_current_user
from app.utils.permissions import Perm
from app.utils.staff_access import (
    ensure_venue_permission, log_security_event, staff_scoped_access, staff_venue_ids,
)

router = APIRouter(prefix="/finance", tags=["Finance"])

VIEW_CODES = [Perm.FINANCE_VIEW, Perm.REPORTS_VIEW]
RECEIVABLE_CODES = [Perm.FINANCE_VIEW, Perm.RECEIVABLES_VIEW]


def _scope(uow: UnitOfWork, current_user: User, venue_id: Optional[int],
           codes: List[str], request: Request) -> Optional[List[int]]:
    """کاربر عادی ⇒ [venue_id] پس از بررسی کد؛ نقش‌های مدیر ⇒ مسیر legacy."""
    staff_scope = staff_scoped_access(uow, current_user, venue_id, codes, request)
    if staff_scope is not None:
        return staff_scope
    return FinanceService.resolve_scope(uow, current_user, venue_id)


def _ids_or_staff(uow: UnitOfWork, current_user: User, venue: Optional[int]
                  ) -> Optional[List[int]]:
    """برای USER: دامنه‌ی سالن ردیف تکی (کد از قبل ensure شده)؛ legacy بدون تغییر."""
    from app.models.user import UserRole
    if current_user.role == UserRole.USER:
        return [venue] if venue is not None else []
    return FinanceService.manager_venue_ids(uow, current_user)


def _legacy_scope_or_staff_venues(uow: UnitOfWork, current_user: User,
                                  codes: List[str]) -> Optional[List[int]]:
    """دسته‌بندی‌ها venue_id پارامتر ندارند — کارکنان: سالن‌های خودشان با کد."""
    from app.models.user import UserRole
    if current_user.role == UserRole.USER:
        ids = staff_venue_ids(uow, current_user, codes)
        if not ids:
            raise HTTPException(status_code=403, detail="اجازه دسترسی ندارید")
        return ids
    return FinanceService.manager_venue_ids(uow, current_user)


# ─────────────────────────── داشبورد / گزارش‌ها ───────────────────────────

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    venue_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    request: Request = None,  # noqa: RUF100 — FastAPI injects
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """تجمیع تک‌کوئری برای کنسول مالی — بدون N+1."""
    staff_scope = staff_scoped_access(uow, current_user, venue_id, VIEW_CODES, request)
    # staff_scope=None ⇒ resolve_scope legacy داخل سرویس؛ [venue_id] ⇒ کارکنان
    return FinanceService.dashboard(uow, current_user, venue_id, from_date, to_date,
                                    venue_scope=staff_scope)


@router.get("/revenue/series", response_model=SeriesResponse)
def get_revenue_series(
    group_by: str = Query("day", pattern="^(day|venue|hour|weekday)$"),
    venue_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    request: Request = None,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """سری درآمد بر حسب روز/سالن/ساعت/روز هفته (کلید weekday: ۰=یکشنبه)."""
    scope = _scope(uow, current_user, venue_id, VIEW_CODES, request)
    return FinanceService.revenue_series(uow, group_by, scope, from_date, to_date)


@router.get("/revenue/by-source", response_model=RevenueBySourceResponse)
def get_revenue_by_source(
    venue_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    request: Request = None,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """درآمد نقدی به تفکیک منبع (booking/contract/game/membership/manual...)."""
    scope = _scope(uow, current_user, venue_id, VIEW_CODES, request)
    return FinanceService.revenue_by_source(uow, scope, from_date, to_date)


@router.get("/occupancy", response_model=OccupancyResponse)
def get_occupancy(
    venue_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    request: Request = None,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """اشغال سانس = (booked+reserved) / سانس‌های فعال (نامسدود)."""
    scope = _scope(uow, current_user, venue_id, VIEW_CODES, request)
    return FinanceService.occupancy(uow, scope, from_date, to_date)


@router.get("/low-demand-slots", response_model=List[LowDemandSlot])
def get_low_demand_slots(
    venue_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    threshold: float = Query(40.0, ge=0, le=100, description="سقف اشغال (درصد)"),
    request: Request = None,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """سانس‌های کم‌تقاضا به تفکیک (روز هفته، ساعت)."""
    scope = _scope(uow, current_user, venue_id, VIEW_CODES, request)
    return FinanceService.low_demand_slots(uow, scope, from_date, to_date, threshold)


# ─────────────────────────── تراکنش‌ها ───────────────────────────

@router.get("/transactions", response_model=TransactionListResponse)
def list_transactions(
    venue_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    type: Optional[str] = Query(None, description="payment|receivable|refund|discount|expense|credit|transfer|adjustment"),
    direction: Optional[str] = Query(None, pattern="^(income|expense)$"),
    status: Optional[str] = Query(None, pattern="^(pending|cleared|voided)$"),
    source_type: Optional[str] = Query(None),
    source_id: Optional[int] = Query(None),
    counterparty: Optional[int] = Query(None, description="شناسه کاربر طرف‌حساب"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    request: Request = None,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    scope = _scope(uow, current_user, venue_id, VIEW_CODES, request)
    txs, total = uow.transactions.list_transactions(
        venue_ids=scope, from_date=from_date, to_date=to_date,
        tx_type=type, direction=direction, status=status,
        source_type=source_type, source_id=source_id, counterparty=counterparty,
        limit=limit, offset=offset,
    )
    return {
        "items": FinanceService.transactions_to_response(uow, txs),
        "total": total, "limit": limit, "offset": offset,
    }


@router.post("/transactions", response_model=TransactionResponse, status_code=201)
def create_transaction(
    data: TransactionCreate,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """ثبت دستی دریافت وجه یا هزینه — cashier: expense/payment؛ accountant: مدیریت کامل."""
    from app.models.transaction import TransactionDirection
    if data.direction == TransactionDirection.EXPENSE:
        codes = [Perm.FINANCE_EXPENSE_CREATE, Perm.FINANCE_MANAGE]
    elif data.direction == TransactionDirection.INCOME:
        codes = [Perm.FINANCE_RECORD_PAYMENT, Perm.FINANCE_MANAGE]
    else:
        codes = [Perm.FINANCE_MANAGE]
    scope = _scope(uow, current_user, data.venue_id, codes, request)
    tx = FinanceService.create_manual(uow, data, current_user, scope)
    uow.commit()
    return FinanceService.transactions_to_response(uow, [tx])[0]


@router.get("/transactions/{tx_id}", response_model=TransactionResponse)
def get_transaction(
    tx_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    tx = uow.transactions.get_by_id(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="تراکنش یافت نشد")
    ensure_venue_permission(uow, current_user, tx.venue_id, VIEW_CODES, request)
    scope = _ids_or_staff(uow, current_user, tx.venue_id)
    tx = FinanceService.get_transaction_in_scope(uow, tx_id, scope)
    return FinanceService.transactions_to_response(uow, [tx])[0]


@router.post("/transactions/{tx_id}/void", response_model=TransactionResponse)
def void_transaction(
    tx_id: int,
    data: TransactionVoidRequest,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """ابطال — ردیف حذف نمی‌شود؛ status=voided + void_reason + ممیزی سراسری."""
    tx = uow.transactions.get_by_id(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="تراکنش یافت نشد")
    ensure_venue_permission(uow, current_user, tx.venue_id, [Perm.FINANCE_MANAGE], request)
    scope = _ids_or_staff(uow, current_user, tx.venue_id)
    tx = FinanceService.void_transaction(uow, tx_id, data.reason, scope)
    log_security_event(uow, "finance.transaction_void", current_user.id,
                       target_type="transaction", target_id=tx_id,
                       venue_id=tx.venue_id, data={"reason": data.reason[:200]},
                       request=request)
    uow.commit()
    return FinanceService.transactions_to_response(uow, [tx])[0]


# ─────────────────────────── دسته‌بندی هزینه ───────────────────────────

@router.get("/expense-categories", response_model=List[ExpenseCategoryResponse])
def list_expense_categories(
    include_inactive: bool = Query(False),
    request: Request = None,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    scope = _legacy_scope_or_staff_venues(uow, current_user, VIEW_CODES)
    return FinanceService.list_categories(uow, scope, include_inactive)


@router.post("/expense-categories", response_model=ExpenseCategoryResponse, status_code=201)
def create_expense_category(
    data: ExpenseCategoryCreate,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    scope = _scope(uow, current_user, data.venue_id,
                   [Perm.FINANCE_EXPENSE_CREATE, Perm.FINANCE_MANAGE], request)
    cat = FinanceService.create_category(uow, data, current_user, scope)
    uow.commit()
    return cat


@router.put("/expense-categories/{category_id}", response_model=ExpenseCategoryResponse)
def update_expense_category(
    category_id: int,
    data: ExpenseCategoryUpdate,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    cat = uow.expense_categories.get_by_id(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="دسته‌بندی یافت نشد")
    ensure_venue_permission(uow, current_user, cat.venue_id, [Perm.FINANCE_MANAGE], request)
    scope = _ids_or_staff(uow, current_user, cat.venue_id)
    cat = FinanceService.update_category(uow, category_id, data, scope)
    uow.commit()
    return cat


@router.delete("/expense-categories/{category_id}")
def delete_expense_category(
    category_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """حذف نرم (is_active=false) — در صورت استفاده در تراکنش، 400 برمی‌گرداند."""
    cat = uow.expense_categories.get_by_id(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="دسته‌بندی یافت نشد")
    ensure_venue_permission(uow, current_user, cat.venue_id, [Perm.FINANCE_MANAGE], request)
    scope = _ids_or_staff(uow, current_user, cat.venue_id)
    FinanceService.delete_category(uow, category_id, scope)
    uow.commit()
    return {"message": "دسته‌بندی غیرفعال شد"}


# ─────────────────────────── حساب‌های اشخاص ───────────────────────────

@router.get("/accounts", response_model=AccountListResponse)
def list_accounts(
    venue_id: Optional[int] = Query(None),
    kind: str = Query("all", pattern="^(all|debtors|creditors)$"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    request: Request = None,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """بدهکاران/اعتبارها با موجودی و آخرین فعالیت (sort: |balance| نزولی)."""
    scope = _scope(uow, current_user, venue_id, RECEIVABLE_CODES, request)
    items, total = FinanceService.accounts(uow, scope, kind, limit, offset)
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/accounts/{user_id}/statement", response_model=AccountStatementResponse)
def get_account_statement(
    user_id: int,
    venue_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    request: Request = None,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """صورت‌حساب کرونولوژیک با موجودی جاری."""
    scope = _scope(uow, current_user, venue_id, RECEIVABLE_CODES, request)
    return FinanceService.ledger_statement(uow, user_id, from_date, to_date, scope)


@router.post("/accounts/{user_id}/payments", response_model=TransactionResponse, status_code=201)
def record_account_payment(
    user_id: int,
    data: AccountPaymentCreate,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """ثبت پرداخت نقدی شخص بابت حسابش (cashier با finance.record_payment)."""
    scope = _scope(uow, current_user, data.venue_id,
                   [Perm.FINANCE_RECORD_PAYMENT], request)
    tx = FinanceService.person_payments(uow, user_id, data, current_user, scope)
    uow.commit()
    return FinanceService.transactions_to_response(uow, [tx])[0]


# ─────────────────────────── خروجی ───────────────────────────

@router.get("/export")
def export_transactions(
    format: str = Query("csv"),
    venue_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    type: Optional[str] = Query(None),
    direction: Optional[str] = Query(None, pattern="^(income|expense)$"),
    status: Optional[str] = Query(None, pattern="^(pending|cleared|voided)$"),
    source_type: Optional[str] = Query(None),
    counterparty: Optional[int] = Query(None),
    limit: int = Query(5000, ge=1, le=20000),
    request: Request = None,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """خروجی CSV دفتر کل (PDF به بعد) — export طبق ماتریس با finance.manage (حسابدار/branch)."""
    if format != "csv":
        raise HTTPException(status_code=400, detail="فعلاً فقط فرمت csv پشتیبانی می‌شود")
    scope = _scope(uow, current_user, venue_id, [Perm.FINANCE_MANAGE], request)
    log_security_event(uow, "finance.export", current_user.id,
                       target_type="transaction_set", venue_id=venue_id,
                       data={"filters": {"type": type, "direction": direction,
                                         "status": status, "limit": limit}},
                       request=request)
    csv_text = FinanceService.export_csv(uow, {
        "venue_ids": scope, "from_date": from_date, "to_date": to_date,
        "tx_type": type, "direction": direction, "status": status,
        "source_type": source_type, "counterparty": counterparty,
        "limit": limit, "offset": 0,
    })
    return Response(
        content="\ufeff" + csv_text,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="finance_transactions.csv"'},
    )