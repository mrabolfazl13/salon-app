# backend/app/schemas/finance.py
"""اسکیمای ماژول مالی — دفتر کل، دسته‌های هزینه، داشبورد و گزارش‌ها.

همه مبالغ INTEGER (ریال) هستند؛ amount همیشه > 0 و جهت با direction مشخص می‌شود.
"""
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator

from app.models.transaction import (
    CounterpartyType,
    TransactionDirection,
    TransactionMethod,
    TransactionSourceType,
    TransactionStatus,
    TransactionType,
)

# جهتِ تحمیل‌شده برای هر نوع (transfert/adjustment دلخواه‌اند)
FORCED_DIRECTION = {
    TransactionType.PAYMENT: TransactionDirection.INCOME,
    TransactionType.RECEIVABLE: TransactionDirection.INCOME,
    TransactionType.CREDIT: TransactionDirection.INCOME,
    TransactionType.REFUND: TransactionDirection.EXPENSE,
    TransactionType.DISCOUNT: TransactionDirection.EXPENSE,
    TransactionType.EXPENSE: TransactionDirection.EXPENSE,
}


class TransactionCreate(BaseModel):
    """ساخت ردیف دستی — دریافت وجه یا هزینه (توسط مدیر)."""
    type: TransactionType
    direction: TransactionDirection
    amount: int = Field(..., gt=0, description="مبلغ به ریال")
    method: TransactionMethod = TransactionMethod.CASH
    status: TransactionStatus = TransactionStatus.CLEARED
    venue_id: Optional[int] = None
    counterparty: Optional[int] = Field(default=None, description="شناسه کاربر طرف‌حساب")
    counterparty_type: Optional[CounterpartyType] = CounterpartyType.USER
    counterparty_ref: Optional[int] = None
    expense_category_id: Optional[int] = None
    source_type: TransactionSourceType = TransactionSourceType.MANUAL
    source_id: Optional[int] = None
    description: str = Field(default="", max_length=500)
    occurred_at: Optional[datetime] = None
    idempotency_key: Optional[str] = Field(default=None, max_length=120)

    @model_validator(mode="after")
    def _validate_type_direction_category(self):
        forced = FORCED_DIRECTION.get(self.type)
        if forced is not None and self.direction != forced:
            raise ValueError(f"جهت نوع «{self.type.value}» باید «{forced.value}» باشد")
        if self.type == TransactionType.EXPENSE and self.expense_category_id is None:
            raise ValueError("برای هزینه، انتخاب دسته‌بندی الزامی است")
        return self


class TransactionVoidRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=300, description="دلیل ابطال")


class TransactionResponse(BaseModel):
    id: int
    idempotency_key: Optional[str] = None
    type: str
    direction: str
    amount: int
    method: str
    status: str
    counterparty: Optional[int] = None
    counterparty_name: Optional[str] = None
    counterparty_type: Optional[str] = None
    counterparty_ref: Optional[int] = None
    venue_id: Optional[int] = None
    venue_name: Optional[str] = None
    expense_category_id: Optional[int] = None
    expense_category_name: Optional[str] = None
    source_type: str
    source_id: Optional[int] = None
    description: str = ""
    created_by: Optional[int] = None
    occurred_at: datetime
    created_at: datetime
    cleared_at: Optional[datetime] = None
    void_reason: Optional[str] = None


class TransactionListResponse(BaseModel):
    items: List[TransactionResponse]
    total: int
    limit: int
    offset: int


class ExpenseCategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    venue_id: Optional[int] = Field(default=None, description="null = سراسری (فقط ادمین)")


class ExpenseCategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    is_active: Optional[bool] = None


class ExpenseCategoryResponse(BaseModel):
    id: int
    venue_id: Optional[int] = None
    name: str
    is_active: bool
    created_at: datetime


class AccountPaymentCreate(BaseModel):
    """پرداخت نقدی شخص به مجموعه (نسیه‌ساز) — ایجاد ردیف درآمد manual."""
    amount: int = Field(..., gt=0)
    method: TransactionMethod = TransactionMethod.CASH
    venue_id: Optional[int] = None
    description: str = Field(default="", max_length=500)
    idempotency_key: Optional[str] = Field(default=None, max_length=120)


class StatementEntry(BaseModel):
    id: int
    occurred_at: datetime
    type: str
    direction: str
    amount: int
    delta: int = Field(description="اثر ریالی روی موجودی (مثبت=بدهکارتر، منفی=تسویه)")
    running_balance: int
    status: str
    description: str = ""
    venue_id: Optional[int] = None


class AccountStatementResponse(BaseModel):
    user_id: int
    full_name: Optional[str] = None
    from_date: Optional[date] = None
    to_date: Optional[date] = None
    opening_balance: int = Field(description="موجودی قبل از بازه (مثبت = بدهکار)")
    closing_balance: int
    entries: List[StatementEntry]


class AccountSummary(BaseModel):
    user_id: int
    full_name: Optional[str] = None
    balance: int = Field(description="مثبت = بدهکار به مجموعه، منفی = حساب اعتباری")
    kind: str = Field(description="debtor | creditor")
    last_activity: Optional[datetime] = None


class AccountListResponse(BaseModel):
    items: List[AccountSummary]
    total: int
    limit: int
    offset: int


class SeriesPoint(BaseModel):
    key: str
    label: str
    income: int
    expense: int
    net: int
    count: int


class SeriesResponse(BaseModel):
    group_by: str
    from_date: Optional[date] = None
    to_date: Optional[date] = None
    points: List[SeriesPoint]
    total_net: int


class SourceRevenue(BaseModel):
    source: str
    income: int
    count: int


class RevenueBySourceResponse(BaseModel):
    from_date: Optional[date] = None
    to_date: Optional[date] = None
    by_source: List[SourceRevenue]
    total: int


class OccupancyResponse(BaseModel):
    from_date: date
    to_date: date
    total_active_slots: int
    occupied_slots: int
    occupancy_rate: float
    per_venue: List["VenueOccupancy"]


class VenueOccupancy(BaseModel):
    venue_id: int
    venue_name: Optional[str] = None
    total_active_slots: int
    occupied_slots: int
    occupancy_rate: float


class LowDemandSlot(BaseModel):
    weekday: int = Field(description="۰=یکشنبه تا ۶=شنبه (مطابق strftime %w / EXTRACT dow)")
    hour: int
    total_slots: int
    booked_slots: int
    occupancy_rate: float


class DashboardResponse(BaseModel):
    from_date: date
    to_date: date
    venue_ids: Optional[List[int]] = Field(default=None, description="null = کل سامانه (ادمین)")
    today_revenue: int
    month_revenue: int
    today_received: int
    open_receivables: int
    active_contracts: int
    contracts_expiring_soon: int
    bookings_today: int
    occupancy_today: float
    cancelled_bookings: int
    pending_payment_bookings: int
    expenses: int
    gross_profit: int
    active_customers: int
    prev_month_revenue: int = Field(description="خالص درآمد ماه قبل از ماهِ شامل `to`")
    prev_month_expenses: int = Field(description="هزینه‌های ماه قبل از ماهِ شامل `to`")
    active_teams: int = Field(description="تیم‌های فعال در دامنه (با عضو/رزرو فعال در سالن‌ها)")


OccupancyResponse.model_rebuild()