"""مغایرگیری دفتر کل با پرداخت‌های درگاه (C14).

کلیدِ مقایسه **`BookingPayment.id`** است، نه `booking_id`: ردیف درآمدِ دفتر کل با
`source_type=booking_payment` و `source_id=payment.id` نوشته می‌شود (هم mock
`payments.py:133-144` و هم webhook `payments.py:243-252`). نسخۀ قبلی `source_id`
را با `payment.booking_id` مقایسه می‌کرد ⇒ هر پرداختِ سالم «مغایرت» می‌خورد و هر
برخوردِ عددیِ id دو جدول، دو رکون‌به‌دوِ بی‌ربط را با هم می‌گذاشت.

قاعده‌هایی که همین‌جا نقص‌های قبلی را می‌بندند:

۱) درآمد و برگشتش دو ردیفِ جدا با **همان** جفت `(source_type, source_id)` هستند،
   پس جمعِ زنده‌ها سنجیده می‌شود نه شمارِ ردیف‌ها؛ فیلترِ قبلی روی `source_type`
   تنها، ردیفِ بازگشت وجه را هم «درآمد» می‌شمرد.
۲) مقایسه per-payment است، پس پرداختِ چندسهمی (P003) در هم نمی‌ریزد — کلیدِ
   booking‌محورِ قبلی فقط آخرین سهم را نگه می‌داشت و بقیه را مغایرتِ جعلی می‌کرد.
۳) بازه فقط طرفِ «درایور» (پرداخت‌ها با `paid_at`، ردیف‌های دفتر کل با
   `occurred_at`) را می‌بُرد؛ جمع‌های خالص بدون بردِ زمانی خوانده می‌شوند تا
   برگشتِ وجهِ انجام‌شده در روزِ بعد، مغایرتِ شبیهِ «پول برگشت نشده» نسازد.
۴) تاریخ‌ها با `date(…) >= 'YYYY-MM-DD'` رشته‌ای مقایسه می‌شوند (الگوی
   `transaction_repository._range`) تا دامین naive/aware که راند ۲۷ از آن ردیف
   کرد دوباره باز نشود.
"""
from datetime import date, datetime, timezone
from typing import Dict, List, Optional
import json

from sqlalchemy import func as sa_func
from sqlmodel import col, select

from app.models.payment import BookingPayment, BookingPaymentStatus
from app.models.reconciliation_report import ReconciliationReport, ReconciliationStatus
from app.models.transaction import (
    FinancialTransaction, TransactionDirection, TransactionSourceType,
    TransactionStatus, TransactionType,
)


