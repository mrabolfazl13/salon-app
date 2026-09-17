# backend/app/api/v1/favorites.py
"""علاقه‌مندی‌های سمت سرور.

NOTE (frontend): قبلاً localStorage بود؛ مهاجرت داده لازم نیست — فرانت‌اند
در اولین بارگذاری، Ids محلی را یکی‌یکی POST می‌کند (POST idempotent است).
"""
from fastapi import APIRouter, Depends, HTTPException

from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.models.user import User
from app.utils.auth import get_current_user

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("")
def list_favorites(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    rows = uow.favorites.list_for_user(current_user.id)
    return {"venue_ids": [r.venue_id for r in rows]}


@router.post("/{venue_id}")
def add_favorite(
    venue_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    if not uow.venues.get_by_id(venue_id):
        raise HTTPException(status_code=404, detail="Venue not found")
    existing = uow.favorites.get_entry(current_user.id, venue_id)
    if not existing:
        uow.favorites.create({"user_id": current_user.id, "venue_id": venue_id})
        uow.commit()
    return {"venue_id": venue_id, "favorite": True}


@router.delete("/{venue_id}")
def remove_favorite(
    venue_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user),
):
    removed = uow.favorites.remove(current_user.id, venue_id)
    if removed:
        uow.commit()
    return {"venue_id": venue_id, "favorite": not removed, "removed": removed}