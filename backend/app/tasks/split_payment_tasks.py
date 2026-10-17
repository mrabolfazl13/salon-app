# backend/app/tasks/split_payment_tasks.py
"""Sweep for team split payments that passed their deadline (knot C11.6.2).

`SplitPaymentStatus.EXPIRED`, `CANCELLED` and `ShareStatus.OVERDUE` were declared
in the enum and rendered in the UI, but no code path ever produced them — so a
split payment stayed PENDING/PARTIAL forever after its deadline.
"""
from sqlmodel import Session

from app.database import engine
from app.services.split_payment_service import expire_overdue
from app.tasks.worker import celery_app


@celery_app.task(name="app.tasks.mark_overdue_split_payments")
def mark_overdue_split_payments():
    """سهم‌های گذشته از مهلت را OVERDUE و پرداخت‌های ناقص را EXPIRED می‌کند."""
    with Session(engine) as session:
        return expire_overdue(session)
