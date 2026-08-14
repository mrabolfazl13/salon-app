from sqlmodel import Session, select
from datetime import date, datetime, timedelta, timezone
from typing import Optional, List
from app.models.contract import Contract, ContractSlot, ContractPayment, ContractStatus, PaymentStatus
from app.repositories.base import BaseRepository

class ContractRepository(BaseRepository[Contract]):
    
    def __init__(self, session: Session):
        super().__init__(Contract, session)
    
    def get_by_user(self, user_id: int) -> List[Contract]:
        return self.get_all(user_id=user_id, order_by="created_at", order_desc=True)
    
    def get_by_venue(self, venue_id: int) -> List[Contract]:
        return self.get_all(venue_id=venue_id)
    
    def get_active_contracts(self) -> List[Contract]:
        today = date.today()
        statement = select(Contract).where(
            Contract.status == ContractStatus.ACTIVE,
            Contract.start_date <= today,
            Contract.end_date >= today
        )
        return self.session.exec(statement).all()
    
    def get_expired_contracts(self) -> List[Contract]:
        statement = select(Contract).where(
            Contract.end_date < date.today(),
            Contract.status == ContractStatus.ACTIVE
        )
        return self.session.exec(statement).all()
    
    def renew_contract(self, contract_id: int, new_end_date: date) -> Optional[Contract]:
        return self.update(contract_id, {"end_date": new_end_date, "updated_at": datetime.now(timezone.utc)})
    
    def update_payment_status(self, contract_id: int, status: PaymentStatus) -> Optional[Contract]:
        return self.update(contract_id, {"payment_status": status})
    
    def get_conflicting_contracts(self, venue_id: int, day_of_week: int, start_time, end_time, start_date: date, end_date: date, exclude_id: Optional[int] = None) -> List[Contract]:
        """بررسی تداخل زمانی قراردادها در یک روز مشخص"""
        statement = select(Contract).where(
            Contract.venue_id == venue_id,
            Contract.day_of_week == day_of_week,
            Contract.status == ContractStatus.ACTIVE,
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
        return self.get_all(contract_id=contract_id, order_by="session_date")
    
    def get_by_session_date(self, contract_id: int, session_date: date) -> Optional[ContractSlot]:
        return self.get_one(contract_id=contract_id, session_date=session_date)
    
    def get_upcoming_sessions(self, contract_id: int, days_ahead: int = 30) -> List[ContractSlot]:
        statement = select(ContractSlot).where(
            ContractSlot.contract_id == contract_id,
            ContractSlot.session_date >= date.today(),
            ContractSlot.session_date <= date.today() + timedelta(days=days_ahead),
            ContractSlot.is_cancelled == False
        ).order_by(ContractSlot.session_date)
        return self.session.exec(statement).all()
    
    def cancel_session(self, contract_slot_id: int, reason: str) -> Optional[ContractSlot]:
        return self.update(contract_slot_id, {"is_cancelled": True, "cancellation_reason": reason})

class ContractPaymentRepository(BaseRepository[ContractPayment]):
    
    def __init__(self, session: Session):
        super().__init__(ContractPayment, session)
    
    def get_by_contract(self, contract_id: int) -> List[ContractPayment]:
        return self.get_all(contract_id=contract_id, order_by="due_date")
    
    def get_unpaid_payments(self, contract_id: int) -> List[ContractPayment]:
        return self.get_all(contract_id=contract_id, is_paid=False)
    
    def mark_as_paid(self, payment_id: int, transaction_id: str) -> Optional[ContractPayment]:
        return self.update(payment_id, {"is_paid": True, "paid_at": datetime.now(timezone.utc), "transaction_id": transaction_id})
    
    def get_overdue_payments(self) -> List[ContractPayment]:
        statement = select(ContractPayment).where(
            ContractPayment.is_paid == False,
            ContractPayment.due_date < date.today()
        )
        return self.session.exec(statement).all()
