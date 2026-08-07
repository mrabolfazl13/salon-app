from sqlmodel import Session, select
from datetime import datetime
from typing import Optional, List
from app.models.competition import PriceCompetition, CompetitionStatus
from app.repositories.base import BaseRepository

class CompetitionRepository(BaseRepository[PriceCompetition]):
    
    def __init__(self, session: Session):
        super().__init__(PriceCompetition, session)
    
    def get_active_by_slot(self, slot_id: int) -> Optional[PriceCompetition]:
        return self.get_one(slot_id=slot_id, status=CompetitionStatus.ACTIVE)
    
    def get_all_by_slot(self, slot_id: int) -> List[PriceCompetition]:
        return self.get_all(slot_id=slot_id)
    
    def get_by_manager(self, manager_id: int, limit: int = 50) -> List[PriceCompetition]:
        return self.get_all(limit=limit, venue_manager_id=manager_id, order_by="created_at", order_desc=True)
    
    def get_best_bid(self, slot_id: int) -> Optional[PriceCompetition]:
        statement = select(PriceCompetition).where(
            PriceCompetition.slot_id == slot_id,
            PriceCompetition.status == CompetitionStatus.ACTIVE
        ).order_by(PriceCompetition.offered_price.asc())
        return self.session.exec(statement).first()
    
    def get_active_competitions(self) -> List[PriceCompetition]:
        return self.get_all(status=CompetitionStatus.ACTIVE)
    
    def get_expired_competitions(self) -> List[PriceCompetition]:
        statement = select(PriceCompetition).where(
            PriceCompetition.status == CompetitionStatus.ACTIVE,
            PriceCompetition.expires_at < datetime.utcnow()
        )
        return self.session.exec(statement).all()
    
    def mark_as_won(self, competition_id: int) -> Optional[PriceCompetition]:
        return self.update(competition_id, {"status": CompetitionStatus.WON})
    
    def mark_as_lost(self, competition_id: int) -> Optional[PriceCompetition]:
        return self.update(competition_id, {"status": CompetitionStatus.LOST})
    
    def mark_as_expired(self, competition_id: int) -> Optional[PriceCompetition]:
        return self.update(competition_id, {"status": CompetitionStatus.EXPIRED})
