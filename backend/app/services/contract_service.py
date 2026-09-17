# backend/app/services/contract_service.py
"""سرویس چرخه‌ی عمر قرارداد — درخواست/تأیید/رد/لغو، اقساط، قواعد تک‌سانس، ممیزی.

جداسازی سه لایه (مصوب):
- Contract.status      → گردش عمر قرارداد
- ContractSlot.status  → وضعیت رزرو هر سانس (SCHEDULED/COMPLETED/EXCLUDED/RESCHEDULED)
- ContractPayment      → لایه مالی؛ تسویه فقط از طریق دفتر کل (finance_service)

انتخاب‌های مستندشده:
- APPROVED == ACTIVE: تأیید مستقیماً قرارداد را ACTIVE می‌کند (حالت دوگانه نداریم).
- در رد/لغو، سانس‌های آینده آزاد می‌شوند (AVAILABLE + خارج از ید قرارداد) و ردیف
  ContractSlot مربوطه EXCLUDED می‌شود؛ سانس‌های گذشته (بازی‌شده) دست نمی‌خورند.
- سانس استثناشده اقساط را تغییر نمی‌دهد (اعتبار-یادداشت را مدیر دستی لحاظ می‌کند)
  — فقط در ممیزی ثبت می‌شود.
- سانس COMPLETED: ردیف Slot واقعی دست‌نخورده (RESERVED) می‌ماند؛ تکمیل فقط در
  ContractSlot ثبت می‌شود تا معنای اشغال موجودی تغییر نکند.
"""
import json
from datetime import date, datetime, time, timedelta, timezone
from typing import List, Optional, Tuple

from sqlmodel import select

from app.models.venue import Venue

from dateutil.relativedelta import relativedelta
from fastapi import HTTPException

from app.models.contract import (
    Contract, ContractSlot, ContractPayment,
    ContractStatus, ContractSlotStatus, ContractAuditAction,
    PaymentStatus, RecurrenceType,
)
from app.models.slot import Slot, SlotStatus
from app.models.user import User
from app.schemas.contract import (
    ContractApprove, ContractCancel, ContractCreate, ContractReject,
    ContractSessionReschedule, ContractMoveWhole, InstallmentPlan,
)
from app.services.finance_service import FinanceService
from app.services.pending_booking_service import pending_booking_service
from app.unit_of_work import UnitOfWork
from app.utils.time_guard import is_past_slot, slot_start_datetime

def _now() -> datetime:
    return datetime.now(timezone.utc)

def _clamped_due(anchor: date, due_day: Optional[int]) -> date:
    """سررسید روی روز مشخص ماه (کلَمپ تا ۲۸ — بدون سرریز به ماه بعد)."""
    if due_day:
        return anchor.replace(day=min(due_day, 28))
    return anchor

def split_remainder_to_last(total: int, n: int) -> List[int]:
    """تقسیم floor با انداختن باقیمانده روی قسط آخر — هیچ ریالی گم نمی‌شود."""
    if n <= 0:
        raise HTTPException(status_code=400, detail="تعداد اقساط باید مثبت باشد")
    base = total // n
    remainder = total - base * n
    parts = [base] * n
    parts[-1] += remainder
    if any(p <= 0 for p in parts):
        raise HTTPException(status_code=400, detail="مبلغ قرارداد برای این تعداد قسط کافی نیست")
    return parts

def cs_effective(cs: ContractSlot) -> Tuple[date, Optional[time]]:
    """تاریخ/ساعت مؤثر سانس — اگر جابه‌جا شده باشد مقدار جدید وگرنه اصلی."""
    return (cs.rescheduled_date or cs.session_date, cs.rescheduled_time)

def is_overdue_now(payment: ContractPayment) -> bool:
    return (not payment.is_paid) and (not payment.is_voided) and payment.due_date < date.today()

