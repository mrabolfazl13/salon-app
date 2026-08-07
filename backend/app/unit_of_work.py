from sqlmodel import Session
from contextlib import contextmanager
from typing import Optional
from app.database import engine
from app.repositories.user_repository import UserRepository
from app.repositories.venue_repository import VenueRepository, ClubRepository
from app.repositories.slot_repository import SlotRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.competition_repository import CompetitionRepository
from app.repositories.contract_repository import ContractRepository, ContractSlotRepository, ContractPaymentRepository

class UnitOfWork:
    
    def __init__(self):
        self._session: Optional[Session] = None
        self._repositories = {}
    
    def __enter__(self):
        self._session = Session(engine)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rollback()
        else:
            self.commit()
        self._session.close()
        self._session = None
    
    def commit(self):
        if self._session:
            self._session.commit()
    
    def rollback(self):
        if self._session:
            self._session.rollback()
    
    @property
    def session(self) -> Session:
        if not self._session:
            raise RuntimeError("Unit of work not started. Use 'with' statement.")
        return self._session
    
    @property
    def users(self) -> UserRepository:
        if "users" not in self._repositories:
            self._repositories["users"] = UserRepository(self.session)
        return self._repositories["users"]
    
    @property
    def venues(self) -> VenueRepository:
        if "venues" not in self._repositories:
            self._repositories["venues"] = VenueRepository(self.session)
        return self._repositories["venues"]
    
    @property
    def clubs(self) -> ClubRepository:
        if "clubs" not in self._repositories:
            self._repositories["clubs"] = ClubRepository(self.session)
        return self._repositories["clubs"]
    
    @property
    def slots(self) -> SlotRepository:
        if "slots" not in self._repositories:
            self._repositories["slots"] = SlotRepository(self.session)
        return self._repositories["slots"]
    
    @property
    def bookings(self) -> BookingRepository:
        if "bookings" not in self._repositories:
            self._repositories["bookings"] = BookingRepository(self.session)
        return self._repositories["bookings"]
    
    @property
    def competitions(self) -> CompetitionRepository:
        if "competitions" not in self._repositories:
            self._repositories["competitions"] = CompetitionRepository(self.session)
        return self._repositories["competitions"]
    
    @property
    def contracts(self) -> ContractRepository:
        if "contracts" not in self._repositories:
            self._repositories["contracts"] = ContractRepository(self.session)
        return self._repositories["contracts"]
    
    @property
    def contract_slots(self) -> ContractSlotRepository:
        if "contract_slots" not in self._repositories:
            self._repositories["contract_slots"] = ContractSlotRepository(self.session)
        return self._repositories["contract_slots"]
    
    @property
    def contract_payments(self) -> ContractPaymentRepository:
        if "contract_payments" not in self._repositories:
            self._repositories["contract_payments"] = ContractPaymentRepository(self.session)
        return self._repositories["contract_payments"]

def get_unit_of_work():
    with UnitOfWork() as uow:
        yield uow
