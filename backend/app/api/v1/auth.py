from fastapi import APIRouter, Depends, HTTPException, status
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import AuthService
from app.utils.auth import create_access_token, get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, uow: UnitOfWork = Depends(get_unit_of_work)):
    existing_user = uow.users.get_by_phone(user_data.phone)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user = AuthService.create_user(
        uow=uow,
        phone=user_data.phone,
        full_name=user_data.full_name,
        password=user_data.password,
        role=user_data.role.value
    )
    return user

@router.post("/login", response_model=Token)
def login(user_data: UserLogin, uow: UnitOfWork = Depends(get_unit_of_work)):
    user = AuthService.authenticate_user(uow, user_data.phone, user_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect phone or password")
    
    uow.users.update_last_login(user.id)
    access_token = create_access_token(data={"sub": user.phone})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
