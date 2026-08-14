from sqlmodel import SQLModel, Session, select, func, update, delete
from typing import TypeVar, Generic, Type, List, Optional, Dict, Any, Union
from datetime import datetime, timezone
from sqlalchemy import asc, desc, text

ModelType = TypeVar("ModelType", bound=SQLModel)

class BaseRepository(Generic[ModelType]):
    
    def __init__(self, model: Type[ModelType], session: Session):
        self.model = model
        self.session = session
    
    def create(self, data: Union[Dict[str, Any], ModelType]) -> ModelType:
        if isinstance(data, dict):
            obj = self.model(**data)
        else:
            obj = data
        self.session.add(obj)
        # commit توسط UnitOfWork مدیریت می‌شود
        self.session.flush()
        self.session.refresh(obj)
        return obj
    
    def bulk_create(self, data_list: List[Dict[str, Any]]) -> List[ModelType]:
        objects = [self.model(**data) for data in data_list]
        self.session.add_all(objects)
        # commit توسط UnitOfWork مدیریت می‌شود
        self.session.flush()
        for obj in objects:
            self.session.refresh(obj)
        return objects
    
    def get_by_id(self, id: int) -> Optional[ModelType]:
        return self.session.get(self.model, id)
    
    def get_by_id_with_lock(self, id: int) -> Optional[ModelType]:
        """گرفتن رکورد با قفل دیتابیسی (SELECT ... FOR UPDATE) برای جلوگیری از race condition"""
        stmt = select(self.model).where(self.model.id == id).with_for_update()
        return self.session.exec(stmt).first()
    
    def get_one(self, **filters) -> Optional[ModelType]:
        query = select(self.model)
        for key, value in filters.items():
            if hasattr(self.model, key) and value is not None:
                query = query.where(getattr(self.model, key) == value)
        return self.session.exec(query).first()
    
    def get_all(self, limit: int = 100, offset: int = 0, order_by: str = None, order_desc: bool = False, **filters) -> List[ModelType]:
        query = select(self.model)
        for key, value in filters.items():
            if hasattr(self.model, key) and value is not None:
                query = query.where(getattr(self.model, key) == value)
        
        if order_by and hasattr(self.model, order_by):
            order_attr = getattr(self.model, order_by)
            if order_desc:
                query = query.order_by(desc(order_attr))
            else:
                query = query.order_by(asc(order_attr))
        
        query = query.offset(offset).limit(limit)
        return self.session.exec(query).all()
    
    def update(self, id: int, data: Dict[str, Any]) -> Optional[ModelType]:
        obj = self.get_by_id(id)
        if not obj:
            return None
        
        for key, value in data.items():
            if hasattr(obj, key) and value is not None:
                setattr(obj, key, value)
        
        if hasattr(obj, "updated_at"):
            setattr(obj, "updated_at", datetime.now(timezone.utc))
        
        # commit توسط UnitOfWork مدیریت می‌شود
        self.session.flush()
        self.session.refresh(obj)
        return obj
    
    def delete(self, id: int, soft_delete: bool = True, delete_field: str = "is_active") -> bool:
        obj = self.get_by_id(id)
        if not obj:
            return False
        
        if soft_delete and hasattr(obj, delete_field):
            setattr(obj, delete_field, False)
            if hasattr(obj, "updated_at"):
                setattr(obj, "updated_at", datetime.now(timezone.utc))
        else:
            self.session.delete(obj)
        
        # commit توسط UnitOfWork مدیریت می‌شود
        self.session.flush()
        
        return True
    
    def count(self, **filters) -> int:
        query = select(func.count()).select_from(self.model)
        for key, value in filters.items():
            if hasattr(self.model, key) and value is not None:
                query = query.where(getattr(self.model, key) == value)
        return self.session.exec(query).one()
    
    def exists(self, **filters) -> bool:
        return self.count(**filters) > 0
