"""Health check and observability endpoints."""
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.database import get_session
from datetime import datetime, timezone
import time

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
def health_check(session: Session = Depends(get_session)):
    """Basic health check - returns service status."""
    try:
        # Test database connectivity
        session.exec("SELECT 1").first()
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "database": db_status,
        },
    }


@router.get("/detailed")
def detailed_health_check(session: Session = Depends(get_session)):
    """Detailed health check with all service dependencies."""
    from app.config import settings
    import redis
    
    services = {}
    
    # Database
    try:
        start = time.time()
        session.exec("SELECT 1").first()
        duration = time.time() - start
        services["database"] = {
            "status": "healthy",
            "response_time_ms": round(duration * 1000, 2),
        }
    except Exception as e:
        services["database"] = {"status": "unhealthy", "error": str(e)}
    
    # Redis
    try:
        start = time.time()
        r = redis.from_url(settings.REDIS_URL)
        r.ping()
        duration = time.time() - start
        services["redis"] = {
            "status": "healthy",
            "response_time_ms": round(duration * 1000, 2),
        }
    except Exception as e:
        services["redis"] = {"status": "unhealthy", "error": str(e)}
    
    # MinIO
    try:
        start = time.time()
        from minio import Minio
        client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        client.bucket_exists(settings.MINIO_BUCKET)
        duration = time.time() - start
        services["minio"] = {
            "status": "healthy",
            "response_time_ms": round(duration * 1000, 2),
        }
    except Exception as e:
        services["minio"] = {"status": "unhealthy", "error": str(e)}
    
    overall_status = "healthy" if all(s["status"] == "healthy" for s in services.values()) else "degraded"
    
    return {
        "status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": services,
    }


@router.get("/metrics")
def get_metrics(session: Session = Depends(get_session)):
    """Prometheus-style metrics endpoint."""
    from app.models.booking import Booking
    from app.models.user import User
    from app.models.venue import Venue
    import redis
    
    metrics = []
    
    # Total users
    try:
        user_count = session.exec(session.query(User).count()).one()
        metrics.append(f'# HELP total_users Total number of registered users\n# TYPE total_users gauge\ntotal_users {user_count}')
    except Exception:
        pass
    
    # Total bookings
    try:
        booking_count = session.exec(session.query(Booking).count()).one()
        metrics.append(f'# HELP total_bookings Total number of bookings\n# TYPE total_bookings gauge\ntotal_bookings {booking_count}')
    except Exception:
        pass
    
    # Active venues
    try:
        venue_count = session.exec(session.query(Venue).count()).one()
        metrics.append(f'# HELP total_venues Total number of active venues\n# TYPE total_venues gauge\ntotal_venues {venue_count}')
    except Exception:
        pass
    
    # Redis connection
    try:
        from app.config import settings
        r = redis.from_url(settings.REDIS_URL)
        r.ping()
        metrics.append('# HELP redis_connected Whether Redis is reachable\n# TYPE redis_connected gauge\nredis_connected 1')
    except Exception:
        metrics.append('redis_connected 0')
    
    return "\n\n".join(metrics)
