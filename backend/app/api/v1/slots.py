from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import List
from datetime import date
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.schemas.slot import SlotResponse, SlotBlockResponse
from app.utils.auth import get_current_user
from app.utils.permissions import Perm
from app.utils.staff_access import ensure_venue_permission
from app.utils.time_guard import is_past_slot
from app.models.slot import SlotStatus
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
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """تولید سانس‌های روزانه — مالک/سرپرست یا کارکنان با slot.generate (branch_manager)"""
    ensure_venue_permission(uow, current_user, venue_id, [Perm.SLOT_GENERATE], request)
    
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


# ─────────────────────────── مسدود/آزادسازی سانس ───────────────────────────

def _load_slot_or_404(uow: UnitOfWork, slot_id: int):
    slot = uow.slots.get_by_id(slot_id)
    if not slot:
        raise HTTPException(status_code=404, detail="سانس یافت نشد")
    return slot


@router.post("/{slot_id}/block", response_model=SlotBlockResponse)
def block_slot(
    slot_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """مسدود کردن سانس آزادِ آینده — slot.block / مالک سالن / سرپرست.

    سانس‌های قرارداد (is_contract_slot) از این مسیر مسدود نمی‌شوند؛ قاعده‌ی
    استثنای سانس قرارداد همان مسیر contracts است.
    """
    slot = _load_slot_or_404(uow, slot_id)
    ensure_venue_permission(uow, current_user, slot.venue_id, [Perm.SLOT_BLOCK], request)
    if slot.is_contract_slot:
        raise HTTPException(status_code=400, detail="سانس قرارداد را نمی‌توان دستی مسدود کرد")
    if slot.status != SlotStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="فقط سانس آزاد قابل مسدود کردن است")
    if is_past_slot(slot.slot_date, slot.start_time):
        raise HTTPException(status_code=400, detail="سانس گذشته قابل مسدود کردن نیست")
    updated = uow.slots.block_slot(slot.id)
    uow.commit()
    return SlotBlockResponse(slot_id=updated.id, venue_id=updated.venue_id,
                             status=updated.status)


@router.post("/{slot_id}/unblock", response_model=SlotBlockResponse)
def unblock_slot(
    slot_id: int,
    request: Request,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    """آزاد کردن سانس مسدودشده‌ی آینده — همان قواعد دسترسی block؛ خروجی به AVAILABLE."""
    slot = _load_slot_or_404(uow, slot_id)
    ensure_venue_permission(uow, current_user, slot.venue_id, [Perm.SLOT_BLOCK], request)
    if slot.status != SlotStatus.BLOCKED:
        raise HTTPException(status_code=400, detail="فقط سانس مسدود قابل آزاد کردن است")
    if is_past_slot(slot.slot_date, slot.start_time):
        raise HTTPException(status_code=400, detail="سانس گذشته قابل آزاد کردن نیست")
    updated = uow.slots.release_slot(slot.id)
    uow.commit()
    return SlotBlockResponse(slot_id=updated.id, venue_id=updated.venue_id,
                             status=updated.status)
