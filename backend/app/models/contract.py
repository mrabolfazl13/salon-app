from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import date, time, datetime, timezone
from enum import Enum


class ContractStatus(str, Enum):
    PENDING = "pending"        # درخواست کاربر — در انتظار تأیید مدیر
    ACTIVE = "active"          # تأییدشده (APPROVED == ACTIVE — بدون حالت دوگانه)
    REJECTED = "rejected"      # ردشده توسط مدیر
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    SUSPENDED = "suspended"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    PARTIAL = "partial"
    OVERDUE = "overdue"


class RecurrenceType(str, Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"


class ContractSlotStatus(str, Enum):
    """لایه‌ی رزرو برای هر سانس قرارداد — جدا از وضعیت قرارداد و لایه‌ی مالی.

    نکته‌ی طراحی (مستند): وقتی سانس COMPLETED می‌شود ردیف Slot واقعی
    دست‌نخورده (RESERVED) می‌ماند؛ تکمیل فقط در همین جدول ثبت می‌شود تا
    معنای اشغالِ موجودی سانس تغییر نکند.
    """
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    EXCLUDED = "excluded"        # استثنا/لغو تکی — سانس متناظر آزاد گردید
    RESCHEDULED = "rescheduled"  # به rescheduled_date/time منتقل شده (اصلی حفظ است)


class ContractAuditAction(str, Enum):
    CREATED = "created"
    APPROVED = "approved"
    AMENDED_ON_APPROVAL = "amended_on_approval"
    REJECTED = "rejected"
    REJECTION_REASON_UPDATED = "rejection_reason_updated"
    CANCELLED = "cancelled"
    SESSION_EXCLUDED = "session_excluded"
    SESSION_RESCHEDULED = "session_rescheduled"
    SESSION_CANCEL_REQUESTED = "session_cancel_requested"
    WHOLE_CONTRACT_RESCHEDULED = "whole_contract_rescheduled"
    PAYMENT_SCHEDULE_GENERATED = "payment_schedule_generated"
    PAYMENT_PAID = "payment_paid"
    PAYMENT_VOIDED = "payment_voided"
    OVERDUE_NOTIFIED = "overdue_notified"
    RENEWED = "renewed"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Contract(SQLModel, table=True):
    __tablename__ = "contracts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    venue_id: int = Field(foreign_key="venues.id")
    
    start_date: date
    end_date: date
    recurrence: RecurrenceType = Field(default=RecurrenceType.WEEKLY)
    
    day_of_week: int
    # روزهای هفته اضافی قرارداد چندروزه — رشته JSON همانند الگوی amenities سالن؛
    # «[]» یعنی قرارداد تک‌روزه کلاسیک (روز اصلی = day_of_week)
    extra_days: str = Field(default="[]", max_length=32)
    start_time: time
    duration: int = Field(default=90)
    
    original_price: int
    discounted_price: int
    total_amount: int
    
    status: ContractStatus = Field(default=ContractStatus.PENDING)
    payment_status: PaymentStatus = Field(default=PaymentStatus.PENDING)
    
    description: Optional[str] = None
    auto_renew: bool = Field(default=False)

    # ── گردش تأیید/رد/لغو (PENDING → ACTIVE/REJECTED → EXPIRED/CANCELLED) ──
    approved_at: Optional[datetime] = None
    approved_by: Optional[int] = Field(default=None, foreign_key="users.id")
    rejected_at: Optional[datetime] = None
    rejected_by: Optional[int] = Field(default=None, foreign_key="users.id")
    reject_reason: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    cancelled_by: Optional[int] = Field(default=None, foreign_key="users.id")
    cancel_reason: Optional[str] = None
    renewal_objection: bool = Field(default=False)  # لغو تمدید خودکار

    # ── مالی/قراردادی (مدیر در تأیید تکمیل می‌کند) ──
    down_payment_amount: Optional[int] = None
    payment_due_day_of_month: Optional[int] = None
    cancellation_policy: Optional[str] = None

    # ── درخواست کاربر (parity با فرانت — مهاجرت k1q011) ──
    desired_installments: Optional[int] = Field(default=None, index=False)
    note: Optional[str] = Field(default=None, max_length=1000)

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    
    user: "User" = Relationship(back_populates="contracts",
                                 sa_relationship_kwargs={"foreign_keys": "[Contract.user_id]"})
    venue: "Venue" = Relationship(back_populates="contracts")
    generated_slots: List["ContractSlot"] = Relationship(back_populates="contract")
    payments: List["ContractPayment"] = Relationship(back_populates="contract")
    audit_events: List["ContractAuditEvent"] = Relationship(back_populates="contract")
    approver: Optional["User"] = Relationship(sa_relationship_kwargs={"foreign_keys": "[Contract.approved_by]"})


class ContractSlot(SQLModel, table=True):
    __tablename__ = "contract_slots"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    contract_id: int = Field(foreign_key="contracts.id")
    slot_id: int = Field(foreign_key="slots.id")
    
    session_date: date
    is_attended: bool = Field(default=False)
    is_cancelled: bool = Field(default=False)
    cancellation_reason: Optional[str] = None

    # ── لایه‌ی رزرو/قواعد تک‌سانس ──
    status: ContractSlotStatus = Field(default=ContractSlotStatus.SCHEDULED)
    rescheduled_date: Optional[date] = None    # تاریخ جدید (اصلی در session_date می‌ماند)
    rescheduled_time: Optional[time] = None
    exclusion_reason: Optional[str] = None
    handled_by: Optional[int] = Field(default=None, foreign_key="users.id")
    handled_at: Optional[datetime] = None
    cancel_requested: bool = Field(default=False)   # درخواست کاربر؛ اجرا با مدیر
    cancel_requested_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: Optional[datetime] = None
    
    contract: "Contract" = Relationship(back_populates="generated_slots")
    slot: "Slot" = Relationship(back_populates="contract_reference")


class ContractPayment(SQLModel, table=True):
    __tablename__ = "contract_payments"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    contract_id: int = Field(foreign_key="contracts.id")
    
    amount: int
    due_date: date
    label: Optional[str] = None                  # «پیش‌پرداخت» / «قسط ۲ از ۴»
    record_type: Optional[str] = None            # down_payment | installment
    installment_no: Optional[int] = None
    paid_at: Optional[datetime] = None
    is_paid: bool = Field(default=False)
    is_overdue: bool = Field(default=False)      # تسک روزانه علامت می‌زند
    overdue_notified_at: Optional[datetime] = None  # ضدتکرار اعلان معوق
    is_voided: bool = Field(default=False)
    void_reason: Optional[str] = None
    transaction_id: Optional[str] = None
    
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: Optional[datetime] = None
    
    contract: "Contract" = Relationship(back_populates="payments")


class ContractAuditEvent(SQLModel, table=True):
    """رویداد ممیزی قرارداد — `data` رشته‌ی JSON (الگوی amenities سالن).

    این جدول نقش «ContractAmendment» را با رویدادهای کرونولوژیک پوشش می‌دهد
    (ساده‌تر و کافی — در گزارش ذکر شده).
    """
    __tablename__ = "contract_audit_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    contract_id: int = Field(foreign_key="contracts.id", index=True)
    actor_id: Optional[int] = Field(default=None, foreign_key="users.id")
    action: ContractAuditAction
    data: str = Field(default="{}")
    created_at: datetime = Field(default_factory=_utcnow)

    contract: "Contract" = Relationship(back_populates="audit_events")