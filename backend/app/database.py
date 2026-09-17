import logging

from sqlmodel import SQLModel, create_engine, Session
from app.config import settings
import app.models  # noqa: F401,E402  — ثبت همه جدول‌ها در metadata قبل از create_all

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    pool_size=10,
    max_overflow=20
)

def get_session():
    with Session(engine) as session:
        yield session

def init_db():
    """ساخت جداول از روی مدل‌ها — فقط مسیر توسعه.

    در production اسکیما باید منحصراً با Alembic مدیریت شود؛
    همچنین با AUTO_CREATE_ALL=false می‌توان این مسیر را در توسعه هم خاموش کرد.
    """
    if settings.APP_ENV.strip().lower() == "production":
        logger.info("APP_ENV=production — create_all skipped; use alembic upgrade head")
        return
    if not settings.AUTO_CREATE_ALL:
        logger.info("AUTO_CREATE_ALL=false — create_all skipped")
        return
    SQLModel.metadata.create_all(engine)
