from sqlmodel import Session, select
from typing import Optional, List
from datetime import datetime, timezone
from app.models.user import User, UserRole
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    
    def __init__(self, session: Session):
        super().__init__(User, session)
    
    def get_by_phone(self, phone: str) -> Optional[User]:
        return self.get_one(phone=phone)
    
    def get_by_role(self, role: UserRole, limit: int = 100) -> List[User]:
        return self.get_all(limit=limit, role=role)
    
    def get_active_users(self) -> List[User]:
        return self.get_all(is_active=True)
    
    def update_last_login(self, user_id: int) -> Optional[User]:
        return self.update(user_id, {"last_login": datetime.now(timezone.utc)})
    
    def verify_user(self, user_id: int) -> Optional[User]:
        return self.update(user_id, {"is_verified": True})
    
    def change_role(self, user_id: int, new_role: UserRole) -> Optional[User]:
        return self.update(user_id, {"role": new_role})
    
    def deactivate_user(self, user_id: int) -> Optional[User]:
        return self.update(user_id, {"is_active": False})
    
    def activate_user(self, user_id: int) -> Optional[User]:
        return self.update(user_id, {"is_active": True})
    
    def get_user_statistics(self) -> dict:
        total_users = self.count()
        active_users = self.count(is_active=True)
        verified_users = self.count(is_verified=True)
        
        role_counts = {}
        for role in UserRole:
            role_counts[role.value] = self.count(role=role)
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "verified_users": verified_users,
            "unverified_users": total_users - verified_users,
            "by_role": role_counts
        }
