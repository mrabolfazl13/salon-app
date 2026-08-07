from fastapi import HTTPException
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
from app.unit_of_work import UnitOfWork
from app.models.contract import ContractStatus, PaymentStatus, RecurrenceType
from app.models.slot import SlotStatus
from app.models.booking import BookingStatus

class ContractService:
    
    def __init__(self, uow: UnitOfWork):
        self.uow = uow
    
    @staticmethod
    def calculate_sessions_count(start_date: date, end_date: date, day_of_week: int, recurrence: RecurrenceType) -> int:
        count = 0
        current = start_date
        
        while current <= end_date:
            if current.weekday() == day_of_week:
                count += 1
            if recurrence == RecurrenceType.WEEKLY:
                current += timedelta(days=7)
            elif recurrence == RecurrenceType.BIWEEKLY:
                current += timedelta(days=14)
            elif recurrence == RecurrenceType.MONTHLY:
                current += relativedelta(months=1)
        
        return count
    
    def create_contract(self, contract_data, user_id: int):
        venue = self.uow.venues.get_by_id(contract_data.venue_id)
        if not venue:
            raise HTTPException(status_code=404, detail="Venue not found")
        
        if contract_data.start_date > contract_data.end_date:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
        
        num_sessions = self.calculate_sessions_count(
            contract_data.start_date, contract_data.end_date,
            contract_data.day_of_week, contract_data.recurrence
        )
        
        if num_sessions == 0:
            raise HTTPException(status_code=400, detail="No sessions found")
        
        sample_slot = self.uow.slots.get_one(venue_id=contract_data.venue_id)
        original_price = sample_slot.base_price if sample_slot else 300000
        
        if contract_data.discounted_price >= original_price:
            raise HTTPException(status_code=400, detail="Discounted price must be less than original price")
        
        total_amount = num_sessions * contract_data.discounted_price
        
        contract = self.uow.contracts.create({
            "user_id": user_id,
            "venue_id": contract_data.venue_id,
            "start_date": contract_data.start_date,
            "end_date": contract_data.end_date,
            "recurrence": contract_data.recurrence,
            "day_of_week": contract_data.day_of_week,
            "start_time": contract_data.start_time,
            "duration": 90,
            "original_price": original_price,
            "discounted_price": contract_data.discounted_price,
            "total_amount": total_amount,
            "description": contract_data.description,
            "status": ContractStatus.ACTIVE
        })
        
        return contract
