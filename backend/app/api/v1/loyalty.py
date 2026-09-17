# backend/app/api/v1/loyalty.py
"""امتیاز وفاداری — موجودی/تاریخچه کاربر + هدیه/تنظیم دستی (مدیر/سرپرست)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.config import settings
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.models.user import User
from app.schemas.loyalty import LoyaltyAdjustRequest, LoyaltyHistoryResponse, LoyaltyPointResponse
from app.services.loyalty_service import LoyaltyService
from app.utils.auth import get_current_manager, get_current_user

router = APIRouter(prefix="/loyalty", tags=["Loyalty"])


def _point_response(p) -> LoyaltyPointResponse:
    return LoyaltyPointResponse(
        id=p.id, points=p.points,
        reason=p.reason.value if hasattr(p.reason, "value") else str(p.reason),
        source_type=p.source_type, source_id=p.source_id, created_at=p.created_at,
    )


@router.get("/me", response_model=LoyaltyHistoryResponse)
def my_loyalty(
    limit: int = Query(50, ge=1, le=200),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    """موجودی + تاریخچه امتیاز کاربر جاری (دفتر فقط-افزودنی، موجودی = SUM)."""
    history = uow.loyalty.history(current_user.id, limit=limit)
    return LoyaltyHistoryResponse(
        user_id=current_user.id,
        balance=uow.loyalty.balance(current_user.id),
        point_value_rial=int(settings.LOYALTY_RIALS_PER_POINT),
        history=[_point_response(p) for p in history],
    )


@router.post("/{user_id}/adjust", response_model=LoyaltyPointResponse)
def adjust_points(
    user_id: int,
    data: LoyaltyAdjustRequest,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager),
):
    """هدیه/کسر دستی امتیاز — فقط مدیر یا سرپرست؛ خروجی همیشه مثبت-منفی با reason دستی."""
    if data.points == 0:
        raise HTTPException(status_code=400, detail="مقدار امتیاز نمی‌تواند صفر باشد")
    if not uow.users.get_by_id(user_id):
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    if data.points < 0 and uow.loyalty.balance(user_id) < abs(data.points):
        raise HTTPException(
            status_code=400, detail="موجودی کاربر برای این کسر کافی نیست")
    row = LoyaltyService.adjust(uow.session, user_id, data.points, data.note)
    uow.commit()
    return _point_response(row)