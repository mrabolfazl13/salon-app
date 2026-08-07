from fastapi import APIRouter, Depends, HTTPException
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.schemas.contract import ContractCreate, ContractResponse
from app.services.contract_service import ContractService
from app.utils.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/contracts", tags=["Contracts"])

@router.post("/", response_model=ContractResponse)
def create_contract(
    contract_data: ContractCreate,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    service = ContractService(uow)
    contract = service.create_contract(contract_data, current_user.id)
    return contract

@router.get("/", response_model=list)
def get_my_contracts(
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    contracts = uow.contracts.get_by_user(current_user.id)
    return contracts

@router.get("/{contract_id}")
def get_contract(
    contract_id: int,
    uow: UnitOfWork = Depends(get_unit_of_work),
    current_user: User = Depends(get_current_user)
):
    contract = uow.contracts.get_by_id(contract_id)
    if not contract or contract.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract
