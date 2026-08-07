from fastapi import HTTPException
from datetime import datetime, timedelta
from app.unit_of_work import UnitOfWork
from app.models.slot import SlotStatus
from app.models.competition import CompetitionStatus

class CompetitionService:
    
    @staticmethod
    def start_competition(uow: UnitOfWork, slot_id: int, manager_id: int, offered_price: int):
        slot = uow.slots.get_by_id(slot_id)
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")
        
        venue = uow.venues.get_by_id(slot.venue_id)
        if venue.manager_id != manager_id:
            raise HTTPException(status_code=403, detail="You don't manage this venue")
        
        if slot.is_competition_enabled:
            raise HTTPException(status_code=400, detail="Competition already started")
        
        if slot.status != SlotStatus.AVAILABLE:
            raise HTTPException(status_code=400, detail="Slot is not available")
        
        uow.slots.update(slot_id, {"is_competition_enabled": True, "status": SlotStatus.IN_COMPETITION})
        
        competition = uow.competitions.create({
            "slot_id": slot_id,
            "venue_id": slot.venue_id,
            "venue_manager_id": manager_id,
            "offered_price": offered_price,
            "expires_at": datetime.utcnow() + timedelta(hours=24)
        })
        
        return competition
    
    @staticmethod
    def bid_on_competition(uow: UnitOfWork, slot_id: int, manager_id: int, offered_price: int):
        slot = uow.slots.get_by_id(slot_id)
        if not slot or not slot.is_competition_enabled:
            raise HTTPException(status_code=400, detail="No active competition for this slot")
        
        venue = uow.venues.get_by_id(slot.venue_id)
        if venue.manager_id == manager_id:
            raise HTTPException(status_code=400, detail="You cannot bid on your own competition")
        
        last_bid = uow.competitions.get_best_bid(slot_id)
        if last_bid and offered_price >= last_bid.offered_price:
            raise HTTPException(status_code=400, detail="New bid must be lower than current best")
        
        new_bid = uow.competitions.create({
            "slot_id": slot_id,
            "venue_id": slot.venue_id,
            "venue_manager_id": manager_id,
            "offered_price": offered_price,
            "expires_at": datetime.utcnow() + timedelta(hours=24)
        })
        
        return new_bid
    
    @staticmethod
    def resolve_expired_competitions(uow: UnitOfWork) -> int:
        expired = uow.competitions.get_expired_competitions()
        resolved_count = 0
        
        for comp in expired:
            best_bid = uow.competitions.get_best_bid(comp.slot_id)
            
            if best_bid:
                uow.slots.update(comp.slot_id, {
                    "current_price": best_bid.offered_price,
                    "competition_winner_id": best_bid.id,
                    "is_competition_enabled": False,
                    "status": SlotStatus.AVAILABLE
                })
                uow.competitions.mark_as_won(best_bid.id)
                resolved_count += 1
            else:
                uow.slots.update(comp.slot_id, {"is_competition_enabled": False, "status": SlotStatus.AVAILABLE})
                uow.competitions.mark_as_expired(comp.id)
        
        return resolved_count
