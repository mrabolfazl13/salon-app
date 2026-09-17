# backend/app/utils/permissions.py
"""منبع یکتای کدهای دسترسی کارکنان (RBAC) — brief §10.

هر کد دسترسی رشته‌ی «حوزه.عمل» است. ماتریس پیش‌فرض موقعیت‌ها همین‌جا تعریف
می‌شود و در `staff_assignments.permissions` فقط در صورت سفارشی‌سازی ذخیره
می‌گردد (آرایه خالی = پیش‌فرض موقعیت).

تصمیم‌های مستندشده (PRAGMATIC MATRIX):
- branch_manager: تمام کدهای حوزه‌ی مدیر-سالن (ALL) — از جمله staff.manage/audit.
- reception: لیست §1 (booking.view/confirm/pending_list، slot.view_manager،
  customer.view_basic) + deal.publish (انتشار دیل طبق §3: branch_manager+reception)
  + contract.view (مشاهده پایه قراردادهای سالن).
- cashier: لیست §1 + cash-mark اقساط قرارداد با همان finance.record_payment.
- accountant: لیست §1؛ finance.manage شامل void/دسته‌بندی‌ها/export است.
- coupons/pricing/holidays CRUD فقط branch_manager (via ALL)؛ حسابدار گزارش‌خوان
  (reports.view/receivables.view) و بدون دسترسی نوشتن.
- خواندن عمومی سانس‌ها (`GET /slots/venue/...`) عمومی ماند؛ «مدیریت سانس» در این
  موج = slot.generate (نقطه‌ی نوشتن) — نقطه‌ی پایان «خواندن مدیر سانس» جداگانه‌ای
  در API وجود نداشت (مستند در گزارش).
"""
from enum import Enum
from typing import Iterable, Optional


class StaffPosition(str, Enum):
    BRANCH_MANAGER = "branch_manager"
    RECEPTION = "reception"
    CASHIER = "cashier"
    ACCOUNTANT = "accountant"


# ─────────────────────────── کدهای دسترسی ───────────────────────────

class Perm:
    # رزرو / سانس
    BOOKING_VIEW = "booking.view"
    BOOKING_CONFIRM = "booking.confirm"
    BOOKING_PENDING_LIST = "booking.pending_list"
    SLOT_VIEW_MANAGER = "slot.view_manager"
    SLOT_GENERATE = "slot.generate"
    SLOT_BLOCK = "slot.block"                   # مسدود/آزاد کردن سانس (owner/BM/reception)
    # مشتری / CRM
    CUSTOMER_VIEW_BASIC = "customer.view_basic"
    CRM_VIEW = "crm.view"
    CRM_MANAGE = "crm.manage"
    # مالی
    FINANCE_VIEW = "finance.view"
    FINANCE_RECORD_PAYMENT = "finance.record_payment"
    FINANCE_EXPENSE_CREATE = "finance.expense.create"
    FINANCE_MANAGE = "finance.manage"          # void + دسته‌بندی‌ها + export
    PAYMENT_VIEW = "payment.view"
    REPORTS_VIEW = "reports.view"
    RECEIVABLES_VIEW = "receivables.view"
    # قراردادها
    CONTRACT_VIEW = "contract.view"
    CONTRACT_MANAGE = "contract.manage"        # approve/reject/cancel/sessions
    # عملیات سالن
    DEAL_PUBLISH = "deal.publish"
    COUPON_MANAGE = "coupon.manage"
    PRICING_MANAGE = "pricing.manage"
    HOLIDAY_MANAGE = "holiday.manage"
    # کارکنان
    STAFF_MANAGE = "staff.manage"
    STAFF_AUDIT = "staff.audit"


ALL_PERMISSIONS: tuple = tuple(sorted(
    v for v in vars(Perm).values() if isinstance(v, str)
))

# ماتریس پیش‌فرض موقعیت → کدها (تک‌منبع؛ در توضیحات ماژول مستند شده)
POSITION_DEFAULT_PERMISSIONS: dict = {
    StaffPosition.BRANCH_MANAGER: ALL_PERMISSIONS,
    StaffPosition.RECEPTION: (
        Perm.BOOKING_VIEW, Perm.BOOKING_CONFIRM, Perm.BOOKING_PENDING_LIST,
        Perm.SLOT_VIEW_MANAGER, Perm.SLOT_BLOCK, Perm.CUSTOMER_VIEW_BASIC,
        Perm.DEAL_PUBLISH, Perm.CONTRACT_VIEW,
    ),
    StaffPosition.CASHIER: (
        Perm.FINANCE_VIEW, Perm.FINANCE_RECORD_PAYMENT, Perm.FINANCE_EXPENSE_CREATE,
        Perm.BOOKING_VIEW, Perm.PAYMENT_VIEW,
    ),
    StaffPosition.ACCOUNTANT: (
        Perm.FINANCE_VIEW, Perm.FINANCE_MANAGE, Perm.FINANCE_EXPENSE_CREATE,
        Perm.REPORTS_VIEW, Perm.RECEIVABLES_VIEW,
    ),
}

# خواندن CRM: crm.view یا customer.view_basic (پایه‌ی استقبال)
CRM_READ_CODES = (Perm.CRM_VIEW, Perm.CUSTOMER_VIEW_BASIC)


def permissions_for_position(position: StaffPosition) -> frozenset:
    return frozenset(POSITION_DEFAULT_PERMISSIONS.get(position, ()))


def is_known_permission(code: str) -> bool:
    return code in ALL_PERMISSIONS


def normalize_permission_list(codes: Optional[Iterable[str]]) -> list:
    """اعتبارسنجی لیست کدهای دلخواه — کد ناشناخته ValueError (endpoint → ۴۰۰)."""
    if not codes:
        return []
    out: list = []
    for c in codes:
        if not is_known_permission(c):
            raise ValueError(f"کد دسترسی ناشناخته: {c}")
        if c not in out:
            out.append(c)
    return out