from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from datetime import date
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.schemas.slot import SlotResponse
from app.utils.auth import get_current_manager
from app.models.user import User, UserRole

router = APIRouter(prefix="/slots", tags=["Slots"])

@router.get("/venue/{venue_id}", response_model=List[SlotResponse])
def get_venue_slots(
    venue_id: int,
    slot_date: date = Query(...),
    uow: UnitOfWork = Depends(get_unit_of_work)
):
    slots = uow.slots.get_by_venue_and_date(venue_id, slot_date)
    return slots

@router.get("/venue/{venue_id}/available", response_model=List[SlotResponse])
def get_available_slots(
    venue_id: int,
    slot_date: date = Query(...),
    uow: UnitOfWork = Depends(get_unit_of_work)
):
    slots = uow.slots.get_available_slots(venue_id, slot_date)
    return slots

@router.post("/venue/{venue_id}/generate")
def generate_slots(
    venue_id: int,
    slot_date: date,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager)
):
    venue = uow.venues.get_by_id(venue_id)
    if not venue or (venue.manager_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN):
        raise HTTPException(status_code=403, detail="Access denied")
    
    slots = uow.slots.create_daily_slots(venue_id, slot_date)
    return {"message": f"Created {len(slots)} slots"}

@router.get("/venue/{venue_id}/range", response_model=List[SlotResponse])
def get_slots_by_date_range(
    venue_id: int,
    start_date: date = Query(..., description="تاریخ شروع"),
    end_date: date = Query(..., description="تاریخ پایان"),
    uow: UnitOfWork = Depends(get_unit_of_work)
):
    """دریافت سانس‌ها برای بازه تاریخ"""
    slots = uow.slots.get_by_venue_and_date_range(venue_id, start_date, end_date)
    return slots