class ContractService:

    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    # ─────────────────────────── کمکى مشترک ───────────────────────────

    @staticmethod
    def calculate_sessions_count(start_date: date, end_date: date, day_of_week: int, recurrence: RecurrenceType) -> int:
        return len(ContractService.iterate_session_dates(start_date, end_date, day_of_week, recurrence))

    @staticmethod
    def iterate_session_dates(start_date: date, end_date: date, day_of_week: int,
                              recurrence: RecurrenceType) -> List[date]:
        dates: List[date] = []
        current = start_date
        while current <= end_date:
            if current.weekday() == day_of_week:
                dates.append(current)
            if recurrence == RecurrenceType.WEEKLY:
                current += timedelta(days=7)
            elif recurrence == RecurrenceType.BIWEEKLY:
                current += timedelta(days=14)
            elif recurrence == RecurrenceType.MONTHLY:
                current += relativedelta(months=1)
        return dates

    @staticmethod
    def contract_days(contract) -> List[int]:
        """روزهای مؤثر قرارداد (اصلی + extra_days مرتب) — الگوی JSON-as-string.»"""
        from app.schemas.contract import _day_list
        return _day_list(contract.day_of_week, getattr(contract, "extra_days", None))

    @staticmethod
    def iterate_days_session_dates(start_date: date, end_date: date,
                                   days: List[int], recurrence: RecurrenceType) -> List[date]:
        """تاریخ‌های جلسه روی تمام روزهای قرارداد — مستند (چندروزه §1):

        - تک‌روزه: دقیقاً `iterate_session_dates` (رفتار legacy دست‌نخورده).
        - چندروزه: هر روز به‌تنهایی با لنگر «اولین رخداد همان روز در بازه»
          هفتگی با گام ۷ / دوهفتگی با گام ۱۴ تولید می‌شود؛ ماهانه = در هر
          پنجره‌ی ماهانه (لنگر+relativedelta) نزدیک‌ترین رخداد همان روز هفته.
          نتیجه‌ی همه‌ی روزها union، dedup و مرتب است — بنابراین مجموع جلسات
          در چندروزه = جمع تک‌تک روزها.
        """
        days = sorted({int(d) for d in days})
        if len(days) <= 1:
            return ContractService.iterate_session_dates(
                start_date, end_date, days[0] if days else start_date.weekday(),
                recurrence)
        out: set = set()
        for d in days:
            first = start_date
            while first <= end_date and first.weekday() != d:
                first += timedelta(days=1)
            if first > end_date:
                continue
            if recurrence == RecurrenceType.MONTHLY:
                anchor = first
                while anchor + relativedelta(months=0) <= end_date:
                    occ = anchor + timedelta(days=(d - anchor.weekday()) % 7)
                    if first <= occ <= end_date:
                        out.add(occ)
                    nxt = anchor + relativedelta(months=1)
                    if nxt == anchor:
                        break
                    anchor = nxt
            else:
                step = timedelta(days=14 if recurrence == RecurrenceType.BIWEEKLY else 7)
                cur = first
                while cur <= end_date:
                    out.add(cur)
                    cur += step
        return sorted(out)

    def _log(self, contract_id: int, action: ContractAuditAction,
             actor_id: Optional[int], data: Optional[dict] = None):
        self.uow.contract_audits.log(contract_id, action, actor_id, data)

    def _materialize_slots(self, contract: Contract, dates: List[date]) -> int:
        """ساخت Slot‌های RESERVED + ردیف ContractSlot برای تاریخ‌های داده‌شده."""
        for current in dates:
            slot = self.uow.slots.create({
                "venue_id": contract.venue_id,
                "slot_date": current,
                "start_time": contract.start_time,
                "duration": contract.duration,
                "base_price": contract.original_price,
                "current_price": contract.discounted_price,
                "status": SlotStatus.RESERVED,
                "is_contract_slot": True,
                "contract_id": contract.id,
            })
            self.uow.contract_slots.create({
                "contract_id": contract.id,
                "slot_id": slot.id,
                "session_date": current,
                "is_attended": False,
                "is_cancelled": False,
                "status": ContractSlotStatus.SCHEDULED,
            })
        return len(dates)

    def _release_future_slots(self, contract: Contract, reason: str, handled_by: Optional[int]) -> int:
        """آزادسازی سانس‌های آینده‌ی قرارداد (رد/لغو) — در همان ترنزکشنِ تغییر وضعیت."""
        freed = 0
        for cs in self.uow.contract_slots.get_by_contract(contract.id):
            if cs.status not in (ContractSlotStatus.SCHEDULED, ContractSlotStatus.RESCHEDULED):
                continue
            slot = self.uow.slots.get_by_id(cs.slot_id)
            if slot is None:
                continue
            eff_date, _ = cs_effective(cs)
            if is_past_slot(eff_date, slot.start_time):
                continue  # سانس بازی‌شده آزاد نمی‌شود
            self.uow.slots.release_contract_slot(slot.id)
            self.uow.contract_slots.cancel_session(cs.id, reason, handled_by)
            freed += 1
        return freed
    # ─────────────────────────── ساخت (PENDING) ───────────────────────────

    def create_contract(self, contract_data: ContractCreate, user_id: int):
        venue = self.uow.venues.get_by_id(contract_data.venue_id)
        if not venue:
            raise HTTPException(status_code=404, detail="سالن یافت نشد")

        if contract_data.start_date > contract_data.end_date:
            raise HTTPException(status_code=400, detail="تاریخ شروع باید قبل از تاریخ پایان باشد")

        if contract_data.end_time:
            if contract_data.end_time <= contract_data.start_time:
                raise HTTPException(status_code=400, detail="ساعت پایان باید بعد از ساعت شروع باشد")
            duration = (datetime.combine(contract_data.start_date, contract_data.end_time)
                        - datetime.combine(contract_data.start_date, contract_data.start_time)).seconds // 60
        else:
            duration = 90

        main_day = int(contract_data.day_of_week)
        extra_days = sorted({int(d) for d in (contract_data.additional_days or [])
                             if int(d) != main_day})
        if len(extra_days) + 1 > 3:
            raise HTTPException(status_code=400, detail="حداکثر ۳ روز هفته برای یک قرارداد مجاز است")
        for d in extra_days:
            if not (0 <= d <= 6):
                raise HTTPException(status_code=400, detail="روزهای هفته باید بین ۰ و ۶ باشند")
        all_days = sorted({main_day, *extra_days})

        dates = self.iterate_days_session_dates(
            contract_data.start_date, contract_data.end_date,
            all_days, contract_data.recurrence)
        num_sessions = len(dates)
        if num_sessions == 0:
            raise HTTPException(status_code=400,
                                detail="هیچ سانسی در بازه‌ی زمانی و روزهای هفته انتخابی یافت نشد")
        if num_sessions > 60:
            raise HTTPException(status_code=400, detail="حداکثر ۶۰ سانس در یک قرارداد")

        # heuristic قیمت پایه: نمونه‌سانس واقعیِ همان سالن، وگرنه ۳۰۰٬۰۰۰ (مستند)
        sample_slot = self.uow.slots.get_one(venue_id=contract_data.venue_id)
        original_price = sample_slot.base_price if sample_slot else 300000

        price = contract_data.discounted_price
        if price >= original_price:
            raise HTTPException(status_code=400,
                                detail="قیمت پیشنهادی هر سانس باید کمتر از قیمت پایه سالن باشد")

        # جمع کل همیشه سمت سرور — هرگز به مبلغ کلِ کلاینت اعتماد نمی‌کنیم
        total_amount = num_sessions * price

        down = contract_data.down_payment_amount or 0
        if down >= total_amount // 2:
            raise HTTPException(status_code=400, detail="پیش‌پرداخت باید کمتر از نصف مبلغ کل قرارداد باشد")

        # بررسی تداخل زمانی با قراردادهای فعال/در‌انتظار دیگر — به‌ازای هر روز
        # قرارداد (تک‌روزه: دقیقاً رفتار سابق؛ چندروزه: روزهای اضافی هم کنترل می‌شوند)
        end_time = (datetime.combine(contract_data.start_date, contract_data.start_time) + timedelta(minutes=duration)).time()
        for day in all_days:
            conflicting = self.uow.contracts.get_conflicting_contracts(
                venue_id=contract_data.venue_id,
                day_of_week=day,
                start_time=contract_data.start_time,
                end_time=end_time,
                start_date=contract_data.start_date,
                end_date=contract_data.end_date
            )
            if conflicting:
                raise HTTPException(
                    status_code=409,
                    detail="برای این سالن در همان روز و بازه ساعتی قرارداد دیگری وجود دارد"
                )

        contract = self.uow.contracts.create({
            "user_id": user_id,
            "venue_id": contract_data.venue_id,
            "start_date": contract_data.start_date,
            "end_date": contract_data.end_date,
            "recurrence": contract_data.recurrence,
            "day_of_week": contract_data.day_of_week,
            "extra_days": json.dumps(extra_days),
            "start_time": contract_data.start_time,
            "duration": duration,
            "original_price": original_price,
            "discounted_price": price,
            "total_amount": total_amount,
            "description": contract_data.description,
            "auto_renew": contract_data.auto_renew,
            "down_payment_amount": contract_data.down_payment_amount,
            "payment_due_day_of_month": contract_data.payment_due_day_of_month,
            "desired_installments": contract_data.desired_installments,
            "note": contract_data.note,
            "status": ContractStatus.PENDING,
        })

        # رفتار جدید: سانس‌ها زمان CREATE متریالایز می‌شوند (RESERVED) — موجودی
        # در دوره PENDING هم نگه داشته می‌شود؛ تأیید=فعالی، رد/لغو=آزادسازی
        self._materialize_slots(contract, dates)

        self._log(contract.id, ContractAuditAction.CREATED, user_id, {
            "venue_id": venue.id,
            "sessions": num_sessions,
            "price_per_session": price,
            "total_amount": total_amount,
            "down_payment_amount": contract_data.down_payment_amount,
            "auto_renew": contract_data.auto_renew,
            "desired_installments": contract_data.desired_installments,
            "note": contract_data.note,
        })
        return contract

    # ─────────────────────────── تأیید + اصلاحات ───────────────────────────

    def approve_contract(self, contract: Contract, actor: User, data: Optional[ContractApprove] = None):
        data = data or ContractApprove()
        if contract.status != ContractStatus.PENDING:
            raise HTTPException(status_code=400, detail="فقط درخواست‌های در انتظار تأیید قابل تأیید هستند")

        amendment: dict = {}
        if data.adjusted_price_per_session is not None or data.max_sessions is not None:
            amendment = self._apply_approval_amendment(contract, data, actor)

        now = _now()
        updated = self.uow.contracts.update(contract.id, {
            "status": ContractStatus.ACTIVE,
            "approved_at": now,
            "approved_by": actor.id,
            "cancellation_policy": data.cancellation_policy or contract.cancellation_policy,
            "updated_at": now,
        })
        self._log(contract.id, ContractAuditAction.APPROVED, actor.id, {
            "price_per_session": updated.discounted_price,
            "total_amount": updated.total_amount,
        })
        if amendment:
            self._log(contract.id, ContractAuditAction.AMENDED_ON_APPROVAL, actor.id, amendment)

        plan = data.installments
        if plan is None and getattr(contract, "desired_installments", None):
            # درخواست تقسیط کاربر — نبودِ پلن صریح مدیر ⇒ همان تعداد؛
            # clamp مستند به سقف InstallmentPlan (۲۴ — تقویم ماهانه)
            plan = InstallmentPlan(count=min(contract.desired_installments, 24))
        self.generate_payment_schedule(updated, actor, plan, approved_on=now.date())
        return updated

    def _apply_approval_amendment(self, contract: Contract, data: ContractApprove, actor: User) -> dict:
        """approve-with-changes: قیمت جدید + تنظیم برنامه سانس‌های دست‌نخورده.

        سانس‌های آینده‌ی RESERVED «بازاستفاده» می‌شوند (نه حذف+ساختِ دوباره) تا
        روی همان تاریخ/ساعت موجودیِ تکراری ساخته نشود. سانس‌های گذشته و
        occurrences رزرو/بازی‌شده هرگز بازتولید نمی‌شوند.
        """
        new_price = data.adjusted_price_per_session or contract.discounted_price
        if new_price >= contract.original_price:
            raise HTTPException(status_code=400, detail="قیمت اصلاحی باید کمتر از قیمت پایه باشد")

        before = {"price": contract.discounted_price, "total": contract.total_amount}

        past_kept = 0
        future: List[Tuple[ContractSlot, Slot]] = []
        for cs in self.uow.contract_slots.get_by_contract(contract.id):
            if cs.status == ContractSlotStatus.EXCLUDED:
                continue
            slot = self.uow.slots.get_by_id(cs.slot_id)
            eff_date, _ = cs_effective(cs)
            if (slot is not None and cs.status in (ContractSlotStatus.SCHEDULED,
                                                   ContractSlotStatus.RESCHEDULED)
                    and slot.status == SlotStatus.RESERVED
                    and not is_past_slot(eff_date, slot.start_time)):
                future.append((cs, slot))
            else:
                past_kept += 1

        if data.max_sessions is not None and data.max_sessions < past_kept:
            raise HTTPException(status_code=400,
                                detail="max_sessions از تعداد سانس‌های برگزارشده کمتر است")

        target_future = None
        if data.max_sessions is not None:
            target_future = data.max_sessions - past_kept
        current_future = len(future)
        created = 0
        released = 0

        if target_future is not None and target_future < current_future:
            future.sort(key=lambda pair: cs_effective(pair[0])[0])
            for cs, slot in future[target_future:]:
                self.uow.slots.release_contract_slot(slot.id)
                self.uow.session.delete(cs)
                released += 1
            future = future[:target_future]

        if data.adjusted_price_per_session is not None:
            for cs, slot in future:
                self.uow.slots.update(slot.id, {"current_price": new_price})
            self.uow.contracts.update(contract.id, {"discounted_price": new_price})

        if target_future is not None and target_future > current_future:
            last_date = max((cs_effective(cs)[0] for cs, _ in future),
                            default=contract.start_date)
            candidates = [d for d in self.iterate_days_session_dates(
                last_date + timedelta(days=1), contract.end_date,
                self.contract_days(contract), contract.recurrence)
                if slot_start_datetime(d, contract.start_time) >= datetime.now()]
            added_dates = candidates[:target_future - current_future]
            refreshed = self.uow.contracts.get_by_id(contract.id)
            if data.adjusted_price_per_session is not None:
                refreshed.discounted_price = new_price
            created = self._materialize_slots(refreshed, added_dates)

        total_sessions = past_kept + len(future) + created
        if total_sessions < 1:
            raise HTTPException(status_code=400, detail="قرارداد بعد از اصلاح بدون سانس می‌ماند")
        self.uow.contracts.update(contract.id, {"total_amount": total_sessions * new_price})

        after = {"price": new_price, "total": total_sessions * new_price,
                 "sessions": total_sessions}
        return {"before": before, "after": after, "max_sessions": data.max_sessions,
                "released_sessions": released, "added_sessions": created}

    # رد / لغو

    def reject_contract(self, contract: Contract, actor: User, data: ContractReject):
        if contract.status != ContractStatus.PENDING:
            raise HTTPException(status_code=400, detail="فقط درخواست در انتظار تأیید قابل رد است")
        freed = self._release_future_slots(contract, f"رد قرارداد: {data.reason}", actor.id)
        now = _now()
        self.uow.contracts.update(contract.id, {
            "status": ContractStatus.REJECTED,
            "reject_reason": data.reason,
            "rejected_at": now,
            "rejected_by": actor.id,
            "updated_at": now,
        })
        self._log(contract.id, ContractAuditAction.REJECTED, actor.id,
                  {"reason": data.reason, "freed_slots": freed})
        return self.uow.contracts.get_by_id(contract.id)

    def cancel_contract(self, contract: Contract, actor: User, data: ContractCancel):
        """لغو توسط مالک یا مدیر — سیاست: قرارداد گذشته/تمام‌شده لغو نمی‌شود."""
        if contract.status not in (ContractStatus.PENDING, ContractStatus.ACTIVE, ContractStatus.SUSPENDED):
            raise HTTPException(status_code=400, detail="این قرارداد در وضعیت قابل لغو نیست")
        if contract.end_date < date.today():
            raise HTTPException(status_code=400, detail="قرارداد گذشته یا تمام‌شده را نمی‌توان لغو کرد")
        freed = self._release_future_slots(contract, f"لغو قرارداد: {data.reason}", actor.id)
        now = _now()
        self.uow.contracts.update(contract.id, {
            "status": ContractStatus.CANCELLED,
            "cancel_reason": data.reason,
            "cancelled_at": now,
            "cancelled_by": actor.id,
            "updated_at": now,
        })
        self._log(contract.id, ContractAuditAction.CANCELLED, actor.id,
                  {"reason": data.reason, "freed_slots": freed, "auto_renew": contract.auto_renew})
        return self.uow.contracts.get_by_id(contract.id)

    # ─────────────────────────── اقساط (ContractPayment) ───────────────────────────

    def generate_payment_schedule(self, contract: Contract, actor: User,
                                  plan: Optional[InstallmentPlan], approved_on: date) -> List[ContractPayment]:
        """تقویم مالی: (پیش‌پرداخت) + N قسط مساوی floor — باقیمانده روی قسط آخر.

        فقط اگر پیش‌پرداخت تعریف شده باشد یا caller تقسیط خواسته باشد تولید می‌شود.
        """
        has_down = bool(contract.down_payment_amount and contract.down_payment_amount > 0)
        if not has_down and plan is None:
            return []
        if self.uow.contract_payments.has_schedule(contract.id):
            return self.uow.contract_payments.get_by_contract(contract.id)

        total = contract.total_amount
        specs: List[dict] = []
        down = min(contract.down_payment_amount or 0, total - 1) if has_down else 0
        if down:
            specs.append({"amount": down, "due_date": approved_on,
                          "label": "پیش‌پرداخت", "record_type": "down_payment", "installment_no": 0})

        remainder = total - down
        n = plan.count if plan else max(1, self._default_month_count(contract, approved_on))
        amounts = split_remainder_to_last(remainder, n)
        for i in range(n):
            if plan and plan.due_in_days_between:
                spacing_days = plan.due_in_days_between * (i + 1)
                anchor = approved_on + timedelta(days=spacing_days)
            else:
                anchor = approved_on + relativedelta(months=i + 1)
            specs.append({"amount": amounts[i],
                          "due_date": _clamped_due(anchor, contract.payment_due_day_of_month),
                          "label": "قسط " + str(i + 1) + " از " + str(n),
                          "record_type": "installment", "installment_no": i + 1})

        created = self.uow.contract_payments.bulk_create(
            [dict(s, contract_id=contract.id) for s in specs])
        self._log(contract.id, ContractAuditAction.PAYMENT_SCHEDULE_GENERATED, actor.id, {
            "total": total, "down_payment": down, "installments": n,
            "amounts": [s["amount"] for s in specs],
        })
        return created

    @staticmethod
    def _default_month_count(contract: Contract, approved_on: date) -> int:
        delta = relativedelta(contract.end_date, approved_on)
        months = delta.years * 12 + delta.months + (1 if delta.days else 0)
        return max(1, min(months, 12))

    def pay_installment(self, contract: Contract, payment: ContractPayment, payer: User,
                        card_number: Optional[str]) -> ContractPayment:
        """تسویه قسط از طریق دفتر کل — الگوی درگاه payments.py (بدون فاکتور جدا)."""
        from app.models.transaction import TransactionMethod, TransactionSourceType
        if payment.is_paid:
            raise HTTPException(status_code=400, detail="این قسط قبلاً پرداخت شده است")
        if payment.is_voided:
            raise HTTPException(status_code=400, detail="این قسط باطل شده است")
        if contract.status not in (ContractStatus.ACTIVE, ContractStatus.EXPIRED):
            raise HTTPException(status_code=400, detail="پرداخت برای قرارداد در این وضعیت مجاز نیست")

        if card_number is not None:
            from app.api.v1.payments import _normalize_digits
            card = _normalize_digits(card_number)
            if len(card) != 16 or not card.isdigit():
                raise HTTPException(status_code=400, detail="شماره کارت نامعتبر است (۱۶ رقم)")
            method = TransactionMethod.CARD_TO_CARD
        else:
            method = TransactionMethod.CASH

        tx = FinanceService.record_income(
            self.uow,
            amount=payment.amount,
            source_type=TransactionSourceType.CONTRACT_PAYMENT,
            source_id=payment.id,
            venue_id=contract.venue_id,
            counterparty_user_id=contract.user_id,
            method=method,
            description=f"پرداخت «{payment.label or 'قسط'}» قرارداد #{contract.id}",
            idempotency_key=f"contract-payment:{payment.id}",
            created_by=payer.id,
        )
        self.uow.contract_payments.update(payment.id, {
            "is_paid": True,
            "paid_at": _now(),
            "transaction_id": str(tx.id),
        })
        self._sync_contract_payment_status(contract)
        self._log(contract.id, ContractAuditAction.PAYMENT_PAID, payer.id, {
            "payment_id": payment.id, "amount": payment.amount, "ledger_tx": tx.id,
        })
        return self.uow.contract_payments.get_by_id(payment.id)

    def void_installment(self, contract: Contract, payment: ContractPayment, actor: User, reason: str):
        """ابطال قسط — ردیف دفتر کلِ متناظر (در صورت پرداخت) با دلیل باطل می‌شود."""
        from app.models.transaction import TransactionStatus
        if payment.is_voided:
            raise HTTPException(status_code=400, detail="این قسط قبلاً باطل شده است")
        if payment.is_paid and payment.transaction_id:
            tx = self.uow.transactions.get_by_id(int(payment.transaction_id))
            if tx and tx.status != TransactionStatus.VOIDED:
                # ابطال ledger با درج دلیل در همان ردیف (بدون حذف فیزیکی)
                self.uow.transactions.update(tx.id, {
                    "status": TransactionStatus.VOIDED,
                    "void_reason": reason[:300],
                })
        self.uow.contract_payments.update(payment.id, {
            "is_paid": False,
            "is_voided": True,
            "void_reason": reason[:300],
        })
        self._sync_contract_payment_status(contract)
        self._log(contract.id, ContractAuditAction.PAYMENT_VOIDED, actor.id,
                  {"payment_id": payment.id, "amount": payment.amount, "reason": reason})
        return self.uow.contract_payments.get_by_id(payment.id)

    def _sync_contract_payment_status(self, contract: Contract):
        payments = [p for p in self.uow.contract_payments.get_by_contract(contract.id) if not p.is_voided]
        if not payments:
            return
        paid = [p for p in payments if p.is_paid]
        if len(paid) == len(payments):
            status = PaymentStatus.PAID
        elif paid:
            status = PaymentStatus.PARTIAL
        elif any(is_overdue_now(p) for p in payments):
            status = PaymentStatus.OVERDUE
        else:
            status = PaymentStatus.PENDING
        self.uow.contracts.update(contract.id, {"payment_status": status})
    # ─────────────────────────── قواعد تک‌سانس ───────────────────────────

    def _get_session_slot(self, contract: Contract, cs_id: int) -> Tuple[ContractSlot, Slot]:
        cs = self.uow.contract_slots.get_by_contract_and_id(contract.id, cs_id)
        if not cs:
            raise HTTPException(status_code=404, detail="سانس قرارداد یافت نشد")
        slot = self.uow.slots.get_by_id(cs.slot_id)
        if not slot:
            raise HTTPException(status_code=404, detail="سانس فیزیکی یافت نشد")
        return cs, slot

    def exclude_session(self, contract: Contract, cs_id: int, actor: User, reason: str):
        """استثنای یک سانس (توسط مدیر) — فقط سانس آینده؛ اقساط تغییری نمی‌کند (مستند).

        سانس متناظر اگر آینده باشد آزاد می‌شود (AVAILABLE + خارج از ید قرارداد).
        """
        if contract.status != ContractStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="فقط قرارداد فعال قابل تغییر برنامه است")
        cs, slot = self._get_session_slot(contract, cs_id)
        if cs.status == ContractSlotStatus.EXCLUDED:
            raise HTTPException(status_code=400, detail="این سانس قبلاً استثنا شده است")
        if cs.status == ContractSlotStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="سانس انجام‌شده قابل استثنا نیست")
        eff_date, eff_time = cs_effective(cs)
        if is_past_slot(eff_date, eff_time or slot.start_time):
            raise HTTPException(status_code=400, detail="سانس گذشته قابل استثنا نیست")
        if slot.status != SlotStatus.RESERVED:
            raise HTTPException(status_code=400, detail="سانس در اختیار قرارداد نیست")
        self.uow.slots.release_contract_slot(slot.id)
        self.uow.contract_slots.cancel_session(cs.id, reason, actor.id)
        self._log(contract.id, ContractAuditAction.SESSION_EXCLUDED, actor.id,
                  {"contract_slot_id": cs.id, "session_date": str(eff_date), "reason": reason})
        return self.uow.contract_slots.get_by_id(cs.id)

    def reschedule_session(self, contract: Contract, cs_id: int, data: ContractSessionReschedule, actor: User):
        """جابه‌جایی یک سانس — check_slot_conflict + قفل‌های معلق Redis؛ گذشته ۴۰۰ فارسی."""
        if contract.status != ContractStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="فقط قرارداد فعال قابل تغییر برنامه است")
        cs, slot = self._get_session_slot(contract, cs_id)
        if cs.status not in (ContractSlotStatus.SCHEDULED, ContractSlotStatus.RESCHEDULED):
            raise HTTPException(status_code=400, detail="این سانس قابل جابه‌جایی نیست")
        eff_date, eff_time = cs_effective(cs)
        if is_past_slot(eff_date, eff_time or slot.start_time):
            raise HTTPException(status_code=400, detail="سانس گذشته را نمی‌توان جابه‌جا کرد")
        if is_past_slot(data.new_date, data.new_time):
            raise HTTPException(status_code=400, detail="نمی‌توان سانس را به زمان گذشته منتقل کرد")
        if slot.status != SlotStatus.RESERVED:
            raise HTTPException(status_code=400, detail="سانس دیگر در اختیار قرارداد نیست؛ جابه‌جایی ممکن نیست")

        conflict = self.uow.slots.check_slot_conflict(
            contract.venue_id, data.new_date, data.new_time, slot.duration, exclude_slot_id=slot.id)
        if conflict is not None:
            raise HTTPException(
                status_code=409,
                detail=f"تداخل زمانی با سانس {conflict.slot_date} ساعت {conflict.start_time} وجود دارد")
        # سانس مبدا mعلق نیست؛ مقصد با check_slot_conflict پوشش داده می‌شود

        self.uow.slots.relocate_contract_slot(slot.id, data.new_date, data.new_time)
        now = _now()
        obj = self.uow.contract_slots.get_by_id(cs.id)
        obj.rescheduled_date = data.new_date
        obj.rescheduled_time = data.new_time
        obj.status = ContractSlotStatus.RESCHEDULED
        obj.handled_by = actor.id
        obj.handled_at = now
        obj.updated_at = now
        self.uow.session.add(obj)
        self.uow.session.flush()
        self._log(contract.id, ContractAuditAction.SESSION_RESCHEDULED, actor.id, {
            "contract_slot_id": cs.id, "from": str(eff_date),
            "to": data.new_date.isoformat() + " " + data.new_time.strftime("%H:%M"),
        })
        return obj

    def request_session_cancel(self, contract: Contract, cs_id: int, actor: User, reason: str):
        """درخواست لغو تک‌سانس توسط کاربر — فقط ثبت و اطلاع‌رسانی به مدیر (اجرا با مدیر)."""
        if contract.status != ContractStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="فقط قرارداد فعال درخواست لغو سانس دارد")
        cs, slot = self._get_session_slot(contract, cs_id)
        if cs.status not in (ContractSlotStatus.SCHEDULED, ContractSlotStatus.RESCHEDULED):
            raise HTTPException(status_code=400, detail="این سانس قابل لغو نیست")
        eff_date, eff_time = cs_effective(cs)
        if is_past_slot(eff_date, eff_time or slot.start_time):
            raise HTTPException(status_code=400, detail="سانس گذشته قابل درخواست لغو نیست")
        self.uow.contract_slots.set_cancel_request(cs.id, reason)
        self._log(contract.id, ContractAuditAction.SESSION_CANCEL_REQUESTED, actor.id,
                  {"contract_slot_id": cs.id, "session_date": str(eff_date), "reason": reason})
        return self.uow.contract_slots.get_by_id(cs.id)

    def move_whole_contract(self, contract: Contract, data: ContractMoveWhole, actor: User) -> int:
        """جابه‌جایی کل قرارداد به روز/ساعت جدید — pre-check کامل؛ اگر هر تداخلی
        باشد با ذکر همه‌ی تصادم‌ها ۴۰۰ برمی‌گرداند (و هیچ چیزی تغییر نمی‌کند).
        """
        if contract.status != ContractStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="فقط قرارداد فعال قابل منتقل‌کردن است")
        days = self.contract_days(contract)
        multi_day = len(days) > 1
        if multi_day and data.day_of_week not in days:
            # مستند: قرارداد چندروزه فقط با تغییر ساعت/مدت جابه‌جا می‌شود؛
            # تغییر الگوی روزها برنامه هر روز را می‌شکند
            raise HTTPException(
                status_code=400,
                detail="قرارداد چندروزه فقط با تغییر ساعت قابل جابه‌جایی است")
        duration = contract.duration
        if data.end_time:
            if data.end_time <= data.start_time:
                raise HTTPException(status_code=400, detail="ساعت پایان باید بعد از شروع باشد")
            duration = (datetime.combine(date.today(), data.end_time)
                        - datetime.combine(date.today(), data.start_time)).seconds // 60

        # مپ هر سانس آینده به تاریخ جدید (همان هفته / شیفت نسبی به روز مقصد)
        movers: List[Tuple[ContractSlot, Slot, date, time]] = []
        own_slot_ids: set = set()
        for cs in self.uow.contract_slots.get_by_contract(contract.id):
            if cs.status not in (ContractSlotStatus.SCHEDULED, ContractSlotStatus.RESCHEDULED):
                continue
            slot = self.uow.slots.get_by_id(cs.slot_id)
            if slot is None or slot.status != SlotStatus.RESERVED:
                continue
            eff_date, _ = cs_effective(cs)
            if is_past_slot(eff_date, slot.start_time):
                continue
            own_slot_ids.add(slot.id)
            if multi_day:
                new_date = eff_date  # جابه‌جایی چندروزه = فقط ساعت، روی همان روز خود
            else:
                delta = (data.day_of_week - eff_date.weekday()) % 7
                new_date = eff_date + timedelta(days=delta)
            movers.append((cs, slot, new_date, data.start_time))

        if not movers:
            raise HTTPException(status_code=400, detail="سانس آینده‌ای برای جابه‌جایی وجود ندارد")

        # ── pre-check: تک‌تک مقصدها (به‌جز سانس‌های خود قرارداد که هم‌زمان جابه‌جا می‌شوند) ──
        collisions = []
        for cs, slot, new_date, new_time in movers:
            conflict = self.uow.slots.check_slot_conflict(
                contract.venue_id, new_date, new_time, duration, exclude_slot_id=slot.id)
            if conflict is not None and conflict.id not in own_slot_ids:
                collisions.append({
                    "contract_slot_id": cs.id,
                    "to_date": str(new_date), "to_time": str(new_time),
                    "collides_with_slot_id": conflict.id,
                    "collides_at": str(conflict.slot_date) + " " + str(conflict.start_time),
                })
        if collisions:
            raise HTTPException(status_code=400, detail={
                "code": "MOVE_HAS_COLLISIONS",
                "message": "جابه‌جایی کل قرارداد ممکن نیست؛ " + str(len(collisions)) + " سانس با دیگر رزروها تداخل دارد",
                "collisions": collisions,
            })

        now = _now()
        for cs, slot, new_date, new_time in movers:
            self.uow.slots.relocate_contract_slot(slot.id, new_date, new_time)
            obj = self.uow.contract_slots.get_by_id(cs.id)
            obj.rescheduled_date = new_date
            obj.rescheduled_time = new_time
            obj.status = ContractSlotStatus.RESCHEDULED
            obj.handled_by = actor.id
            obj.handled_at = now
            obj.updated_at = now
            self.uow.session.add(obj)
        updates = {"start_time": data.start_time, "duration": duration,
                   "updated_at": now}
        if not multi_day:
            updates["day_of_week"] = data.day_of_week
        self.uow.contracts.update(contract.id, updates)
        self._log(contract.id, ContractAuditAction.WHOLE_CONTRACT_RESCHEDULED, actor.id, {
            "to": "day_of_week=" + str(data.day_of_week) + " time=" + str(data.start_time),
            "moved_sessions": len(movers),
            "old_day_of_week": contract.day_of_week, "old_start_time": str(contract.start_time),
        })
        return len(movers)
    # ─────────────────────────── خواندنی‌ها / خلاصه اقتصادى ───────────────────────────

    def economics(self, contract: Contract) -> dict:
        """خلاصه مالی/رزرو — schedule منهای excluded؛ paid از تسهیماتِ تأییدشده."""
        sessions = self.uow.contract_slots.get_by_contract(contract.id)
        excluded = [c for c in sessions if c.status == ContractSlotStatus.EXCLUDED]
        completed = [c for c in sessions if c.status == ContractSlotStatus.COMPLETED]
        scheduled = [c for c in sessions if c.status in (ContractSlotStatus.SCHEDULED, ContractSlotStatus.RESCHEDULED)]
        total_sessions = len(sessions) - len(excluded)
        payments = [p for p in self.uow.contract_payments.get_by_contract(contract.id) if not p.is_voided]
        paid_amount = sum(p.amount for p in payments if p.is_paid)
        overdue = any(is_overdue_now(p) for p in payments)
        return {
            "total_sessions": total_sessions,
            "scheduled_sessions": len(scheduled),
            "completed_sessions": len(completed),
            "excluded_sessions": len(excluded),
            "paid_amount": paid_amount,
            "remaining_amount": contract.total_amount - paid_amount,
            "overdue": overdue,
            "played_ratio": round(len(completed) / total_sessions * 100, 2) if total_sessions else 0.0,
        }

    def session_view(self, contract: Contract, cs: ContractSlot) -> dict:
        slot = self.uow.slots.get_by_id(cs.slot_id)
        return {
            "id": cs.id,
            "slot_id": cs.slot_id,
            "session_date": cs.session_date,
            "start_time": slot.start_time if slot else cs.rescheduled_time,
            "duration": slot.duration if slot else contract.duration,
            "status": cs.status.value if hasattr(cs.status, "value") else str(cs.status),
            "slot_status": (slot.status.value if hasattr(slot.status, "value") else str(slot.status)) if slot else None,
            "is_past": bool(slot and is_past_slot(cs.session_date, slot.start_time)),
            "cancel_requested": cs.cancel_requested,
            "cancel_requested_at": cs.cancel_requested_at,
            "cancellation_reason": cs.cancellation_reason,
            "rescheduled_date": cs.rescheduled_date,
            "rescheduled_time": cs.rescheduled_time,
            "exclusion_reason": cs.exclusion_reason,
        }

    def to_detail(self, contract: Contract) -> dict:
        """نمایش کامل — فیلدهای قرارداد + venue/user + sessions + payments + economics."""
        from app.schemas.contract import ContractResponse
        base = ContractResponse.model_validate(contract).model_dump()
        venue = self.uow.venues.get_by_id(contract.venue_id)
        user = self.uow.users.get_by_id(contract.user_id)
        base.update({
            "venue_name": venue.name if venue else None,
            "user_full_name": user.full_name if user else None,
            "sessions": [self.session_view(contract, cs)
                         for cs in self.uow.contract_slots.get_by_contract(contract.id)],
            "payments": [{
                "id": p.id, "amount": p.amount, "due_date": p.due_date, "label": p.label,
                "record_type": p.record_type, "installment_no": p.installment_no,
                "is_paid": p.is_paid, "paid_at": p.paid_at, "is_overdue": p.is_overdue,
                "is_voided": p.is_voided, "void_reason": p.void_reason,
                "transaction_id": p.transaction_id,
            } for p in self.uow.contract_payments.get_by_contract(contract.id)],
            "economics": self.economics(contract),
        })
        return base

    def manager_rows(self, contracts: List[Contract]) -> List[dict]:
        """ردیف‌های لیست مدیر — enrich با venue/user و شمارش سانس (بدون N+1 فاحش)."""
        from app.schemas.contract import ContractResponse
        if not contracts:
            return []
        venue_ids = {c.venue_id for c in contracts}
        user_ids = {c.user_id for c in contracts}
        venues = {v.id: v for v in self.uow.session.exec(
            select(Venue).where(Venue.id.in_(list(venue_ids)))).all()}
        users = {u.id: u for u in self.uow.session.exec(
            select(User).where(User.id.in_(list(user_ids)))).all()}
        # اقساط یک‌باره برای همه قراردادهای صفحه (fixup §8b — بدون N+1)
        pays_by_cid: dict = {}
        if contracts:
            pstmt = select(ContractPayment).where(
                ContractPayment.contract_id.in_([c.id for c in contracts]))
            for p in self.uow.session.exec(pstmt).all():
                pays_by_cid.setdefault(p.contract_id, []).append(p)
        rows = []
        today = date.today()
        for c in contracts:
            sessions = self.uow.contract_slots.get_by_contract(c.id)
            upcoming = len([s for s in sessions
                            if s.status in (ContractSlotStatus.SCHEDULED, ContractSlotStatus.RESCHEDULED)
                            and (s.rescheduled_date or s.session_date) >= today])
            pays = [p for p in pays_by_cid.get(c.id, []) if not p.is_voided]
            # outstanding: total − paid با احتساب حذفِ excluded از total در زمان
            # اصلاحِ تأیید (total_amount خودِ سرور بعد از amendment است)
            outstanding = c.total_amount - sum(p.amount for p in pays if p.is_paid)
            rows.append({
                "contract": ContractResponse.model_validate(c).model_dump(),
                "venue_name": venues[c.venue_id].name if c.venue_id in venues else "نامشخص",
                "user_full_name": (users[c.user_id].full_name if c.user_id in users else None),
                "user_phone": (users[c.user_id].phone if c.user_id in users else None),
                "outstanding_amount": outstanding,
                "sessions_upcoming": upcoming,
                "total_sessions": len([s for s in sessions if s.status != ContractSlotStatus.EXCLUDED]),
            })
        return rows

    def payment_rows(self, contract: Contract) -> List[dict]:
        return [{
            "id": p.id, "amount": p.amount, "due_date": p.due_date, "label": p.label,
            "record_type": p.record_type, "installment_no": p.installment_no,
            "is_paid": p.is_paid, "paid_at": p.paid_at, "is_overdue": p.is_overdue,
            "is_voided": p.is_voided, "void_reason": p.void_reason,
            "transaction_id": p.transaction_id,
        } for p in self.uow.contract_payments.get_by_contract(contract.id)]

    def audit_trail(self, contract: Contract) -> List[dict]:
        out = []
        for ev in self.uow.contract_audits.get_by_contract(contract.id):
            try:
                data = json.loads(ev.data or "{}")
            except ValueError:
                data = {"raw": ev.data}
            out.append({
                "id": ev.id,
                "action": ev.action.value if hasattr(ev.action, "value") else str(ev.action),
                "actor_id": ev.actor_id,
                "data": data,
                "created_at": ev.created_at,
            })
        return out