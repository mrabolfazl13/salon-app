from sqlmodel import Session, select
from datetime import date, datetime, timedelta, timezone
from typing import Optional, List
from app.models.contract import (
    Contract, ContractSlot, ContractPayment, ContractAuditEvent,
    ContractStatus, PaymentStatus, RecurrenceType, ContractSlotStatus, ContractAuditAction,
)
from app.repositories.base import BaseRepository


class ContractRepository(BaseRepository[Contract]):

    def __init__(self, session: Session):
        super().__init__(Contract, session)

    def get_by_user(self, user_id: int) -> List[Contract]:
        return self.get_all(user_id=user_id, order_by="created_at", order_desc=True)

    def get_by_venue(self, venue_id: int) -> List[Contract]:
        return self.get_all(venue_id=venue_id, order_by="created_at", order_desc=True)

    def get_for_manager_venues(self, venue_ids: List[int],
                               status: Optional[ContractStatus] = None) -> List[Contract]:
        """قراردادهای سالن‌های یک مدیر — مسیر «همه‌ی قراردادها»ی پنل مدیر."""
        if not venue_ids:
            return []
        stmt = select(Contract).where(Contract.venue_id.in_(venue_ids))
        if status is not None:
            stmt = stmt.where(Contract.status == status)
        stmt = stmt.order_by(Contract.created_at.desc())
        return list(self.session.exec(stmt).all())

    def get_pending_for_venues(self, venue_ids: List[int]) -> List[Contract]:
        """درخواست‌های در انتظار تأیید (PENDING) — wire به endpoint /contracts/manager/pending."""
        return self.get_for_manager_venues(venue_ids, status=ContractStatus.PENDING)

    def get_active_contracts(self, venue_ids: Optional[List[int]] = None) -> List[Contract]:
        """قراردادهای جاریِ امروز — wire به داشبورد/لیست مدیر."""
        today = date.today()
        stmt = select(Contract).where(
            Contract.status == ContractStatus.ACTIVE,
            Contract.start_date <= today,
            Contract.end_date >= today
        )
        if venue_ids is not None:
            stmt = stmt.where(Contract.venue_id.in_(venue_ids))
        return list(self.session.exec(stmt).all())

    def get_expired_contracts(self) -> List[Contract]:
        statement = select(Contract).where(
            Contract.end_date < date.today(),
            Contract.status == ContractStatus.ACTIVE
        )
        return self.session.exec(statement).all()

    def renew_contract(self, contract_id: int, new_end_date: date) -> Optional[Contract]:
        """تمدید مهلت قرارداد — wire به تسک auto_renew."""
        return self.update(contract_id, {"end_date": new_end_date, "updated_at": datetime.now(timezone.utc)})

    def update_payment_status(self, contract_id: int, status: PaymentStatus) -> Optional[Contract]:
        return self.update(contract_id, {"payment_status": status})

    def get_conflicting_contracts(self, venue_id: int, day_of_week: int, start_time, end_time, start_date: date, end_date: date, exclude_id: Optional[int] = None, statuses: Optional[List[ContractStatus]] = None) -> List[Contract]:
        """بررسی تداخل زمانی قراردادها در یک روز مشخص.

        قرارداد‌های PENDING هم موجودی را نگه داشته‌اند (سانس‌های RESERVED
        زمان ساخت)؛ پس در تعارض شمرده می‌شوند.
        """
        if statuses is None:
            statuses = [ContractStatus.ACTIVE, ContractStatus.PENDING]
        statement = select(Contract).where(
            Contract.venue_id == venue_id,
            Contract.day_of_week == day_of_week,
            Contract.status.in_(statuses),
            Contract.start_date <= end_date,
            Contract.end_date >= start_date
        )
        if exclude_id:
            statement = statement.where(Contract.id != exclude_id)
        return self.session.exec(statement).all()


