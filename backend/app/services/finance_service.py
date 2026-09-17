# backend/app/services/finance_service.py
"""سرویس مالی — ثبت/ابطال دفتر کل، موجودی اشخاص، داشبورد و گزارش‌ها.

اصول:
- دفتر کل فقط-افزودنی است؛ اصلاح با ردیف adjustment/refund یا status=voided.
- همه محاسبات ریالی integer؛ در تقسیم، کسر باقیمانده با floor به سهم اول
  (ارگانایزر/صاحب قرارداد) اضافه می‌شود تا هیچ ریالی گم نشود —
  نگاشت شخص: receivable/adjustment-income مثبت، payment/credit/discount منفی،
  refund مثبت، adjustment-expense منفی؛ expense/transfer روی حساب شخص صفر.
"""
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException
from sqlmodel import select

from app.models.booking import Booking, BookingStatus
from app.models.contract import Contract, ContractStatus
from app.models.slot import Slot
from app.models.transaction import (
    CounterpartyType,
    ExpenseCategory,
    FinancialTransaction,
    TransactionDirection,
    TransactionMethod,
    TransactionSourceType,
    TransactionStatus,
    TransactionType,
)
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.utils.weekdays import WEEKDAY_NAMES_SUNDAY_FIRST, series_label
from app.schemas.finance import (
    FORCED_DIRECTION,
    AccountPaymentCreate,
    ExpenseCategoryCreate,
    ExpenseCategoryUpdate,
    TransactionCreate,
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _person_delta(tx: FinancialTransaction) -> int:
    """اثر ریالی یک ردیف روی موجودی شخص (مثبت = بدهکارتر). هم‌را با CASE ریپازیتوری."""
    if tx.status == TransactionStatus.VOIDED:
        return 0
    t = tx.type
    if t == TransactionType.RECEIVABLE:
        return tx.amount
    if t in (TransactionType.PAYMENT, TransactionType.CREDIT, TransactionType.DISCOUNT):
        return -tx.amount
    if t == TransactionType.REFUND:
        return tx.amount
    if t == TransactionType.ADJUSTMENT:
        return tx.amount if tx.direction == TransactionDirection.INCOME else -tx.amount
    return 0


class FinanceService:

    # تک‌منبع: app.utils.weekdays — کلیدهای سری ۰=یکشنبه (SQLite %w / PG dow)
    WEEKDAY_FA = list(WEEKDAY_NAMES_SUNDAY_FIRST)

    # ─────────────────────────── تقسیم integer ───────────────────────────

    @staticmethod
    def split_amount(total: int, n: int) -> List[int]:
        """تقسیم floor با انتساب صریح باقیمانده به سهم اول (ارگانایزر/صاحب قرارداد).

        مثال: split_amount(300_001, 4) = [75_001, 75_000, 75_000, 75_000] — جمع
        دقیقاً برابر total؛ باقیمانده هرگز silent drop نمی‌شود.
        """
        if n <= 0:
            raise HTTPException(status_code=400, detail="تعداد سهم باید مثبت باشد")
        base = total // n
        remainder = total - base * n
        return [base + (remainder if i == 0 else 0) for i in range(n)]

    # ─────────────────────────── دامنه دسترسی ───────────────────────────

    @staticmethod
    def manager_venue_ids(uow, user: User) -> Optional[List[int]]:
        """None یعنی بدون فیلتر سالن (super_admin). مدیر: فقط سالن‌های خودش."""
        if user.role == UserRole.SUPER_ADMIN:
            return None
        venue_ids = [v.id for v in uow.session.exec(
            select(Venue).where(Venue.manager_id == user.id)).all()]
        if not venue_ids:
            club = uow.clubs.get_one(owner_id=user.id)
            if club:
                venue_ids = [v.id for v in uow.session.exec(
                    select(Venue).where(Venue.club_id == club.id)).all()]
        return venue_ids

    @staticmethod
    def resolve_scope(uow, user: User, venue_id: Optional[int]) -> Optional[List[int]]:
        scope = FinanceService.manager_venue_ids(uow, user)
        if venue_id is None:
            if scope is not None and not scope:
                raise HTTPException(status_code=403, detail="هیچ سالنی تحت مدیریت شما نیست")
            return scope
        if scope is not None and venue_id not in scope:
            raise HTTPException(status_code=403, detail="شما مدیر این سالن نیستید")
        return [venue_id]

    @staticmethod
    def _ensure_tx_access(tx: FinancialTransaction, scope: Optional[List[int]]):
        if scope is None:
            return
        if tx.venue_id is None or tx.venue_id not in scope:
            raise HTTPException(status_code=403, detail="دسترسی به این تراکنش مجاز نیست")

    # ─────────────────────────── نوشتن در دفتر کل ───────────────────────────

    @staticmethod
    def record_tx(uow, tx: FinancialTransaction) -> FinancialTransaction:
        """درج ردیف با رعایت idempotency (در صورت تکرار کلید، رکورد موجود برمی‌گردد)."""
        if tx.idempotency_key:
            existing = uow.transactions.get_by_idempotency_key(tx.idempotency_key)
            if existing:
                return existing
        if tx.status == TransactionStatus.CLEARED and tx.cleared_at is None:
            tx.cleared_at = _utcnow()
        return uow.transactions.create(tx)

    @staticmethod
    def record_income(
        uow,
        *,
        amount: int,
        source_type: TransactionSourceType,
        source_id: Optional[int] = None,
        venue_id: Optional[int] = None,
        counterparty_user_id: Optional[int] = None,
        method: TransactionMethod = TransactionMethod.GATEWAY,
        tx_type: TransactionType = TransactionType.PAYMENT,
        description: str = "",
        idempotency_key: Optional[str] = None,
        created_by: Optional[int] = None,
        status: TransactionStatus = TransactionStatus.CLEARED,
    ) -> FinancialTransaction:
        """helper مشترک جریان‌های دیگر — ثبت درآمد (غیرباطلِ بدون حذف)."""
        tx = FinancialTransaction(
            idempotency_key=idempotency_key,
            type=tx_type,
            direction=TransactionDirection.INCOME,
            amount=amount,
            method=method,
            status=status,
            counterparty=counterparty_user_id,
            counterparty_type=CounterpartyType.USER if counterparty_user_id else None,
            venue_id=venue_id,
            source_type=source_type,
            source_id=source_id,
            description=description[:500],
            created_by=created_by,
        )
        return FinanceService.record_tx(uow, tx)

    @staticmethod
    def record_expense(
        uow,
        *,
        amount: int,
        expense_category_id: Optional[int],
        venue_id: Optional[int] = None,
        source_type: TransactionSourceType = TransactionSourceType.MANUAL,
        source_id: Optional[int] = None,
        method: TransactionMethod = TransactionMethod.CASH,
        tx_type: TransactionType = TransactionType.EXPENSE,
        direction: TransactionDirection = TransactionDirection.EXPENSE,
        counterparty_user_id: Optional[int] = None,
        description: str = "",
        idempotency_key: Optional[str] = None,
        created_by: Optional[int] = None,
    ) -> FinancialTransaction:
        tx = FinancialTransaction(
            idempotency_key=idempotency_key,
            type=tx_type,
            direction=direction,
            amount=amount,
            method=method,
            status=TransactionStatus.CLEARED,
            counterparty=counterparty_user_id,
            counterparty_type=CounterpartyType.USER if counterparty_user_id else None,
            venue_id=venue_id,
            expense_category_id=expense_category_id,
            source_type=source_type,
            source_id=source_id,
            description=description[:500],
            created_by=created_by,
        )
        return FinanceService.record_tx(uow, tx)

    @staticmethod
    def record_refund(
        uow,
        *,
        amount: int,
        original_source_id: Optional[int],
        venue_id: Optional[int] = None,
        counterparty_user_id: Optional[int] = None,
        source_type: TransactionSourceType = TransactionSourceType.BOOKING_PAYMENT,
        description: str = "بازگشت وجه",
        idempotency_key: Optional[str] = None,
        created_by: Optional[int] = None,
        method: TransactionMethod = TransactionMethod.GATEWAY,
    ) -> Optional[FinancialTransaction]:
        """وارونه‌سازی درآمد: ردیف expense جدید (اصلِ original حذف/دستکاری نمی‌شود)."""
        tx = FinancialTransaction(
            idempotency_key=idempotency_key,
            type=TransactionType.REFUND,
            direction=TransactionDirection.EXPENSE,
            amount=amount,
            method=method,
            status=TransactionStatus.CLEARED,
            counterparty=counterparty_user_id,
            counterparty_type=CounterpartyType.USER if counterparty_user_id else None,
            venue_id=venue_id,
            source_type=source_type,
            source_id=original_source_id,
            description=description[:500],
            created_by=created_by,
        )
        return FinanceService.record_tx(uow, tx)

    @staticmethod
    def create_manual(uow, data: TransactionCreate, actor: User,
                      scope: Optional[List[int]]) -> FinancialTransaction:
        forced = FORCED_DIRECTION.get(data.type)
        direction = forced or data.direction
        venue_id = data.venue_id
        if scope is not None:
            if venue_id is None:
                venue_id = scope[0] if len(scope) == 1 else None
            if venue_id is None or venue_id not in scope:
                raise HTTPException(status_code=400, detail="برای مدیر، انتخاب سالن معتبر الزامی است")
        if data.direction != direction:
            raise HTTPException(
                status_code=400,
                detail=f"جهت نوع «{data.type.value}» باید «{direction.value}» باشد")
        if data.type == TransactionType.EXPENSE:
            if data.expense_category_id is None:
                raise HTTPException(status_code=400, detail="برای هزینه، دسته‌بندی الزامی است")
            cat = uow.expense_categories.get_by_id(data.expense_category_id)
            if not cat:
                raise HTTPException(status_code=404, detail="دسته‌بندی هزینه یافت نشد")
            if cat.venue_id is not None and venue_id is not None and cat.venue_id != venue_id:
                raise HTTPException(status_code=400, detail="دسته‌بندی به سالن دیگری تعلق دارد")
        if data.counterparty is not None and not uow.users.get_by_id(data.counterparty):
            raise HTTPException(status_code=404, detail="کاربر طرف‌حساب یافت نشد")
        tx = FinancialTransaction(
            idempotency_key=data.idempotency_key,
            type=data.type,
            direction=direction,
            amount=data.amount,
            method=data.method,
            status=data.status,
            counterparty=data.counterparty,
            counterparty_type=data.counterparty_type if data.counterparty else None,
            counterparty_ref=data.counterparty_ref,
            venue_id=venue_id,
            expense_category_id=data.expense_category_id,
            source_type=data.source_type,
            source_id=data.source_id,
            description=data.description,
            created_by=actor.id,
            occurred_at=data.occurred_at or _utcnow(),
        )
        return FinanceService.record_tx(uow, tx)

    @staticmethod
    def get_transaction_in_scope(uow, tx_id: int, scope: Optional[List[int]]) -> FinancialTransaction:
        tx = uow.transactions.get_by_id(tx_id)
        if not tx:
            raise HTTPException(status_code=404, detail="تراکنش یافت نشد")
        FinanceService._ensure_tx_access(tx, scope)
        return tx

    @staticmethod
    def void_transaction(uow, tx_id: int, reason: str,
                         scope: Optional[List[int]]) -> FinancialTransaction:
        tx = FinanceService.get_transaction_in_scope(uow, tx_id, scope)
        if tx.status == TransactionStatus.VOIDED:
            raise HTTPException(status_code=400, detail="این تراکنش پیش‌تر باطل شده است")
        # دفتر کل فقط-افزودنی: خود ردیف حذف نمی‌شود؛ وضعیت به voided تبدیل می‌گردد
        updated = uow.transactions.update(tx.id, {
            "status": TransactionStatus.VOIDED,
            "void_reason": reason[:300],
        })
        return updated or tx

    @staticmethod
    def clear_transaction(uow, tx_id: int, scope: Optional[List[int]]) -> FinancialTransaction:
        tx = FinanceService.get_transaction_in_scope(uow, tx_id, scope)
        if tx.status == TransactionStatus.VOIDED:
            raise HTTPException(status_code=400, detail="تراکنش باطل‌شده قابل تأیید نیست")
        if tx.status == TransactionStatus.CLEARED:
            return tx
        updated = uow.transactions.update(tx.id, {
            "status": TransactionStatus.CLEARED,
            "cleared_at": _utcnow(),
        })
        return updated or tx

    # ─────────────────────────── موجودی اشخاص ───────────────────────────

    @staticmethod
    def compute_balance(uow, user_id: int, venue_ids: Optional[List[int]] = None) -> int:
        """موجودی شخص = مجموع درآمدهای منتسب (مطالبه/...) منهای تسویه‌ها.

        مثبت → بدهکار به مجموعه؛ منفی → حساب اعتباری/پیش‌پرداخت.
        """
        balances = uow.transactions.person_balances(venue_ids=venue_ids)
        return balances.get(user_id, {}).get("balance", 0)

    @staticmethod
    def ledger_statement(uow, user_id: int,
                         from_date: Optional[date], to_date: Optional[date],
                         scope: Optional[List[int]]) -> dict:
        if not uow.users.get_by_id(user_id):
            raise HTTPException(status_code=404, detail="کاربر یافت نشد")
        rows, opening = uow.transactions.statement_rows(
            user_id, venue_ids=scope, before=from_date, from_date=from_date)
        entries = []
        running = opening
        for tx in rows:
            if to_date and tx.occurred_at.date() > to_date:
                break
            delta = _person_delta(tx)
            running += delta
            entries.append({
                "id": tx.id,
                "occurred_at": tx.occurred_at,
                "type": tx.type.value,
                "direction": tx.direction.value,
                "amount": tx.amount,
                "delta": delta,
                "running_balance": running,
                "status": tx.status.value,
                "description": tx.description,
                "venue_id": tx.venue_id,
            })
        return {
            "user_id": user_id,
            "full_name": uow.users.get_by_id(user_id).full_name,
            "from_date": from_date,
            "to_date": to_date,
            "opening_balance": opening,
            "closing_balance": running,
            "entries": entries,
        }

    @staticmethod
    def person_payments(uow, user_id: int, data: AccountPaymentCreate,
                        actor: User, scope: Optional[List[int]]) -> FinancialTransaction:
        if not uow.users.get_by_id(user_id):
            raise HTTPException(status_code=404, detail="کاربر یافت نشد")
        venue_id = data.venue_id
        if scope is not None and (venue_id is None or venue_id not in scope):
            raise HTTPException(status_code=400, detail="برای مدیر، انتخاب سالن معتبر الزامی است")
        tx = FinancialTransaction(
            idempotency_key=data.idempotency_key,
            type=TransactionType.PAYMENT,
            direction=TransactionDirection.INCOME,
            amount=data.amount,
            method=data.method,
            status=TransactionStatus.CLEARED,
            counterparty=user_id,
            counterparty_type=CounterpartyType.USER,
            venue_id=venue_id,
            source_type=TransactionSourceType.MANUAL,
            description=data.description or f"پرداخت حساب کاربر #{user_id}",
            created_by=actor.id,
        )
        return FinanceService.record_tx(uow, tx)

    @staticmethod
    def accounts(uow, scope: Optional[List[int]], kind: str,
                 limit: int, offset: int) -> Tuple[List[dict], int]:
        balances = uow.transactions.person_balances(venue_ids=scope)
        if not balances:
            return [], 0
        users = {u.id: u for u in uow.session.exec(
            select(User).where(User.id.in_(list(balances.keys())))).all()}
        items = []
        for user_id, info in balances.items():
            k = "debtor" if info["balance"] > 0 else "creditor"
            if kind == "debtors" and k != "debtor":
                continue
            if kind == "creditors" and k != "creditor":
                continue
            user = users.get(user_id)
            items.append({
                "user_id": user_id,
                "full_name": user.full_name if user else None,
                "balance": info["balance"],
                "kind": k,
                "last_activity": info["last_activity"],
            })
        items.sort(key=lambda x: -abs(x["balance"]))
        total = len(items)
        return items[offset:offset + limit], total

    # ─────────────────────────── گزارش‌ها / داشبورد ───────────────────────────

    @staticmethod
    def _norm_range(from_date: Optional[date], to_date: Optional[date]) -> Tuple[date, date]:
        today = datetime.now(timezone.utc).date()  # UTC day (occurred_at is UTC)
        if from_date and not to_date:
            to_date = today
        if to_date and not from_date:
            from_date = today.replace(day=1)
        if not from_date and not to_date:
            from_date, to_date = today - timedelta(days=30), today
        if from_date > to_date:
            raise HTTPException(status_code=400, detail="تاریخ شروع نمی‌تواند بعد از پایان باشد")
        return from_date, to_date

    @staticmethod
    def revenue_series(uow, group_by: str, scope: Optional[List[int]],
                       from_date: Optional[date], to_date: Optional[date]) -> dict:
        f, t = FinanceService._norm_range(from_date, to_date)
        rows = uow.transactions.series_grouped(group_by, venue_ids=scope, from_date=f, to_date=t)
        points = []
        total = 0
        for key, income, expense, count in rows:
            net = income - expense
            total += net
            if group_by == "weekday":
                label = series_label(int(key))  # کلید ۰=یکشنبه — ثابت مشترک weekdays
            elif group_by == "hour":
                label = f"{int(key):02d}:00"
            else:
                label = key
            points.append({"key": str(key), "label": label,
                           "income": income, "expense": expense, "net": net, "count": count})
        return {"group_by": group_by, "from_date": f, "to_date": t,
                "points": points, "total_net": total}

    @staticmethod
    def revenue_by_source(uow, scope: Optional[List[int]],
                          from_date: Optional[date], to_date: Optional[date]) -> dict:
        f, t = FinanceService._norm_range(from_date, to_date)
        rows = uow.transactions.revenue_by_source(venue_ids=scope, from_date=f, to_date=t)
        by_source = [{"source": str(src.value if hasattr(src, "value") else src),
                      "income": int(amount), "count": int(count)}
                     for src, amount, count in rows]
        return {"from_date": f, "to_date": t, "by_source": by_source,
                "total": sum(x["income"] for x in by_source)}

    @staticmethod
    def occupancy(uow, scope: Optional[List[int]],
                  from_date: Optional[date], to_date: Optional[date]) -> dict:
        f, t = FinanceService._norm_range(from_date, to_date)
        total, occupied = uow.slots.occupancy_summary(scope, f, t)
        rate = round(occupied / total * 100, 2) if total else 0.0
        per_venue = []
        venue_ids = scope if scope is not None else list(
            uow.session.exec(select(Venue.id)).all())
        if venue_ids:
            by_venue = uow.slots.occupancy_by_venue(venue_ids, f, t)
            names = {v.id: v.name for v in uow.session.exec(
                select(Venue).where(Venue.id.in_(venue_ids))).all()}
            for vid in sorted(by_venue):
                vt, vo = by_venue[vid]
                per_venue.append({
                    "venue_id": vid, "venue_name": names.get(vid),
                    "total_active_slots": vt, "occupied_slots": vo,
                    "occupancy_rate": round(vo / vt * 100, 2) if vt else 0.0,
                })
        return {"from_date": f, "to_date": t, "total_active_slots": total,
                "occupied_slots": occupied, "occupancy_rate": rate, "per_venue": per_venue}

    @staticmethod
    def low_demand_slots(uow, scope: Optional[List[int]],
                         from_date: Optional[date], to_date: Optional[date],
                         threshold: float = 40.0) -> List[dict]:
        f, t = FinanceService._norm_range(from_date, to_date)
        profile = uow.slots.demand_profile(scope, f, t)
        rows = []
        for (weekday, hour), bucket in sorted(profile.items()):
            rate = round(bucket["booked"] / bucket["total"] * 100, 2) if bucket["total"] else 0.0
            if rate <= threshold:
                rows.append({"weekday": weekday, "hour": hour,
                             "total_slots": bucket["total"], "booked_slots": bucket["booked"],
                             "occupancy_rate": rate})
        return rows

    @staticmethod
    def dashboard(uow, actor: User, venue_id: Optional[int],
                  from_date: Optional[date], to_date: Optional[date],
                  venue_scope: Optional[List[int]] = None) -> dict:
        # venue_scope: مسیر کارکنان (RBAC) دامنه ازپیش‌بررسی‌شده می‌دهد؛
        # None ⇒ رفتار سابق resolve_scope (مدیر/باشگاه) دست‌نخورده.
        scope = venue_scope if venue_scope is not None else \
            FinanceService.resolve_scope(uow, actor, venue_id)
        f, t = FinanceService._norm_range(from_date, to_date)
        today = datetime.now(timezone.utc).date()  # UTC day (occurred_at is UTC)
        first_month = today.replace(day=1)

        # ماه قبل از ماهِ شامل `to` — همان فیلتر دامنه‌ی سالن‌ها
        prev_month_end = t.replace(day=1) - timedelta(days=1)
        prev_month_start = prev_month_end.replace(day=1)
        prev_totals = uow.transactions.sum_totals(scope, prev_month_start, prev_month_end)

        range_totals = uow.transactions.sum_totals(scope, f, t)
        today_totals = uow.transactions.sum_totals(scope, today, today)
        month_totals = uow.transactions.sum_totals(scope, first_month, today)
        today_received = uow.transactions.sum_by(
            venue_ids=scope, from_date=today, to_date=today,
            types=[TransactionType.PAYMENT.value, TransactionType.CREDIT.value])

        balances = uow.transactions.person_balances(venue_ids=scope)
        open_receivables = sum(v["balance"] for v in balances.values() if v["balance"] > 0)

        # قراردادها — فقط‌خواندنی روی جدول contracts
        stmt = select(Contract).where(Contract.status == ContractStatus.ACTIVE,
                                      Contract.start_date <= today, Contract.end_date >= today)
        if scope is not None:
            stmt = stmt.where(Contract.venue_id.in_(scope))
        active_contracts = len(uow.session.exec(stmt).all())
        soon = today + timedelta(days=14)
        stmt2 = select(Contract).where(Contract.status == ContractStatus.ACTIVE,
                                       Contract.end_date >= today, Contract.end_date <= soon)
        if scope is not None:
            stmt2 = stmt2.where(Contract.venue_id.in_(scope))
        expiring_soon = len(uow.session.exec(stmt2).all())

        def _booking_q(*statuses):
            s = select(Booking).join(Slot, Booking.slot_id == Slot.id).where(
                Slot.slot_date == today, Booking.status.in_(statuses))
            if scope is not None:
                s = s.where(Slot.venue_id.in_(scope))
            return s

        bookings_today = len(uow.session.exec(
            _booking_q(BookingStatus.CONFIRMED, BookingStatus.PENDING)).all())
        cancelled_today = len(uow.session.exec(
            _booking_q(BookingStatus.CANCELLED)).all())

        slot_total, slot_occupied = uow.slots.occupancy_summary(scope, today, today)
        occupancy_today = round(slot_occupied / slot_total * 100, 2) if slot_total else 0.0

        pending_payment_bookings = uow.transactions.count_pending_payment_bookings(scope)
        active_customers = uow.transactions.distinct_active_customers(scope, f, t)
        active_teams = FinanceService.active_teams_count(uow, scope)

        return {
            "from_date": f,
            "to_date": t,
            "venue_ids": scope,
            "today_revenue": today_totals["income"] - today_totals["expense"],
            "month_revenue": month_totals["income"] - month_totals["expense"],
            "today_received": today_received,
            "open_receivables": open_receivables,
            "active_contracts": active_contracts,
            "contracts_expiring_soon": expiring_soon,
            "bookings_today": bookings_today,
            "occupancy_today": occupancy_today,
            "cancelled_bookings": cancelled_today,
            "pending_payment_bookings": pending_payment_bookings,
            "expenses": range_totals["expense"],
            "gross_profit": range_totals["income"] - range_totals["expense"],
            "active_customers": active_customers,
            "prev_month_revenue": prev_totals["income"] - prev_totals["expense"],
            "prev_month_expenses": prev_totals["expense"],
            "active_teams": active_teams,
        }

    @staticmethod
    def active_teams_count(uow, venue_ids: Optional[List[int]]) -> int:
        """تیم‌های فعال در دامنه.

        دامنه=None ⇒ همه تیم‌های is_active. با دامنه سالن ⇒ تیم‌های is_active که
        یا دست‌کم یک عضو فعالشان رزروِ غیرلغوشده در آن سالن(ها) دارند یا
        رزروی به تیم آنجا منسوب (TeamBooking) است.
        """
        from app.models.team import Team, TeamBooking, TeamMember, TeamMemberStatus
        from sqlmodel import col as sa_col
        base = select(Team.id).where(Team.is_active == True)  # noqa: E712
        if venue_ids is None:
            return len(uow.session.exec(base).all())
        if not venue_ids:
            return 0
        by_member = select(TeamMember.team_id).join(
            Booking, sa_col(Booking.user_id) == sa_col(TeamMember.user_id)
        ).join(Slot, sa_col(Booking.slot_id) == sa_col(Slot.id)).where(
            TeamMember.status == TeamMemberStatus.ACTIVE,
            Slot.venue_id.in_(venue_ids),
            Booking.status != BookingStatus.CANCELLED,
        )
        by_team_booking = select(TeamBooking.team_id).join(
            Booking, sa_col(TeamBooking.booking_id) == sa_col(Booking.id)
        ).join(Slot, sa_col(Booking.slot_id) == sa_col(Slot.id)).where(
            Slot.venue_id.in_(venue_ids),
        )
        team_ids = {int(r) for r in uow.session.exec(by_member).all()}
        team_ids |= {int(r) for r in uow.session.exec(by_team_booking).all()}
        # هر دو مسیر حداقل یک عضو فعال می‌طلبد
        ids_with_active = {int(r) for r in uow.session.exec(
            select(TeamMember.team_id).where(TeamMember.status == TeamMemberStatus.ACTIVE)
        ).all()}
        team_ids &= ids_with_active
        if not team_ids:
            return 0
        return len(uow.session.exec(base.where(sa_col(Team.id).in_(list(team_ids)))).all())

    # ─────────────────────────── دسته‌بندی هزینه ───────────────────────────

    @staticmethod
    def list_categories(uow, scope: Optional[List[int]], include_inactive: bool) -> List[ExpenseCategory]:
        return uow.expense_categories.list_for_scope(scope, include_inactive)

    @staticmethod
    def create_category(uow, data: ExpenseCategoryCreate,
                        actor: User, scope: Optional[List[int]]) -> ExpenseCategory:
        venue_id = data.venue_id
        if scope is not None:
            if venue_id is None or venue_id not in scope:
                raise HTTPException(status_code=400, detail="برای مدیر، انتخاب سالن معتبر الزامی است")
        if uow.expense_categories.exists_name(data.name.strip(), venue_id):
            raise HTTPException(status_code=400, detail="این دسته‌بندی برای همین سالن تکراری است")
        return uow.expense_categories.create({
            "name": data.name.strip(), "venue_id": venue_id,
        })

    @staticmethod
    def _category_in_scope(uow, category_id: int, scope) -> ExpenseCategory:
        cat = uow.expense_categories.get_by_id(category_id)
        if not cat:
            raise HTTPException(status_code=404, detail="دسته‌بندی یافت نشد")
        if scope is not None and (cat.venue_id is None or cat.venue_id not in scope):
            raise HTTPException(status_code=403, detail="دسترسی به این دسته‌بندی مجاز نیست")
        return cat

    @staticmethod
    def update_category(uow, category_id: int, data: ExpenseCategoryUpdate,
                        scope) -> ExpenseCategory:
        cat = FinanceService._category_in_scope(uow, category_id, scope)
        changes: dict = {}
        if data.name is not None:
            if uow.expense_categories.exists_name(data.name.strip(), cat.venue_id, exclude_id=cat.id):
                raise HTTPException(status_code=400, detail="این دسته‌بندی برای همین سالن تکراری است")
            changes["name"] = data.name.strip()
        if data.is_active is not None:
            changes["is_active"] = data.is_active
        updated = uow.expense_categories.update(cat.id, changes) if changes else cat
        return updated or cat

    @staticmethod
    def delete_category(uow, category_id: int, scope) -> None:
        cat = FinanceService._category_in_scope(uow, category_id, scope)
        used = uow.transactions.count(expense_category_id=cat.id)
        if used:
            raise HTTPException(
                status_code=400,
                detail=f"این دسته‌بندی در {used} تراکنش استفاده شده و قابل حذف نیست؛ آن را غیرفعال کنید")
        # حذف نرم — دفتر کل به هیچ ردیفی اجازه حذف فیزیکی نمی‌دهد
        uow.expense_categories.delete(cat.id, soft_delete=True, delete_field="is_active")

    # ─────────────────────────── غنی‌سازی پاسخ ───────────────────────────

    @staticmethod
    def transactions_to_response(uow, txs: List[FinancialTransaction]) -> List[dict]:
        user_ids = {t.counterparty for t in txs if t.counterparty}
        cat_ids = {t.expense_category_id for t in txs if t.expense_category_id}
        names: Dict[int, str] = {}
        if user_ids:
            names = {u.id: u.full_name for u in uow.session.exec(
                select(User).where(User.id.in_(user_ids))).all()}
        cats: Dict[int, str] = {}
        if cat_ids:
            cats = {c.id: c.name for c in uow.session.exec(
                select(ExpenseCategory).where(ExpenseCategory.id.in_(cat_ids))).all()}
        venue_ids = {t.venue_id for t in txs if t.venue_id}
        venues: Dict[int, str] = {}
        if venue_ids:
            venues = {v.id: v.name for v in uow.session.exec(
                select(Venue).where(Venue.id.in_(venue_ids))).all()}
        out = []
        for t in txs:
            out.append({
                "id": t.id,
                "idempotency_key": t.idempotency_key,
                "type": t.type.value if hasattr(t.type, "value") else str(t.type),
                "direction": t.direction.value if hasattr(t.direction, "value") else str(t.direction),
                "amount": t.amount,
                "method": t.method.value if hasattr(t.method, "value") else str(t.method),
                "status": t.status.value if hasattr(t.status, "value") else str(t.status),
                "counterparty": t.counterparty,
                "counterparty_name": names.get(t.counterparty) if t.counterparty else None,
                "counterparty_type": (t.counterparty_type.value if hasattr(t.counterparty_type, "value")
                                      else t.counterparty_type) if t.counterparty_type else None,
                "counterparty_ref": t.counterparty_ref,
                "venue_id": t.venue_id,
                "venue_name": venues.get(t.venue_id) if t.venue_id else None,
                "expense_category_id": t.expense_category_id,
                "expense_category_name": cats.get(t.expense_category_id) if t.expense_category_id else None,
                "source_type": t.source_type.value if hasattr(t.source_type, "value") else str(t.source_type),
                "source_id": t.source_id,
                "description": t.description,
                "created_by": t.created_by,
                "occurred_at": t.occurred_at,
                "created_at": t.created_at,
                "cleared_at": t.cleared_at,
                "void_reason": t.void_reason,
            })
        return out

    @staticmethod
    def export_csv(uow, filter_kwargs: dict) -> str:
        import csv
        import io

        txs, _total = uow.transactions.list_transactions(**filter_kwargs)
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow([
            "id", "occurred_at", "type", "direction", "amount", "method", "status",
            "counterparty", "venue_id", "source_type", "source_id",
            "expense_category", "description", "idempotency_key", "void_reason",
        ])
        enriched = FinanceService.transactions_to_response(uow, txs)
        for t in enriched:
            writer.writerow([
                t["id"], t["occurred_at"].isoformat(), t["type"], t["direction"],
                t["amount"], t["method"], t["status"],
                t["counterparty"] or "", t["venue_id"] or "",
                t["source_type"], t["source_id"] or "",
                t["expense_category_name"] or "", t["description"],
                t["idempotency_key"] or "", t["void_reason"] or "",
            ])
        return buffer.getvalue()