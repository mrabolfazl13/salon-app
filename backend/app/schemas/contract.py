import json

from pydantic import BaseModel, Field, model_validator
from datetime import date, time, datetime
from typing import Optional, List
from enum import Enum


def _day_list(day_of_week, extra_days) -> List[int]:
    """روزهای مؤثر قرارداد: اصلی + اضافی (distinct، مرتب)."""
    days = {int(day_of_week)}
    try:
        for d in json.loads(extra_days or "[]"):
            days.add(int(d))
    except (ValueError, TypeError):
        pass
    return sorted(days)

class RecurrenceType(str, Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"

class InstallmentPlan(BaseModel):
    """درخواست تقسیط در زمان تأیید — {count, due_in_days_between?}."""
    count: int = Field(..., ge=1, le=24, description="تعداد اقساط بعد از پیش‌پرداخت")
    due_in_days_between: Optional[int] = Field(
        default=None, ge=7, le=90,
        description="فاصله‌ی روزهای سررسید (پیش‌فرض: ماهانه بر اساس payment_due_day_of_month)")

class ContractCreate(BaseModel):
    venue_id: int
    start_date: date
    end_date: date
    day_of_week: int = Field(..., ge=0, le=6,
                             description="روز هفته اصلی (۰=دوشنبه … ۶=یکشنبه — weekday پایتون)")
    additional_days: List[int] = Field(
        default_factory=list,
        description="روزهای هفته اضافی برای قرارداد چندروزه (حداکثر ۲ روز؛ "
                    "مجموعاً ≤۳ روز؛ تکراری و هم‌روزِ day_of_week پذیرفته نمی‌شود)")
    start_time: time
    end_time: Optional[time] = Field(default=None, description="پایان سانس (اختیاری — پیش‌فرض ۹۰ دقیقه)")
    recurrence: RecurrenceType = RecurrenceType.WEEKLY
    discounted_price: int = Field(..., gt=0, description="پیشنهاد قیمت هر سانس از سوی کاربر؛ جمع کل سمت سرور بازمحاسبه می‌شود")
    suggested_price: Optional[int] = Field(default=None, gt=0, description="معادل discounted_price برای سازگاری کلاینت")
    description: Optional[str] = None
    auto_renew: bool = Field(default=False)
    down_payment_amount: Optional[int] = Field(default=None, ge=0, description="پیش‌پرداخت (اختیاری)")
    payment_due_day_of_month: Optional[int] = Field(default=None, ge=1, le=28)
    desired_installments: Optional[int] = Field(
        default=None, ge=1, le=60,
        description="تعداد اقساط موردنظر کاربر در زمان تأیید (اختیاری)")
    note: Optional[str] = Field(
        default=None, max_length=1000,
        description="یادداشت آزاد فارسی برای مدیر (در صف تأیید نمایش داده می‌شود)")

    @property
    def session_price(self) -> int:
        return self.discounted_price

    @model_validator(mode="after")
    def _validate_days(self):
        seen: List[int] = []
        for d in self.additional_days:
            if not (0 <= d <= 6):
                raise ValueError("روزهای هفته باید بین ۰ و ۶ باشند")
            if d == self.day_of_week:
                raise ValueError("روز اضافی نمی‌تواند با روز اصلی یکسان باشد")
            if d in seen:
                continue
            seen.append(d)
        if len(seen) + 1 > 3:
            raise ValueError("حداکثر ۳ روز هفته برای یک قرارداد مجاز است")
        self.additional_days = sorted(seen)
        return self

class ContractApprove(BaseModel):
    """تأیید با/بدون اصلاح‌قیمت — approve-with-changes."""
    adjusted_price_per_session: Optional[int] = Field(default=None, gt=0)
    max_sessions: Optional[int] = Field(default=None, ge=1, le=200)
    installments: Optional[InstallmentPlan] = None
    cancellation_policy: Optional[str] = Field(default=None, max_length=1000,
                                               description="شرایط لغو که مدیر برای قرارداد تعیین می‌کند")

class ContractReject(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500)

class ContractCancel(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500)

class ContractSessionExclude(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500)

class ContractSessionCancel(BaseModel):
    """درخواست لغو یک سانس از سوی کاربر — تصمیم اجرا با مدیر (exclude/reschedule است)."""
    reason: str = Field(..., min_length=3, max_length=500)

class ContractSessionReschedule(BaseModel):
    new_date: date
    new_time: time

class ContractMoveWhole(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: time
    end_time: Optional[time] = None

class ContractPaymentPay(BaseModel):
    card_number: Optional[str] = Field(default=None, description="شماره کارت ۱۶ رقمی (شبیه‌سازی درگاه)")

class ContractPaymentVoid(BaseModel):
    reason: str = Field(..., min_length=3, max_length=300)

# ─────────────────────────── پاسخ‌ها ───────────────────────────

class ContractResponse(BaseModel):
    id: int
    user_id: int
    venue_id: int
    start_date: date
    end_date: date
    day_of_week: int
    # مجموع روزهای هفته (اصلی + اضافی، مرتب) — قرارداد تک‌روزه: یک عضو
    days: List[int] = []
    start_time: time
    duration: int
    recurrence: str
    original_price: int
    discounted_price: int
    total_amount: int
    status: str
    payment_status: str
    description: Optional[str]
    auto_renew: bool
    down_payment_amount: Optional[int]
    desired_installments: Optional[int] = None
    note: Optional[str] = None
    cancellation_policy: Optional[str]
    reject_reason: Optional[str]
    cancel_reason: Optional[str]
    approved_at: Optional[datetime]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

    @model_validator(mode="before")
    @classmethod
    def _derive_days(cls, data):
        """days از day_of_week + extra_days مشتق می‌شود (برون‌مدل؛ ذخیره جدا ندارد).

        روی آبجکت ORM فقط فیلدهای اعلام‌شده خوانده می‌شوند — هرگز مدل‌دامپ کامل
        (رابطه‌های lazy در سشن بسته‌شده خطای Detached/Greenlet می‌دهند).
        """
        if isinstance(data, dict):
            out = dict(data)
        else:
            if getattr(data, "day_of_week", None) is None:
                return data
            out = {name: getattr(data, name, None) for name in cls.model_fields}
            out["extra_days"] = getattr(data, "extra_days", None)
        dow = out.get("day_of_week")
        if dow is not None:
            out["days"] = _day_list(dow, out.get("extra_days"))
        return out

class ContractSessionResponse(BaseModel):
    id: int
    slot_id: int
    session_date: date
    start_time: time
    duration: int
    status: str
    slot_status: str
    is_past: bool
    cancel_requested: bool
    cancel_requested_at: Optional[datetime]
    cancellation_reason: Optional[str]
    rescheduled_date: Optional[date]
    rescheduled_time: Optional[time]
    exclusion_reason: Optional[str]

class ContractPaymentResponse(BaseModel):
    id: int
    amount: int
    due_date: date
    label: Optional[str]
    record_type: Optional[str]
    installment_no: Optional[int]
    is_paid: bool
    paid_at: Optional[datetime]
    is_overdue: bool
    is_voided: bool
    void_reason: Optional[str]
    transaction_id: Optional[str]

class ContractEconomics(BaseModel):
    total_sessions: int
    scheduled_sessions: int
    completed_sessions: int
    excluded_sessions: int
    paid_amount: int
    remaining_amount: int
    overdue: bool
    played_ratio: float

class ContractDetailResponse(ContractResponse):
    venue_name: Optional[str] = None
    user_full_name: Optional[str] = None
    sessions: List[ContractSessionResponse] = []
    payments: List[ContractPaymentResponse] = []
    economics: Optional[ContractEconomics] = None

class ContractManagerListRow(BaseModel):
    contract: ContractResponse
    venue_name: str
    user_full_name: Optional[str] = None
    user_phone: Optional[str] = None          # fixup §8b — اطلاعات متقاضی
    outstanding_amount: int = 0               # total − paid (اقساط باطل‌شده خارج)
    sessions_upcoming: int = 0
    total_sessions: int = 0

class ContractAuditEventResponse(BaseModel):
    id: int
    action: str
    actor_id: Optional[int]
    data: dict
    created_at: datetime
