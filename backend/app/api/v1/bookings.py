from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.schemas.booking import BookingCreate, BookingResponse
from app.services.booking_service import BookingService
from app.utils.auth import get_current_user
from app.models.user import User
from app.services.notification_service import notification_service

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("/", response_model=BookingResponse)
async def create_booking(
    booking_data: BookingCreate,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    booking = BookingService.create_booking(uow, booking_data.slot_id, current_user.id)
    
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

@router.delete("/{booking_id}")
async def cancel_booking(
    booking_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    result = BookingService.cancel_booking(uow, booking_id, current_user.id)
    if not result:
        raise HTTPException(status_code=400, detail="Cannot cancel")
    
    await notification_service.notify_booking_cancelled(current_user.id, {})
    return {"message": "Booking cancelled"}
