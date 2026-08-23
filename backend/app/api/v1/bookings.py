from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from datetime import date
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.schemas.booking import BookingCreate, BookingResponse
from app.services.booking_service import BookingService
from app.utils.auth import get_current_user, get_current_manager
from app.models.user import User, UserRole
from app.services.notification_service import notification_service

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("/", response_model=BookingResponse)
async def create_booking(
    booking_data: BookingCreate,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    booking = BookingService.create_booking(uow, booking_data.slot_id, current_user.id)
    
    uow.commit()
    
    slot = uow.slots.get_by_id(booking_data.slot_id)
    if slot:
        venue = uow.venues.get_by_id(slot.venue_id)
        await notification_service.notify_booking_confirmed(
            current_user.id,
            {"venue_name": venue.name if venue else "Unknown", "date": str(slot.slot_date), "time": str(slot.start_time)}
        )
    
    return booking

@router.get("/", response_model=List[BookingResponse])
def get_my_bookings(
    limit: int = 50,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    return BookingService.get_user_bookings(uow, current_user.id, limit)

@router.get("/venue/{venue_id}", response_model=List[BookingResponse])
def get_venue_bookings(
    venue_id: int,
    start_date: date = Query(None, description="تاریخ شروع"),
    end_date: date = Query(None, description="تاریخ پایان"),
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager)
):
    """دریافت رزروهای یک سالن - فقط مدیر سالن"""
    venue = uow.venues.get_by_id(venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    if venue.manager_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    
    from datetime import date as dt_date
    if not start_date:
        start_date = dt_date.today()
    if not end_date:
        end_date = dt_date.today()
    
    return uow.bookings.get_by_venue(venue_id, start_date, end_date)

@router.delete("/{booking_id}")
async def cancel_booking(
    booking_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    result = BookingService.cancel_booking(uow, booking_id, current_user.id)
    if not result:
        raise HTTPException(status_code=400, detail="Cannot cancel")
    
    uow.commit()
    
    await notification_service.notify_booking_cancelled(current_user.id, {})
    return {"message": "Booking cancelled"}
