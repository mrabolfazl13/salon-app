# backend/app/utils/venue_guard.py
"""نگهبان مشترک دسترسی مدیر-سالن برای مسیرهای قیمت/کوپن/دیل."""
from typing import List, Optional

from fastapi import HTTPException
from sqlmodel import select

from app.models.user import User, UserRole
from app.models.venue import Venue


def ensure_venue_manager(uow, venue_id: int, user: User) -> Venue:
    venue = uow.venues.get_by_id(venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    if venue.manager_id != user.id and user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="شما مدیر این سالن نیستید")
    return venue


def manager_venue_ids(uow, user: User) -> Optional[List[int]]:
    """None ⇒ بدون فیلتر (super_admin)؛ در غیر این صورت سالن‌های مدیر."""
    if user.role == UserRole.SUPER_ADMIN:
        return None
    return [v.id for v in uow.session.exec(
        select(Venue).where(Venue.manager_id == user.id)).all()]