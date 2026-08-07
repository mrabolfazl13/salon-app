from fastapi import APIRouter, Depends, HTTPException
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.utils.auth import get_current_admin
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/users")
def get_all_users(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    users = uow.users.get_all()
    return users

@router.get("/stats/users")
def get_user_stats(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    return uow.users.get_user_statistics()

@router.get("/stats/venues")
def get_venue_stats(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    total = uow.venues.count()
    verified = uow.venues.count(is_verified=True)
    return {"total_venues": total, "verified_venues": verified, "pending_venues": total - verified}

@router.get("/pending-venues")
def get_pending_venues(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    return uow.venues.get_pending_venues()

@router.post("/verify-venue/{venue_id}")
def verify_venue(
    venue_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_admin)
):
    venue = uow.venues.verify_venue(venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return {"message": f"Venue {venue.name} verified"}
