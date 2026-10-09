"""Waitlist API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models.waitlist import WaitlistEntry
from app.models.slot import Slot, SlotStatus
from app.models.booking import Booking, BookingStatus
from app.models.user import User
from app.models.venue import Venue
from app.utils.auth import get_current_user
from app.services.notification_service import NotificationService
from datetime import datetime, timedelta
from typing import List

router = APIRouter(prefix="/waitlist", tags=["waitlist"])


@router.post("/join/{slot_id}", status_code=status.HTTP_201_CREATED)
async def join_waitlist(
    slot_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Join waitlist for a fully-booked slot."""
    # Check if slot exists and is full - use eager load
    slot = session.exec(select(Slot).where(Slot.id == slot_id)).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    if slot.status != SlotStatus.BOOKED:
        raise HTTPException(
            status_code=400,
            detail="Slot is not fully booked. You can book it directly.",
        )
    
    # Check if user already in waitlist for this slot
    existing = session.exec(
        select(WaitlistEntry).where(
            WaitlistEntry.user_id == current_user.id,
            WaitlistEntry.slot_id == slot_id,
            WaitlistEntry.status.in_(["pending", "notified"]),
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You are already in the waitlist for this slot.",
        )
    
    # Check if user already has a booking for this slot
    existing_booking = session.exec(
        select(Booking).where(
            Booking.slot_id == slot_id,
            Booking.user_id == current_user.id,
            Booking.status == BookingStatus.CONFIRMED,
        )
    ).first()
    
    if existing_booking:
        raise HTTPException(
            status_code=400,
            detail="You already have a booking for this slot.",
        )
    
    # Get current position (count pending/notified entries before this one)
    position = session.exec(
        select(WaitlistEntry).where(
            WaitlistEntry.slot_id == slot_id,
            WaitlistEntry.status.in_(["pending", "notified"]),
        )
    ).all()
    next_position = len(position) + 1
    
    # Create waitlist entry
    entry = WaitlistEntry(
        user_id=current_user.id,
        slot_id=slot_id,
        venue_id=slot.venue_id,
        position=next_position,
        status="pending",
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    
    return {
        "id": entry.id,
        "position": entry.position,
        "message": f"شما در موقعیت {entry.position} صف انتظار قرار گرفتید.",
    }


@router.post("/leave/{slot_id}")
async def leave_waitlist(
    slot_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Leave waitlist for a slot."""
    entry = session.exec(
        select(WaitlistEntry).where(
            WaitlistEntry.user_id == current_user.id,
            WaitlistEntry.slot_id == slot_id,
            WaitlistEntry.status.in_(["pending", "notified"]),
        )
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")
    
    entry.status = "cancelled"
    entry.updated_at = datetime.utcnow()
    
    # Update positions for remaining entries
    remaining = session.exec(
        select(WaitlistEntry)
        .where(
            WaitlistEntry.slot_id == slot_id,
            WaitlistEntry.status.in_(["pending", "notified"]),
            WaitlistEntry.position > entry.position,
        )
        .order_by(WaitlistEntry.position)
    ).all()
    
    for r in remaining:
        r.position -= 1
    
    session.commit()
    
    return {"message": "از صف انتظار خارج شدید."}


@router.get("/my")
async def get_my_waitlist(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get user's active waitlist entries with pagination."""
    # Use joinedload to avoid N+1 queries
    from sqlmodel import joinedload
    
    stmt = (
        select(WaitlistEntry)
        .options(
            joinedload(WaitlistEntry.slot).joinedload(Slot.venue),
        )
        .where(
            WaitlistEntry.user_id == current_user.id,
            WaitlistEntry.status.in_(["pending", "notified"]),
        )
        .order_by(WaitlistEntry.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    
    entries = session.exec(stmt).all()
    
    result = []
    for entry in entries:
        # No more N+1: slot and venue already loaded via joinedload
        slot = entry.slot
        venue = slot.venue if slot else None
        
        result.append({
            "id": entry.id,
            "slot_id": entry.slot_id,
            "venue_name": venue.name if venue else "نامشخص",
            "slot_date": str(slot.slot_date) if slot else None,
            "start_time": str(slot.start_time) if slot else None,
            "position": entry.position,
            "status": entry.status,
            "created_at": entry.created_at.isoformat(),
            "expires_at": entry.expires_at.isoformat() if entry.expires_at else None,
        })
    
    return {
        "total": len(result),
        "limit": limit,
        "offset": offset,
        "items": result,
    }


@router.get("/slot/{slot_id}")
async def get_slot_waitlist(
    slot_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get waitlist for a specific slot (manager only)."""
    slot = session.exec(select(Slot).where(Slot.id == slot_id)).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    # Check if user is venue manager
    venue = session.exec(select(Venue).where(Venue.id == slot.venue_id)).first()
    if not venue or venue.manager_id != current_user.id:
        if current_user.role not in ["SUPER_ADMIN", "CLUB_ADMIN"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Eager load users to avoid N+1
    from sqlmodel import joinedload
    
    entries = session.exec(
        select(WaitlistEntry)
        .options(joinedload(WaitlistEntry.user))
        .where(
            WaitlistEntry.slot_id == slot_id,
            WaitlistEntry.status.in_(["pending", "notified"]),
        )
        .order_by(WaitlistEntry.position)
    ).all()
    
    result = []
    for entry in entries:
        # No more N+1: user already loaded
        user = entry.user
        result.append({
            "id": entry.id,
            "user_id": entry.user_id,
            "user_name": user.full_name if user else "کاربر ناشناس",
            "user_phone": user.phone if user else None,
            "position": entry.position,
            "status": entry.status,
            "joined_at": entry.created_at.isoformat(),
        })
    
    return {
        "slot_id": slot_id,
        "total_waiting": len(result),
        "entries": result,
    }
