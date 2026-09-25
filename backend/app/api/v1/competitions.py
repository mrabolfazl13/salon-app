from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.schemas.competition import CompetitionCreate, CompetitionBid, CompetitionResponse
from app.services.competition_service import CompetitionService
from app.utils.auth import get_current_manager
from app.models.user import User
from app.services.notification_service import notification_service

router = APIRouter(prefix="/competitions", tags=["Competitions"])

@router.get("/active")
def list_active_competitions(uow: UnitOfWork = Depends(get_unit_of_work)):
    """رقابت‌های در جریان، گروه‌شده بر اساس سانس — نزدیک‌ترین مهلت اول."""
    now = datetime.now(timezone.utc)

    def as_utc(dt):
        return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt

    comps = [c for c in uow.competitions.get_active_competitions() if as_utc(c.expires_at) > now]

    by_slot: dict[int, list] = {}
    for c in comps:
        by_slot.setdefault(c.slot_id, []).append(c)

    items = []
    for slot_id, bids in by_slot.items():
        slot = uow.slots.get_by_id(slot_id)
        if not slot:
            continue
        venue = uow.venues.get_by_id(slot.venue_id)
        best = min(bids, key=lambda b: b.offered_price)
        items.append({
            "slot_id": slot_id,
            "venue_id": slot.venue_id,
            "venue_name": venue.name if venue else None,
            "date": str(slot.slot_date),
            "start_time": str(slot.start_time)[:5],
            "duration_minutes": slot.duration,
            "current_price": slot.current_price,
            "best_price": best.offered_price,
            "bid_count": len(bids),
            "expires_at": as_utc(best.expires_at),
        })

    items.sort(key=lambda i: i["expires_at"])
    return {"items": items[:10]}


@router.post("/start", response_model=CompetitionResponse)
async def start_competition(
    comp_data: CompetitionCreate,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager)
):
    competition = CompetitionService.start_competition(uow, comp_data.slot_id, current_user.id, comp_data.offered_price)
    
    slot = uow.slots.get_by_id(comp_data.slot_id)
    if slot:
        venue = uow.venues.get_by_id(slot.venue_id)
        await notification_service.notify_new_competition({
            "venue_name": venue.name if venue else "Unknown",
            "date": str(slot.slot_date),
            "time": str(slot.start_time)
        })
    
    return competition

@router.post("/{slot_id}/bid", response_model=CompetitionResponse)
async def place_bid(
    slot_id: int,
    bid_data: CompetitionBid,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_manager)
):
    bid = CompetitionService.bid_on_competition(uow, slot_id, current_user.id, bid_data.offered_price)
    return bid

@router.get("/slot/{slot_id}/best")
def get_best_bid(slot_id: int, uow: UnitOfWork = Depends(get_unit_of_work)):
    best = uow.competitions.get_best_bid(slot_id)
    return {"best_price": best.offered_price if best else None}
