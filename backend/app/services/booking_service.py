from fastapi import HTTPException
from app.unit_of_work import UnitOfWork
from app.models.slot import SlotStatus
from app.models.booking import BookingStatus

class BookingService:
    
    @staticmethod
    def create_booking(uow: UnitOfWork, slot_id: int, user_id: int):
        slot = uow.slots.get_by_id(slot_id)
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")
        
        if slot.status != SlotStatus.AVAILABLE:
            raise HTTPException(status_code=400, detail="Slot is not available")
        
        existing = uow.bookings.get_by_slot(slot_id)
        if existing:
            raise HTTPException(status_code=400, detail="Slot already booked")
        
        booking = uow.bookings.create({
            "slot_id": slot_id,
            "user_id": user_id,
            "payment_amount": slot.current_price,
            "status": BookingStatus.CONFIRMED
        })
        
        uow.slots.update(slot_id, {"status": SlotStatus.BOOKED})
        
        return booking
    
    @staticmethod
    def cancel_booking(uow: UnitOfWork, booking_id: int, user_id: int):
        booking = uow.bookings.get_by_id(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if booking.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not your booking")
        
        if booking.status != BookingStatus.CONFIRMED:
            raise HTTPException(status_code=400, detail="Cannot cancel this booking")
        
        uow.slots.update(booking.slot_id, {"status": SlotStatus.AVAILABLE})
        cancelled = uow.bookings.update(booking_id, {"status": BookingStatus.CANCELLED})
        
        return cancelled
    
    @staticmethod
    def get_user_bookings(uow: UnitOfWork, user_id: int, limit: int = 50):
        return uow.bookings.get_by_user(user_id, limit)
    
    @staticmethod
    def get_upcoming_bookings(uow: UnitOfWork, user_id: int, days_ahead: int = 7):
        return uow.bookings.get_user_upcoming_bookings(user_id, days_ahead)
