# backend/app/services/split_payment_service.py
"""قوانینِ حالتِ پرداختِ اشتراکی تیم — جایی که `EXPIRED`، `OVERDUE` و `CANCELLED`
تولید می‌شوند. تا راند ۲۶ هر سه فقط در enum تعریف بودند (گرهٔ C11.6.2): هیچ مسیرِ
تولیدی‌شان وجود نداشت، ولی UI از قبل «مهلت گذشته» و «لغوشده» را نمایش می‌داد.

هر سه نوشتن با UPDATE نگهبان‌دار است، نه read-modify-write روی آبجکتِ حافظه، چون
این حالت‌ها با `pay_share` همزمان می‌افتند — همان درسی که راند ۲۳ از C11.6.3 گرفت.
"""
import json
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session, func, select

from app.models.split_payment import (
    ShareStatus,
    SplitPaymentAuditEvent,
    SplitPaymentShare,
    SplitPaymentStatus,
    TeamSplitPayment,
)

# حالت‌هایی که هنوز «باز»اند و مهلت/لغو می‌تواند به آن‌ها بخورد
OPEN_STATUSES = (SplitPaymentStatus.PENDING, SplitPaymentStatus.PARTIAL)


def expire_overdue(session: Session, now: Optional[datetime] = None) -> dict:
    """سهمِ پرداخت‌نشدهٔ گذشته از مهلت ⇒ OVERDUE؛ پدرِ هنوز ناقص ⇒ EXPIRED.

    دو statement، هر دو نگهبان‌دار:
      - `status = 'PENDING'` ⇒ سهمی که همین دقایق پرداخت می‌شود OVERDUE نمی‌شود.
      - `status IN (PENDING, PARTIAL)` ⇒ ردیفی که `pay_share` تازه COMPLETED کرده
        دوباره EXPIRED نمی‌شود (روی PG قفلِ ردیف + بازبینیِ predicate در
        READ COMMITTED همین را تضمین می‌کند؛ روی SQLite تراکنش serialize است).
    پرداختِ دیرهنگام عمداً مسدود نشده: پولِ آمده از برچسبِ مهلت مهم‌تر است،
    `pay_share` سهمِ OVERDUE را می‌پذیرد و پدر را به PARTIAL/COMPLETED برمی‌گرداند؛
    همین تسک در دورِ بعد دوباره بررسی‌اش می‌کند.
    """
    ts = now or datetime.now(timezone.utc)
    sp = TeamSplitPayment.__table__
    sh = SplitPaymentShare.__table__

    past_due_open = select(sp.c.id).where(
        sp.c.deadline.is_not(None),
        sp.c.deadline < ts,
        sp.c.status.in_(OPEN_STATUSES),
    )
    marked = session.execute(
        sh.update()
        .where(
            sh.c.split_payment_id.in_(past_due_open),
            sh.c.status == ShareStatus.PENDING,
        )
        .values(status=ShareStatus.OVERDUE, updated_at=ts)
    ).rowcount

    unpaid = (
        select(func.count())
        .select_from(sh)
        .where(
            sh.c.split_payment_id == sp.c.id,
            sh.c.status != ShareStatus.PAID,
        )
        .scalar_subquery()
    )
    expired = session.execute(
        sp.update()
        .where(
            sp.c.deadline.is_not(None),
            sp.c.deadline < ts,
            sp.c.status.in_(OPEN_STATUSES),
            unpaid > 0,
        )
        .values(status=SplitPaymentStatus.EXPIRED, updated_at=ts)
    ).rowcount

    session.commit()
    return {"shares_overdue": marked, "payments_expired": expired}


def cancel_split_payment(session: Session, payment_id: int, actor_id: int,
                         actor_phone: Optional[str] = None,
                         note: Optional[str] = None,
                         now: Optional[datetime] = None) -> str:
    """لغوِ پرداختِ اشتراکیِ بی‌پول. کدِ نتیجه برمی‌گردد؛ HTTP مالِ API است.

    سهمِ پرداخت‌شده یعنی پولِ گرفته‌شده، و ابطالِ چنین ردیفی بازگشت وجه می‌خواهد؛
    بازگشت وجهِ درگاه همان X4 است که در دسترس نیست ⇒ این مسیر عمداً رد می‌کند.
    شرط‌ها داخلِ WHERE نشسته‌اند تا پرداختِ همزمانِ همین لحظه از پنجرۀ
    «خواندم، بعد لغو می‌کنم» رد نشود.
    """
    ts = now or datetime.now(timezone.utc)
    sp = TeamSplitPayment.__table__
    sh = SplitPaymentShare.__table__
    paid_rows = (
        select(func.count())
        .select_from(sh)
        .where(
            sh.c.split_payment_id == sp.c.id,
            sh.c.status == ShareStatus.PAID,
        )
        .scalar_subquery()
    )
    values = {"status": SplitPaymentStatus.CANCELLED, "updated_at": ts}
    if note:
        values["note"] = note
    rowcount = session.execute(
        sp.update()
        .where(
            sp.c.id == payment_id,
            sp.c.status.in_(OPEN_STATUSES + (SplitPaymentStatus.EXPIRED,)),
            paid_rows == 0,
            sp.c.paid_amount == 0,
        )
        .values(**values)
    ).rowcount

    if rowcount == 0:
        current = session.get(TeamSplitPayment, payment_id)
        if current is None:
            return "missing"
        session.refresh(current)
        if current.status == SplitPaymentStatus.CANCELLED:
            return "already_cancelled"
        if current.status == SplitPaymentStatus.COMPLETED:
            return "completed"
        if current.paid_amount > 0:
            return "has_paid_share"
        return "not_cancellable"

    session.add(SplitPaymentAuditEvent(
        split_payment_id=payment_id,
        user_id=actor_id,
        performed_by=actor_phone,
        action="CANCELLED",
        data=json.dumps({"note": note}, ensure_ascii=False) if note else None,
    ))
    session.commit()
    return "cancelled"
