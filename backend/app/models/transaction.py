# backend/app/models/transaction.py
"""دفتر کل مالی (Ledger) — فقط-افزونی (append-only).

قانون‌ها:
- هیچ‌وقت ردیف cleared حذف یا دستکاری نمی‌شود؛ اصلاح = ردیف `adjustment`/`refund`
  جدید یا تبدیل به `voided` با `void_reason` (بدون حذف فیزیکی).
- پول همیشه INTEGER (ریال) و amount > 0؛ جهت با `direction` (دید مجموعه) مشخص می‌شود.
"""
from sqlmodel import SQLModel, Field
from sqlalchemy import CheckConstraint
from typing import Optional
from datetime import datetime, timezone
from enum import Enum


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TransactionType(str, Enum):
    PAYMENT = "payment"            # دریافت وجه (نقد/گیتوی/...)
    RECEIVABLE = "receivable"      # مطالبه (فروش نسیه/قراردادی)
    REFUND = "refund"              # بازگشت وجه (وارونه‌سازی درآمد)
    DISCOUNT = "discount"          # تخفیف اعمال‌شده
    EXPENSE = "expense"            # هزینه (با دسته‌بندی expense_category_id)
    CREDIT = "credit"              # اعتبار/پیش‌پرداخت شخص
    TRANSFER = "transfer"          # جابه‌جایی داخلی
    ADJUSTMENT = "adjustment"      # اصلاحیه‌ی دفتر کل


class TransactionDirection(str, Enum):
    INCOME = "income"              # ورودی/طلب برای مجموعه
    EXPENSE = "expense"            # خروجی/کاهش درآمد


class TransactionMethod(str, Enum):
    CASH = "cash"
    CARD_TO_CARD = "card_to_card"
    GATEWAY = "gateway"
    POS = "pos"
    CREDIT = "credit"
    OTHER = "other"


class TransactionStatus(str, Enum):
    PENDING = "pending"
    CLEARED = "cleared"
    VOIDED = "voided"


class CounterpartyType(str, Enum):
    USER = "user"
    TEAM = "team"                  # فعلاً همان باشگاه (club)
    ORGANIZATION = "organization"
    CONTRACT = "contract"
    OTHER = "other"


class TransactionSourceType(str, Enum):
    BOOKING = "booking"
    BOOKING_PAYMENT = "booking_payment"
    GAME_PAYMENT = "game_payment"
    MEMBERSHIP_PURCHASE = "membership_purchase"
    CONTRACT = "contract"
    CONTRACT_PAYMENT = "contract_payment"
    MANUAL = "manual"
    # تیم (این موج): پرداخت حق‌عضویت تیم؛ طرف‌حساب ردیف با counterparty_type=TEAM ثبت می‌شود.
    # «team» به‌عنوان طرف‌حساب از قبل وجود دارد (CounterpartyType.TEAM) و سهم بازی با
    # GAME_PAYMENT پوشش داده می‌شود — لذا فقط TEAM_DUES افزوده شد.
    TEAM_DUES = "team_dues"


class ExpenseCategory(SQLModel, table=True):
    """دسته‌بندی هزینه — venue_id=null یعنی سراسری (همه‌ی سالن‌ها)."""
    __tablename__ = "expense_categories"

    id: Optional[int] = Field(default=None, primary_key=True)
    venue_id: Optional[int] = Field(default=None, foreign_key="venues.id", index=True)
    name: str = Field(max_length=100)
    is_active: bool = Field(default=True, index=True)
    created_at: datetime = Field(default_factory=_utcnow)


class FinancialTransaction(SQLModel, table=True):
    """ردیف دفتر کل — append-only؛ موجودی‌ها همیشه از تجمیع ردیف‌ها محاسبه می‌شوند."""
    __tablename__ = "financial_transactions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_financial_transactions_amount_positive"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    idempotency_key: Optional[str] = Field(default=None, unique=True, index=True, max_length=120)

    type: TransactionType = Field(index=True)
    direction: TransactionDirection = Field(index=True)
    amount: int = Field(description="مبلغ مثبت به ریال")
    method: TransactionMethod = Field(default=TransactionMethod.CASH)
    status: TransactionStatus = Field(default=TransactionStatus.CLEARED, index=True)

    counterparty: Optional[int] = Field(default=None, foreign_key="users.id", index=True,
                                        description="شخص حساب ( کاربر) — nullable")
    counterparty_type: Optional[CounterpartyType] = Field(default=None)
    counterparty_ref: Optional[int] = Field(default=None, description="ارجاع خارجی طرف‌حساب (مثلاً club_id)")

    venue_id: Optional[int] = Field(default=None, foreign_key="venues.id", index=True,
                                    description="سالن منتسب‌شده برای درآمد/هزینه")
    expense_category_id: Optional[int] = Field(default=None, foreign_key="expense_categories.id", index=True)

    source_type: TransactionSourceType = Field(default=TransactionSourceType.MANUAL, index=True)
    source_id: Optional[int] = Field(default=None)

    description: str = Field(default="", max_length=500)
    created_by: Optional[int] = Field(default=None, foreign_key="users.id")

    occurred_at: datetime = Field(default_factory=_utcnow, index=True,
                                  description="تاریخ واقعه‌ی مالی (مبنای گزارش‌های زمانی)")
    created_at: datetime = Field(default_factory=_utcnow)
    cleared_at: Optional[datetime] = None
    void_reason: Optional[str] = Field(default=None, max_length=300)