from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import date, time, datetime
from enum import Enum

class ContractStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    SUSPENDED = "suspended"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    PARTIAL = "partial"
    OVERDUE = "overdue"

class RecurrenceType(str, Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"

class Contract(SQLModel, table=True):
    __tablename__ = "contracts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    venue_id: int = Field(foreign_key="venues.id")
    
    start_date: date
    end_date: date
    recurrence: RecurrenceType = Field(default=RecurrenceType.WEEKLY)
    
    day_of_week: int
    start_time: time
    duration: int = Field(default=90)
    
    original_price: int
    discounted_price: int
    total_amount: int
    
    status: ContractStatus = Field(default=ContractStatus.ACTIVE)
    payment_status: PaymentStatus = Field(default=PaymentStatus.PENDING)
    
    description: Optional[str] = None
    auto_renew: bool = Field(default=False)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: "User" = Relationship(back_populates="contracts")
    venue: "Venue" = Relationship(back_populates="contracts")
    generated_slots: List["ContractSlot"] = Relationship(back_populates="contract")
    payments: List["ContractPayment"] = Relationship(back_populates="contract")

class ContractSlot(SQLModel, table=True):
    __tablename__ = "contract_slots"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    contract_id: int = Field(foreign_key="contracts.id")
    slot_id: int = Field(foreign_key="slots.id")
    
    session_date: date
    is_attended: bool = Field(default=False)
    is_cancelled: bool = Field(default=False)
    cancellation_reason: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    contract: "Contract" = Relationship(back_populates="generated_slots")
    slot: "Slot" = Relationship(back_populates="contract_reference")

class ContractPayment(SQLModel, table=True):
    __tablename__ = "contract_payments"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    contract_id: int = Field(foreign_key="contracts.id")
    
    amount: int
    due_date: date
    paid_at: Optional[datetime] = None
    is_paid: bool = Field(default=False)
    transaction_id: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    contract: "Contract" = Relationship(back_populates="payments")
