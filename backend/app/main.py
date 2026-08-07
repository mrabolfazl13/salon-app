# backend/app/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime

from app.config import settings
from app.database import init_db
from app.unit_of_work import get_unit_of_work, UnitOfWork
from app.api.v1 import (
    auth_router, venues_router, slots_router,
    bookings_router, competitions_router, contracts_router, admin_router
)
from app.utils.websocket import manager
from app.utils.auth import get_password_hash

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up...")
    init_db()
    
    # ایجاد داده‌های اولیه
    # from app.seed_data import seed_database
    # seed_database()
    
    yield
    print("👋 Shutting down...")

app = FastAPI(
    title="Futsal Booking System API",
    description="سیستم رزرو سالن فوتسال",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket
@app.websocket("/ws/{role}")
async def websocket_endpoint(websocket, role: str):
    await manager.connect(websocket, role)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except Exception:
        manager.disconnect(websocket, role)

# Health check
@app.get("/health")
async def health_check(uow: UnitOfWork = Depends(get_unit_of_work)):
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
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

@app.get("/")
async def root():
    return {"message": "Futsal Booking System API", "version": "2.0.0", "docs": "/docs"}