class ContractSlotRepository(BaseRepository[ContractSlot]):

    def __init__(self, session: Session):
        super().__init__(ContractSlot, session)

    def get_by_contract(self, contract_id: int) -> List[ContractSlot]:
        return self.get_all(contract_id=contract_id, order_by="session_date", limit=1000)

    def get_schedule(self, contract_id: int) -> List[ContractSlot]:
        """برنامه‌ی مؤثر قرارداد — همه به‌جز EXCLUDEDها (مبنای شمارش سانس)."""
        stmt = select(ContractSlot).where(
            ContractSlot.contract_id == contract_id,
            ContractSlot.status != ContractSlotStatus.EXCLUDED,
        ).order_by(ContractSlot.session_date)
        return list(self.session.exec(stmt).all())

    def get_by_contract_and_id(self, contract_id: int, cs_id: int) -> Optional[ContractSlot]:
        return self.get_one(contract_id=contract_id, id=cs_id)

    def get_past_scheduled(self) -> List[ContractSlot]:
        """سانس‌های SCHEDULED که تاریخشان گذشته — ورودی تسک روزانه (→ COMPLETED)."""
        stmt = select(ContractSlot).where(
            ContractSlot.status == ContractSlotStatus.SCHEDULED,
            ContractSlot.session_date < date.today(),
        )
        return list(self.session.exec(stmt).all())

    def get_upcoming_sessions(self, contract_id: int, days_ahead: int = 30) -> List[ContractSlot]:
        statement = select(ContractSlot).where(
            ContractSlot.contract_id == contract_id,
            ContractSlot.session_date >= date.today(),
            ContractSlot.session_date <= date.today() + timedelta(days=days_ahead),
            ContractSlot.is_cancelled == False,  # noqa: E712
            ContractSlot.status != ContractSlotStatus.EXCLUDED,
        ).order_by(ContractSlot.session_date)
        return self.session.exec(statement).all()

    def cancel_session(self, contract_slot_id: int, reason: str,
                       handled_by: Optional[int] = None) -> Optional[ContractSlot]:
        """استثنای یک سانس (لغو تکی) — وضعیت رزرو + ردپای عملیات در یک جا."""
        obj = self.get_by_id(contract_slot_id)
        if not obj:
            return None
        now = datetime.now(timezone.utc)
        obj.is_cancelled = True
        obj.cancellation_reason = reason
        obj.status = ContractSlotStatus.EXCLUDED
        obj.exclusion_reason = reason
        obj.handled_by = handled_by
        obj.handled_at = now
        obj.updated_at = now
        self.session.add(obj)
        self.session.flush()
        return obj

    def set_cancel_request(self, contract_slot_id: int, reason: Optional[str] = None) -> Optional[ContractSlot]:
        """ثبت درخواست لغو کاربر روی سانس — تصمیم نهایی با مدیر (exclude/reschedule)."""
        obj = self.get_by_id(contract_slot_id)
        if not obj:
            return None
        now = datetime.now(timezone.utc)
        obj.cancel_requested = True
        obj.cancel_requested_at = now
        if reason:
            obj.cancellation_reason = reason
        obj.updated_at = now
        self.session.add(obj)
        self.session.flush()
        return obj


class ContractPaymentRepository(BaseRepository[ContractPayment]):

    def __init__(self, session: Session):
        super().__init__(ContractPayment, session)

    def get_by_contract(self, contract_id: int) -> List[ContractPayment]:
        return self.get_all(contract_id=contract_id, order_by="due_date", limit=500)

    def has_schedule(self, contract_id: int) -> bool:
        return self.count(contract_id=contract_id) > 0

    def get_unpaid(self, contract_id: int) -> List[ContractPayment]:
        stmt = select(ContractPayment).where(
            ContractPayment.contract_id == contract_id,
            ContractPayment.is_paid == False,   # noqa: E712
            ContractPayment.is_voided == False, # noqa: E712
        )
        return list(self.session.exec(stmt).all())

    def get_unpaid_payments(self, contract_id: int) -> List[ContractPayment]:
        return self.get_all(contract_id=contract_id, is_paid=False)

    def mark_as_paid(self, payment_id: int, transaction_id: str) -> Optional[ContractPayment]:
        return self.update(payment_id, {"is_paid": True, "paid_at": datetime.now(timezone.utc), "transaction_id": transaction_id})

    def get_overdue_payments(self, grace_days: int = 0) -> List[dict]:
        """اقساط معوق پرداخت‌نشده (تسهیمات) — قرارداد منقضی/لغوشده مشمول نیست.

        wire شده به تسک روزانه‌ی `notify_overdue_contract_payments`؛
        `overdue_notified_at` خالی یعنی هنوز هشدار داده نشده (ضد تکرار مزاحمت).
        بازگشت: list[dict{payment, contract_user_id, contract_venue_id}] — join دولایه.
        """
        stmt = (
            select(ContractPayment, Contract.user_id, Contract.venue_id)
            .join(Contract, Contract.id == ContractPayment.contract_id)
            .where(
                ContractPayment.is_paid == False,   # noqa: E712
                ContractPayment.is_voided == False, # noqa: E712
                ContractPayment.overdue_notified_at.is_(None),
                ContractPayment.due_date < date.today() - timedelta(days=grace_days),
                Contract.status == ContractStatus.ACTIVE,
            )
        )
        rows = []
        for payment, c_user_id, c_venue_id in self.session.exec(stmt).all():
            rows.append({
                "payment": payment,
                "contract_user_id": c_user_id,
                "contract_venue_id": c_venue_id,
            })
        return rows


class ContractAuditEventRepository(BaseRepository[ContractAuditEvent]):
    """مخزن رویدادهای ممیزی — فقط‌افزودنی؛ خواندن کرونولوژیک."""

    def __init__(self, session: Session):
        super().__init__(ContractAuditEvent, session)

    def log(self, contract_id: int, action: ContractAuditAction,
            actor_id: Optional[int] = None, data: Optional[dict] = None) -> ContractAuditEvent:
        import json
        return self.create({
            "contract_id": contract_id,
            "action": action,
            "actor_id": actor_id,
            "data": json.dumps(data or {}, ensure_ascii=False, default=str),
        })

    def get_by_contract(self, contract_id: int) -> List[ContractAuditEvent]:
        stmt = (select(ContractAuditEvent)
                .where(ContractAuditEvent.contract_id == contract_id)
                .order_by(ContractAuditEvent.created_at, ContractAuditEvent.id))
        return list(self.session.exec(stmt).all())