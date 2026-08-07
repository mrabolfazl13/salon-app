from fastapi import APIRouter, Depends
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.schemas.competition import CompetitionCreate, CompetitionBid, CompetitionResponse
from app.services.competition_service import CompetitionService
from app.utils.auth import get_current_manager
from app.models.user import User
from app.services.notification_service import notification_service

router = APIRouter(prefix="/competitions", tags=["Competitions"])

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