class ReconciliationService:
    """منطقِ خالصِ مقایسه + یک مسیرِ ماندگاری؛ بدون Celery و بدون درگاه."""

    @staticmethod
    def _period(cond, period_from: date, period_to: date):
        return [sa_func.date(cond) >= str(period_from),
                sa_func.date(cond) <= str(period_to)]

    @classmethod
    def _sums(cls, uow, source_ids: List[int], *, direction=None,
              tx_type=None) -> Dict[int, int]:
        """جمعِ زندهٔ ردیف‌های `booking_payment` به تفکیک `source_id` (در یک کوئری)."""
        if not source_ids:
            return {}
        conds = [FinancialTransaction.source_type == TransactionSourceType.BOOKING_PAYMENT,
                 FinancialTransaction.source_id.in_(source_ids),
                 FinancialTransaction.status != TransactionStatus.VOIDED]
        if direction is not None:
            conds.append(FinancialTransaction.direction == direction)
        if tx_type is not None:
            conds.append(FinancialTransaction.type == tx_type)
        stmt = (select(FinancialTransaction.source_id,
                        sa_func.coalesce(sa_func.sum(FinancialTransaction.amount), 0))
                .where(*conds).group_by(FinancialTransaction.source_id))
        return {int(sid): int(total) for sid, total in uow.session.exec(stmt).all() if sid}

    @classmethod
    def compare(cls, uow, *, period_from: date, period_to: date) -> dict:
        """مغایرت‌های بازه را برمی‌گرداند؛ هیچ چیزی نمی‌نویسد."""
        payments = list(uow.session.exec(
            select(BookingPayment).where(
                col(BookingPayment.paid_at).is_not(None),
                BookingPayment.status.in_([BookingPaymentStatus.PAID,
                                           BookingPaymentStatus.REFUNDED]),
                *cls._period(BookingPayment.paid_at, period_from, period_to),
            ).order_by(col(BookingPayment.id))
        ).all())

        income_rows = list(uow.session.exec(
            select(FinancialTransaction).where(
                FinancialTransaction.source_type == TransactionSourceType.BOOKING_PAYMENT,
                FinancialTransaction.direction == TransactionDirection.INCOME,
                FinancialTransaction.status != TransactionStatus.VOIDED,
                *cls._period(FinancialTransaction.occurred_at, period_from, period_to),
            ).order_by(col(FinancialTransaction.id))
        ).all())

        payment_ids = [p.id for p in payments]
        income_by_payment = cls._sums(uow, payment_ids,
                                      direction=TransactionDirection.INCOME)
        refund_by_payment = cls._sums(uow, payment_ids, tx_type=TransactionType.REFUND)

        mismatches: List[dict] = []
        for p in payments:
            income = income_by_payment.get(p.id, 0)
            refunded = refund_by_payment.get(p.id, 0)
            base = {"payment_id": p.id, "booking_id": p.booking_id,
                    "gateway_amount": p.amount, "ledger_amount": income,
                    "refunded_amount": refunded}

            if income == 0:
                mismatches.append({**base, "type": "payment_without_ledger",
                                   "message": f"پرداخت #{p.id} در درگاه موفق است ولی "
                                              f"ردیف درآمدی در دفتر کل ندارد"})
            elif income != p.amount:
                mismatches.append({**base, "type": "amount_mismatch",
                                   "difference": income - p.amount,
                                   "message": f"تفاوت مبلغ پرداخت #{p.id}: "
                                              f"دفتر کل {income:,} ریال، درگاه {p.amount:,} ریال"})

            if p.status == BookingPaymentStatus.REFUNDED and refunded < income:
                mismatches.append({**base, "type": "refund_without_ledger",
                                   "difference": income - refunded,
                                   "message": f"پرداخت #{p.id} در وضعیت بازگشت وجه است ولی "
                                              f"{income - refunded:,} ریالِ برگشتی در دفتر کل نیست"})
            if p.status == BookingPaymentStatus.PAID and refunded > 0:
                mismatches.append({**base, "type": "refunded_while_paid",
                                   "message": f"برای پرداخت #{p.id} در دفتر کل برگشت وجه ثبت شده "
                                              f"ولی وضعیت پرداخت هنوز paid است"})

        # ردیف درآمدی که پرداختِ paid/refundedِ مطابق ندارد (پرداخت شکست‌خورده،
        # pending، یا ردیف یتیم) — وضعیتِ خودِ پرداخت خوانده می‌شود تا مرزِ
        # نیمه‌شبِ دو جدول، مغایرتِ جعلی نسازد.
        paid_or_refunded = set(payment_ids)
        stray = sorted({r.source_id for r in income_rows if r.source_id not in paid_or_refunded})
        statuses = {}
        if stray:
            rows = uow.session.exec(
                select(BookingPayment.id, BookingPayment.status)
                .where(BookingPayment.id.in_(stray))).all()
            # مقدارِ enum خوانده می‌شود نه `str(member)` — وگرنه متنِ فارسی
            # «BookingPaymentStatus.FAILED» تحویل می‌دهد (تست این را گرفت)
            statuses = {int(pid): getattr(st, "value", str(st)) for pid, st in rows}
        for r in income_rows:
            if r.source_id in paid_or_refunded:
                continue
            st = statuses.get(r.source_id)
            if st in (BookingPaymentStatus.PAID.value, BookingPaymentStatus.REFUNDED.value):
                # پرداختِ paid/refunded هست، فقط دو طرفِ مقایسه در دو روزِ متفاوت
                # افتاده‌اند (ردیفِ دفتر کل با `occurred_at` خودش) ⇒ مغایرت نیست
                continue
            mismatches.append({
                "type": "ledger_without_paid_payment",
                "transaction_id": r.id, "payment_id": r.source_id,
                "ledger_amount": r.amount, "payment_status": st,
                "message": f"ردیف دفتر کل #{r.id} درآمد {r.amount:,} ریال برای پرداخت "
                           f"#{r.source_id} ثبت کرده که "
                           f"{'وضعیتش ' + st + ' است' if st else 'اصلاً وجود ندارد'}",
            })

        return {
            "period_from": period_from.isoformat(),
            "period_to": period_to.isoformat(),
            "payments_checked": len(payments),
            "ledger_income_rows": len(income_rows),
            "mismatch_count": len(mismatches),
            "mismatches": mismatches,
        }

    @classmethod
    def run(cls, uow, *, period_from: date, period_to: date,
            triggered_by: Optional[int] = None) -> dict:
        """مقایسه + ماندگاریِ ردیف گزارش (اجرای دوبارۀ همان بازه، همان ردیف را به‌روز می‌کند).

        commit نمی‌کند؛ مسئولیتش با صداکننده است (`uow.commit()`) — همان قراردادی
        که بقیۀ سرویس‌های پولی این ریپو دارند.
        """
        report = cls.compare(uow, period_from=period_from, period_to=period_to)
        cls.save(uow, report, triggered_by=triggered_by)
        return report

    @classmethod
    def save(cls, uow, report: dict, *, triggered_by: Optional[int] = None) -> ReconciliationReport:
        period_from = date.fromisoformat(report["period_from"])
        period_to = date.fromisoformat(report["period_to"])
        row = uow.session.exec(
            select(ReconciliationReport).where(
                ReconciliationReport.period_from == period_from,
                ReconciliationReport.period_to == period_to)
        ).first()
        if row is None:
            row = ReconciliationReport(period_from=period_from, period_to=period_to)
            uow.session.add(row)

        row.status = (ReconciliationStatus.COMPLETED if report["mismatch_count"] == 0
                      else ReconciliationStatus.ISSUES_FOUND)
        row.payments_checked = report["payments_checked"]
        row.ledger_income_rows = report["ledger_income_rows"]
        row.mismatch_count = report["mismatch_count"]
        row.mismatches = json.dumps(report["mismatches"], ensure_ascii=False, default=str)
        row.generated_at = datetime.now(timezone.utc)
        if triggered_by is not None:
            row.triggered_by = triggered_by
        uow.session.flush()
        return row
