from app.unit_of_work import UnitOfWork
from app.utils.auth import verify_password, get_password_hash
from app.models.user import User

class AuthService:
    
    @staticmethod
    def authenticate_user(uow: UnitOfWork, phone: str, password: str) -> User | None:
        user = uow.users.get_by_phone(phone)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
    
    @staticmethod
    def create_user(uow: UnitOfWork, phone: str, full_name: str, password: str, role: str = "user") -> User:
        hashed_password = get_password_hash(password)
        user = uow.users.create({
            "phone": phone,
            "full_name": full_name,
            "hashed_password": hashed_password,
            "role": role
        })
        return user
    
    @staticmethod
    def change_password(uow: UnitOfWork, user_id: int, old_password: str, new_password: str) -> bool:
        user = uow.users.get_by_id(user_id)
        if not user or not verify_password(old_password, user.hashed_password):
            return False
        uow.users.update(user_id, {"hashed_password": get_password_hash(new_password)})
        return True
