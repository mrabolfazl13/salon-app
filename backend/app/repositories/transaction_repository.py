# backend/app/repositories/transaction_repository.py
"""ریپازیتوری دفتر کل — تجمیع SQL (sum/groupby/date-trunc) به‌جای N+1.

تاریخ‌ها: روی SQLite با strftime و روی SQLite/PG با extract کار می‌کند؛
کلید روز رشته‌ی ایزو، ساعت و روزِ هفته عدد ۰-۶ (۰=یکشنبه) هستند.
"""
from datetime import date
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import and_, case, cast, func as sa_func, Integer
from sqlmodel import Session, select

from app.models.transaction import (
    ExpenseCategory,
    FinancialTransaction,
    TransactionDirection,
    TransactionSourceType,
    TransactionStatus,
    TransactionType,
)
from app.repositories.base import BaseRepository

# اثر هر ردیف روی موجودیِ شخص: مثبت = بدهکارتر، منفی = تسویه/اعتبار
_BALANCE_TYPE_NEGATIVE = (TransactionType.PAYMENT, TransactionType.CREDIT)
_BALANCE_TYPE_POSITIVE = (TransactionType.REFUND,)


def _person_delta_expr() -> Any:
    tx = FinancialTransaction
    return case(
        (tx.status == TransactionStatus.VOIDED, 0),
        (tx.type == TransactionType.RECEIVABLE, tx.amount),
        (tx.type.in_(_BALANCE_TYPE_NEGATIVE), -tx.amount),
        (tx.type.in_(_BALANCE_TYPE_POSITIVE), tx.amount),
        (tx.type == TransactionType.DISCOUNT, -tx.amount),
        (tx.type == TransactionType.ADJUSTMENT,
         case((tx.direction == TransactionDirection.INCOME, tx.amount), else_=-tx.amount)),
        else_=0,
    )


