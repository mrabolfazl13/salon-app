"""QR Check-in API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models.booking import Booking
from app.services.checkin_service import CheckInService
from app.services.auth import get_current_user
from app.models.user import User, UserRole
from typing import Optional

router = APIRouter(prefix="/checkin", tags=["checkin"])


@router.get("/booking/{booking_id}/qr-code")
async def get_booking_qr_code(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get QR code data for a booking (user only)."""
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Only booking owner can see QR code
    if booking.user_id != current_user.id and current_user.role not in [UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Generate or retrieve check-in code
    code = CheckInService.ensure_check_in_code(session, booking_id)
    
    return {
        "booking_id": booking_id,
        "check_in_code": code,
        "qr_data": f"SALON-CHECKIN:{code}",  # prefix for scanner recognition
        "checked_in": booking.checked_in_at is not None,
        "checked_in_at": booking.checked_in_at.isoformat() if booking.checked_in_at else None,
    }


@router.post("/verify")
async def verify_check_in(
    check_in_code: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Verify check-in code and mark booking as checked in (manager only)."""
    # Only managers/admins can verify
    if current_user.role not in [UserRole.VENUE_MANAGER, UserRole.CLUB_ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="فقط مدیران سالن می‌توانند چک‌این کنند")
    
    success, message, booking = CheckInService.verify_and_check_in(
        session=session,
        check_in_code=check_in_code,
        manager_user_id=current_user.id,
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return {
        "success": True,
        "message": message,
        "booking_id": booking.id,
        "checked_in_at": booking.checked_in_at.isoformat(),
    }


@router.get("/booking/{booking_id}/status")
async def get_check_in_status(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get check-in status for a booking."""
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Owner or manager can see status
    is_owner = booking.user_id == current_user.id
    is_manager = current_user.role in [UserRole.VENUE_MANAGER, UserRole.CLUB_ADMIN, UserRole.SUPER_ADMIN]
    
    if not is_owner and not is_manager:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "booking_id": booking_id,
        "checked_in": booking.checked_in_at is not None,
        "checked_in_at": booking.checked_in_at.isoformat() if booking.checked_in_at else None,
        "checked_in_by": booking.checked_in_by,
    }
