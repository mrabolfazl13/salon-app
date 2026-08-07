from .auth import router as auth_router
from .venues import router as venues_router
from .slots import router as slots_router
from .bookings import router as bookings_router
from .competitions import router as competitions_router
from .contracts import router as contracts_router
from .admin import router as admin_router

__all__ = [
    "auth_router",
    "venues_router",
    "slots_router",
    "bookings_router",
    "competitions_router",
    "contracts_router",
    "admin_router"
]
