"""Finance MVP API — simple income/expense tracking for venue managers."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from datetime import date, datetime
from typing import List, Optional

from app.database import get_session
from app.models.finance import FinancialTransaction, ExpenseCategory
from app.models.user import User, UserRole
from app.utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/finance", tags=["finance-mvp"])


# ─── Schemas ──────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    type: str  # "income" or "expense"
    category_id: int
    amount: int
    description: str
    date: Optional[datetime] = None
    receipt_image_url: Optional[str] = None
    related_booking_id: Optional[int] = None
    related_slot_id: Optional[int] = None


class TransactionResponse(BaseModel):
    id: int
    type: str
    category_id: int
    category_name: str
    amount: int
    description: str
    date: datetime
    receipt_image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryResponse(BaseModel):
    id: int
    name: str
    is_fixed: bool
    monthly_budget: Optional[int] = None

    class Config:
        from_attributes = True


class MonthSummary(BaseModel):
    total_income: int
    total_expense: int
    net_profit: int
    transaction_count: int


# ─── Endpoints ────────────────────────────────────────────────────

@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """List all expense categories (shared across venues for simplicity)."""
    cats = session.exec(select(ExpenseCategory)).all()
    return cats


@router.post("/transactions", response_model=TransactionResponse)
def create_transaction(
    data: TransactionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Record a new income or expense."""
    # Only managers/admins can record transactions
    if current_user.role not in [UserRole.VENUE_MANAGER, UserRole.CLUB_ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="فقط مدیران سالن می‌توانند تراکنش ثبت کنند")

    # Validate category exists
    cat = session.get(ExpenseCategory, data.category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="دسته‌بندی یافت نشد")

    tx = FinancialTransaction(
        venue_id=current_user.venue_id if hasattr(current_user, 'venue_id') and current_user.venue_id else 1,
        type=data.type,
        category_id=data.category_id,
        amount=data.amount,
        description=data.description,
        date=data.date or datetime.utcnow(),
        receipt_image_url=data.receipt_image_url,
        related_booking_id=data.related_booking_id,
        related_slot_id=data.related_slot_id,
    )
    session.add(tx)
    session.commit()
    session.refresh(tx)

    # Enrich with category name for response
    result = TransactionResponse(
        id=tx.id,
        type=tx.type,
        category_id=tx.category_id,
        category_name=cat.name,
        amount=tx.amount,
        description=tx.description,
        date=tx.date,
        receipt_image_url=tx.receipt_image_url,
        created_at=tx.created_at,
    )
    return result


@router.get("/transactions", response_model=List[TransactionResponse])
def list_transactions(
    type: Optional[str] = Query(None, description="income or expense"),
    category_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """List transactions with filters, sorted by date descending."""
    stmt = select(FinancialTransaction, ExpenseCategory.name).join(
        ExpenseCategory, FinancialTransaction.category_id == ExpenseCategory.id
    )

    if type:
        stmt = stmt.where(FinancialTransaction.type == type)
    if category_id:
        stmt = stmt.where(FinancialTransaction.category_id == category_id)
    if from_date:
        stmt = stmt.where(FinancialTransaction.date >= from_date)
    if to_date:
        stmt = stmt.where(FinancialTransaction.date <= to_date)

    stmt = stmt.order_by(FinancialTransaction.date.desc()).offset(offset).limit(limit)
    rows = session.exec(stmt).all()

    results = []
    for tx, cat_name in rows:
        results.append(TransactionResponse(
            id=tx.id,
            type=tx.type,
            category_id=tx.category_id,
            category_name=cat_name,
            amount=tx.amount,
            description=tx.description,
            date=tx.date,
            receipt_image_url=tx.receipt_image_url,
            created_at=tx.created_at,
        ))
    return results


@router.get("/summary/monthly", response_model=MonthSummary)
def get_monthly_summary(
    year: int = Query(None),
    month: int = Query(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get P&L summary for a specific month (defaults to current month)."""
    now = datetime.utcnow()
    y = year or now.year
    m = month or now.month

    start = datetime(y, m, 1)
    if m == 12:
        end = datetime(y + 1, 1, 1)
    else:
        end = datetime(y, m + 1, 1)

    income_stmt = select(func.coalesce(func.sum(FinancialTransaction.amount), 0)).where(
        FinancialTransaction.type == "income",
        FinancialTransaction.date >= start,
        FinancialTransaction.date < end,
    )
    expense_stmt = select(func.coalesce(func.sum(FinancialTransaction.amount), 0)).where(
        FinancialTransaction.type == "expense",
        FinancialTransaction.date >= start,
        FinancialTransaction.date < end,
    )
    count_stmt = select(func.count()).where(
        FinancialTransaction.date >= start,
        FinancialTransaction.date < end,
    )

    total_income = session.exec(income_stmt).one()
    total_expense = session.exec(expense_stmt).one()
    count = session.exec(count_stmt).one()

    return MonthSummary(
        total_income=total_income,
        total_expense=total_expense,
        net_profit=total_income - total_expense,
        transaction_count=count,
    )
