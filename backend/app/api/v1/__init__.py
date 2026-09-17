from .auth import router as auth_router
from .venues import router as venues_router
from .slots import router as slots_router
from .bookings import router as bookings_router
from .competitions import router as competitions_router
from .contracts import router as contracts_router
from .admin import router as admin_router
from .upload import router as upload_router
from .reviews import router as reviews_router
from .notifications import router as notifications_router
from .payments import router as payments_router
from .games import router as games_router
from .memberships import router as memberships_router
from .finance import router as finance_router
from .holidays import router as holidays_router
from .pricing import router as pricing_router
from .coupons import router as coupons_router
from .loyalty import router as loyalty_router
from .favorites import router as favorites_router
from .deals import router as deals_router
from .teams import router as teams_router
from .staff import router as staff_router
from .crm import router as crm_router

__all__ = [
    "auth_router",
    "venues_router",
    "slots_router",
    "bookings_router",
    "competitions_router",
    "contracts_router",
    "admin_router",
    "upload_router",
    "reviews_router",
    "notifications_router",
    "payments_router",
    "games_router",
    "memberships_router",
    "finance_router",
    "holidays_router",
    "pricing_router",
    "coupons_router",
    "loyalty_router",
    "favorites_router",
    "deals_router",
    "teams_router",
    "staff_router",
    "crm_router",
]