class TransactionRepository(BaseRepository[FinancialTransaction]):

    def __init__(self, session: Session):
        super().__init__(FinancialTransaction, session)

    # ─────────────────────────── کمکى ───────────────────────────

    @property
    def _dialect(self) -> str:
        return self.session.get_bind().dialect.name

    def _scope(self, stmt, venue_ids: Optional[List[int]]):
        if venue_ids is not None:
            stmt = stmt.where(FinancialTransaction.venue_id.in_(venue_ids))
        return stmt

    def _range(self, stmt, from_date: Optional[date], to_date: Optional[date]):
        if from_date:
            stmt = stmt.where(sa_func.date(FinancialTransaction.occurred_at) >= str(from_date))
        if to_date:
            stmt = stmt.where(sa_func.date(FinancialTransaction.occurred_at) <= str(to_date))
        return stmt

    def get_by_idempotency_key(self, key: str) -> Optional[FinancialTransaction]:
        stmt = select(FinancialTransaction).where(FinancialTransaction.idempotency_key == key)
        return self.session.exec(stmt).first()

    # ─────────────────────────── لیست/فیلتر ───────────────────────────

    def list_transactions(
        self,
        venue_ids: Optional[List[int]] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        tx_type: Optional[str] = None,
        direction: Optional[str] = None,
        status: Optional[str] = None,
        source_type: Optional[str] = None,
        source_id: Optional[int] = None,
        counterparty: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[FinancialTransaction], int]:
        stmt = select(FinancialTransaction)
        stmt = self._scope(stmt, venue_ids)
        stmt = self._range(stmt, from_date, to_date)
        if tx_type:
            stmt = stmt.where(FinancialTransaction.type == tx_type)
        if direction:
            stmt = stmt.where(FinancialTransaction.direction == direction)
        if status:
            stmt = stmt.where(FinancialTransaction.status == status)
        if source_type:
            stmt = stmt.where(FinancialTransaction.source_type == source_type)
        if source_id is not None:
            stmt = stmt.where(FinancialTransaction.source_id == source_id)
        if counterparty is not None:
            stmt = stmt.where(FinancialTransaction.counterparty == counterparty)

        count_stmt = self._scope(select(sa_func.count()).select_from(FinancialTransaction), venue_ids)
        count_stmt = self._range(count_stmt, from_date, to_date)
        # شمارنده با همان فیلترها (به‌جزcount) — بازسازی فیلترهای اختیاری
        if tx_type:
            count_stmt = count_stmt.where(FinancialTransaction.type == tx_type)
        if direction:
            count_stmt = count_stmt.where(FinancialTransaction.direction == direction)
        if status:
            count_stmt = count_stmt.where(FinancialTransaction.status == status)
        if source_type:
            count_stmt = count_stmt.where(FinancialTransaction.source_type == source_type)
        if source_id is not None:
            count_stmt = count_stmt.where(FinancialTransaction.source_id == source_id)
        if counterparty is not None:
            count_stmt = count_stmt.where(FinancialTransaction.counterparty == counterparty)

        total = self.session.exec(count_stmt).one()
        stmt = stmt.order_by(FinancialTransaction.occurred_at.desc(), FinancialTransaction.id.desc())
        rows = self.session.exec(stmt.offset(offset).limit(limit)).all()
        return list(rows), int(total)

    # ─────────────────────────── تجمیعات ───────────────────────────

    def sum_by(
        self,
        venue_ids: Optional[List[int]] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        direction: Optional[str] = None,
        types: Optional[List[str]] = None,
    ) -> int:
        """مجموع amount ردیف‌های غیرباطل با فیلترهای اختیاری."""
        stmt = select(sa_func.coalesce(sa_func.sum(FinancialTransaction.amount), 0)).where(
            FinancialTransaction.status != TransactionStatus.VOIDED)
        stmt = self._scope(stmt, venue_ids)
        stmt = self._range(stmt, from_date, to_date)
        if direction:
            stmt = stmt.where(FinancialTransaction.direction == direction)
        if types:
            stmt = stmt.where(FinancialTransaction.type.in_(types))
        return int(self.session.exec(stmt).one() or 0)

    def sum_totals(
        self,
        venue_ids: Optional[List[int]] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        include_null_venue: bool = True,
    ) -> Dict[str, int]:
        """مجموع غیرباطلِ درآمدها و هزینه‌ها — کلیدها: income/expense/count."""
        stmt = select(
            sa_func.coalesce(sa_func.sum(case(
                (and_(
                    FinancialTransaction.status != TransactionStatus.VOIDED,
                    FinancialTransaction.direction == TransactionDirection.INCOME),
                 FinancialTransaction.amount), else_=0)), 0),
            sa_func.coalesce(sa_func.sum(case(
                (and_(
                    FinancialTransaction.status != TransactionStatus.VOIDED,
                    FinancialTransaction.direction == TransactionDirection.EXPENSE),
                 FinancialTransaction.amount), else_=0)), 0),
            sa_func.count(),
        )
        if venue_ids is not None and not include_null_venue:
            stmt = stmt.where(FinancialTransaction.venue_id.in_(venue_ids))
        elif venue_ids is not None:
            stmt = stmt.where(FinancialTransaction.venue_id.in_(venue_ids))
        stmt = self._range(stmt, from_date, to_date)
        income, expense, count = self.session.exec(stmt).one()
        return {"income": int(income or 0), "expense": int(expense or 0), "count": int(count or 0)}

    def _key_expr(self, group_by: str):
        col = FinancialTransaction.occurred_at
        if group_by == "day":
            return sa_func.date(col)
        if self._dialect == "sqlite":
            if group_by == "hour":
                return cast(sa_func.strftime("%H", col), Integer)
            if group_by == "weekday":
                return cast(sa_func.strftime("%w", col), Integer)
        else:
            if group_by == "hour":
                return cast(sa_func.extract("hour", col), Integer)
            if group_by == "weekday":
                return cast(sa_func.extract("dow", col), Integer)
        raise ValueError(f"گروه‌بندی ناشناخته: {group_by}")

    def series_grouped(
        self,
        group_by: str,
        venue_ids: Optional[List[int]] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
    ) -> List[Tuple[str, int, int, int]]:
        """(کلید, درآمد, هزینه, تعداد) به ترتیب کلید — برای نمودارهای درآمد."""
        if group_by == "venue":
            key_col = FinancialTransaction.venue_id
            order_key = FinancialTransaction.venue_id
        else:
            key_col = self._key_expr(group_by)
            order_key = key_col
        stmt = select(
            key_col,
            sa_func.coalesce(sa_func.sum(case(
                (and_(
                    FinancialTransaction.status != TransactionStatus.VOIDED,
                    FinancialTransaction.direction == TransactionDirection.INCOME),
                 FinancialTransaction.amount), else_=0)), 0),
            sa_func.coalesce(sa_func.sum(case(
                (and_(
                    FinancialTransaction.status != TransactionStatus.VOIDED,
                    FinancialTransaction.direction == TransactionDirection.EXPENSE),
                 FinancialTransaction.amount), else_=0)), 0),
            sa_func.count(),
        )
        stmt = self._scope(stmt, venue_ids)
        stmt = self._range(stmt, from_date, to_date)
        stmt = stmt.group_by(key_col).order_by(order_key)
        out = []
        for key, income, expense, count in self.session.exec(stmt).all():
            out.append((str(key), int(income or 0), int(expense or 0), int(count or 0)))
        return out

    def revenue_by_source(
        self,
        venue_ids: Optional[List[int]] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
    ) -> List[Tuple[str, int, int]]:
        """درآمد نقدی (غیرباطل، direction=income به‌جز مطالبه‌ی نشده) به تفکیک منبع."""
        stmt = select(
            FinancialTransaction.source_type,
            sa_func.coalesce(sa_func.sum(FinancialTransaction.amount), 0),
            sa_func.count(),
        ).where(
            FinancialTransaction.status != TransactionStatus.VOIDED,
            FinancialTransaction.direction == TransactionDirection.INCOME,
            FinancialTransaction.type.in_((TransactionType.PAYMENT, TransactionType.CREDIT)),
        )
        stmt = self._scope(stmt, venue_ids)
        stmt = self._range(stmt, from_date, to_date)
        stmt = stmt.group_by(FinancialTransaction.source_type)
        out = []
        for src, amount, count in self.session.exec(stmt).all():
            key = src.value if hasattr(src, "value") else str(src)
            out.append((key, int(amount or 0), int(count or 0)))
        return out

    def receivables_totals(
        self,
        venue_ids: Optional[List[int]] = None,
    ) -> Dict[str, int]:
        """مجموع مطالبه (receivable) و وصولیِ (payment) مرتبط با اشخاص."""
        stmt = select(
            sa_func.coalesce(sa_func.sum(case(
                (and_(
                    FinancialTransaction.status != TransactionStatus.VOIDED,
                    FinancialTransaction.type == TransactionType.RECEIVABLE),
                 FinancialTransaction.amount), else_=0)), 0),
            sa_func.coalesce(sa_func.sum(case(
                (and_(
                    FinancialTransaction.status != TransactionStatus.VOIDED,
                    FinancialTransaction.type.in_(_BALANCE_TYPE_NEGATIVE + _BALANCE_TYPE_POSITIVE + (TransactionType.DISCOUNT,))),
                 FinancialTransaction.amount), else_=0)), 0),
        ).where(FinancialTransaction.counterparty.is_not(None))
        stmt = self._scope(stmt, venue_ids)
        receivable, settled = self.session.exec(stmt).one()
        return {"receivable": int(receivable or 0), "settled": int(settled or 0)}

    def person_balances(
        self,
        venue_ids: Optional[List[int]] = None,
    ) -> Dict[int, Dict[str, Any]]:
        """موجودی هر شخص: {user_id: {balance, last_activity}} (مثبت = بدهکار)."""
        delta = _person_delta_expr()
        stmt = select(
            FinancialTransaction.counterparty,
            sa_func.coalesce(sa_func.sum(delta), 0),
            sa_func.max(FinancialTransaction.occurred_at),
        ).where(FinancialTransaction.counterparty.is_not(None))
        stmt = self._scope(stmt, venue_ids)
        stmt = stmt.group_by(FinancialTransaction.counterparty)
        result: Dict[int, Dict[str, Any]] = {}
        for user_id, balance, last_activity in self.session.exec(stmt).all():
            if balance is None:
                continue
            balance = int(balance)
            if balance == 0:
                continue
            result[int(user_id)] = {"balance": balance, "last_activity": last_activity}
        return result

    def statement_rows(
        self,
        user_id: int,
        venue_ids: Optional[List[int]] = None,
        before: Optional[date] = None,
        from_date: Optional[date] = None,
    ) -> Tuple[List[FinancialTransaction], int]:
        """ردیف‌های حساب شخص (کرونولوژیک) + موجودی افتتاحیه قبل از بازه."""
        delta = _person_delta_expr()
        opening = 0
        if before:
            opening_stmt = select(sa_func.coalesce(sa_func.sum(delta), 0)).where(
                FinancialTransaction.counterparty == user_id,
                sa_func.date(FinancialTransaction.occurred_at) < str(before))
            opening_stmt = self._scope(opening_stmt, venue_ids)
            opening = int(self.session.exec(opening_stmt).one() or 0)

        stmt = select(FinancialTransaction).where(
            FinancialTransaction.counterparty == user_id,
            FinancialTransaction.type != TransactionType.EXPENSE,
        )
        stmt = self._scope(stmt, venue_ids)
        if from_date:
            stmt = stmt.where(sa_func.date(FinancialTransaction.occurred_at) >= str(from_date))
        stmt = stmt.order_by(FinancialTransaction.occurred_at, FinancialTransaction.id)
        return list(self.session.exec(stmt).all()), opening

    # ─────────────────────────── وضعیت‌های رزرو ───────────────────────────

    def count_pending_payment_bookings(self, venue_ids: Optional[List[int]] = None) -> int:
        """رزروهای تأییدشده بدون هیچ فاکتور پرداخت‌شده."""
        from app.models.booking import Booking, BookingStatus
        from app.models.payment import BookingPayment, BookingPaymentStatus
        from app.models.slot import Slot
        from sqlalchemy import exists, not_

        paid_exists = exists().where(
            and_(
                BookingPayment.booking_id == Booking.id,
                BookingPayment.status == BookingPaymentStatus.PAID,
            )
        )
        stmt = select(sa_func.count()).select_from(Booking).where(
            Booking.status == BookingStatus.CONFIRMED,
            not_(paid_exists),
        )
        if venue_ids is not None:
            stmt = stmt.join(Slot, Booking.slot_id == Slot.id).where(Slot.venue_id.in_(venue_ids))
        return int(self.session.exec(stmt).one() or 0)

    def distinct_active_customers(
        self, venue_ids: Optional[List[int]], from_date: date, to_date: date
    ) -> int:
        """کاربرانِ فعال: کسی که در بازه رزرو/پرداخت/خرید اشتراک داشته."""
        from app.models.booking import Booking
        from app.models.membership import MembershipPurchase
        from app.models.slot import Slot

        users: set = set()
        stmt = select(Booking.user_id).join(Slot, Booking.slot_id == Slot.id).where(
            Slot.slot_date >= from_date, Slot.slot_date <= to_date)
        if venue_ids is not None:
            stmt = stmt.where(Slot.venue_id.in_(venue_ids))
        users.update(self.session.exec(stmt).all())

        stmt2 = select(MembershipPurchase.user_id).where(
            sa_func.date(MembershipPurchase.created_at) >= str(from_date),
            sa_func.date(MembershipPurchase.created_at) <= str(to_date))
        if venue_ids is not None:
            stmt2 = stmt2.where(MembershipPurchase.venue_id.in_(venue_ids))
        users.update(self.session.exec(stmt2).all())
        return len(users)


class ExpenseCategoryRepository(BaseRepository[ExpenseCategory]):

    def __init__(self, session: Session):
        super().__init__(ExpenseCategory, session)

    def list_for_scope(
        self,
        venue_ids: Optional[List[int]],
        include_inactive: bool = False,
    ) -> List[ExpenseCategory]:
        stmt = select(ExpenseCategory)
        if venue_ids is not None:
            conds = [ExpenseCategory.venue_id.is_(None)]
            conds.append(ExpenseCategory.venue_id.in_(venue_ids))
            from sqlalchemy import or_
            stmt = stmt.where(or_(*conds))
        if not include_inactive:
            stmt = stmt.where(ExpenseCategory.is_active == True)  # noqa: E712
        stmt = stmt.order_by(ExpenseCategory.name)
        return list(self.session.exec(stmt).all())

    def exists_name(self, name: str, venue_id: Optional[int], exclude_id: Optional[int] = None) -> bool:
        stmt = select(ExpenseCategory).where(
            ExpenseCategory.name == name,
            ExpenseCategory.venue_id == venue_id,
        )
        if exclude_id is not None:
            stmt = stmt.where(ExpenseCategory.id != exclude_id)
        return self.session.exec(stmt).first() is not None