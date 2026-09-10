# backend/app/main.py
import os

from fastapi import FastAPI, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from app.config import settings
from app.database import init_db
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.api.v1 import (
    auth_router, venues_router, slots_router,
    bookings_router, competitions_router, contracts_router, admin_router,
    upload_router, reviews_router, notifications_router, payments_router,
    games_router, memberships_router
)
from app.utils.websocket import manager
from app.utils.auth import get_password_hash

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    init_db()
    
    # ایجاد داده‌های اولیه
    # from app.seed_data import seed_database
    # seed_database()
    
    yield
    print("Shutting down...")

app = FastAPI(
    title="Futsal Booking System API",
    description="سیستم رزرو سالن فوتسال",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket
@app.websocket("/ws/{role}")
async def websocket_endpoint(websocket: WebSocket, role: str):
    await manager.connect(websocket, role)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except Exception:
        manager.disconnect(websocket, role)

@app.websocket("/ws/user/{user_id}")
async def websocket_user_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, "users", user_id)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except Exception:
        manager.disconnect(websocket, "users", user_id)

# Health check
@app.get("/health")
async def health_check(uow: UnitOfWork = Depends(get_unit_of_work)):
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "connected" if uow.session else "disconnected"
    }

# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(venues_router, prefix="/api/v1")
app.include_router(slots_router, prefix="/api/v1")
app.include_router(bookings_router, prefix="/api/v1")
app.include_router(competitions_router, prefix="/api/v1")
app.include_router(contracts_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(upload_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(games_router, prefix="/api/v1")
app.include_router(memberships_router, prefix="/api/v1")

# Static files - عکس‌های واقعی سالن‌ها
_static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.isdir(_static_dir):
    app.mount("/static", StaticFiles(directory=_static_dir), name="static")

@app.get("/")
async def root():
    return {"message": "Futsal Booking System API", "version": "2.0.0", "docs": "/docs"}
