"""Financial accounting models for venue management — MVP."""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime, timezone


class ExpenseCategory(SQLModel, table=True):
    __tablename__ = "expense_categories"
    __table_args__ = {"extend_existing": True}

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True, max_length=100)  # برق، آب، اجاره...
    is_fixed: bool = Field(default=False)  # هزینه ثابت ماهانه؟
    monthly_budget: Optional[int] = None  # بودجه ماهانه اختیاری (تومان)


class FinancialTransaction(SQLModel, table=True):
    __tablename__ = "financial_transactions"
    __table_args__ = {"extend_existing": True}

    id: Optional[int] = Field(default=None, primary_key=True)
    venue_id: int = Field(foreign_key="venues.id", index=True)
    type: str = Field(default="expense")  # income یا expense
    category_id: int = Field(foreign_key="expense_categories.id")
    amount: int  # مبلغ به تومان
    description: str = Field(max_length=500)
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    receipt_image_url: Optional[str] = None  # لینک عکس فاکتور در MinIO
    related_booking_id: Optional[int] = Field(default=None, foreign_key="bookings.id", nullable=True)
    related_slot_id: Optional[int] = Field(default=None, foreign_key="slots.id", nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    category: ExpenseCategory = Relationship()
