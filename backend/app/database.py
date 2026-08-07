from sqlmodel import SQLModel, create_engine, Session
from app.config import settings
from app.models import (
    User, Venue, Club, Slot, Booking, 
    PriceCompetition, Contract, ContractSlot, ContractPayment
)

engine = create_engine(
    settings.DATABASE_URL,
    echo=True,
    pool_size=10,
    max_overflow=20
)

def get_session():
    with Session(engine) as session:
        yield session

def init_db():
    SQLModel.metadata.create_all(engine)
