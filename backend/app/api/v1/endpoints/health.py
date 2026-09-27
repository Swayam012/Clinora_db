from fastapi import APIRouter, Request
from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.redis import check_redis_connection
from app.db.session import check_db_connection

router = APIRouter()


@router.get("/health", summary="Health Check")
@limiter.limit("120/minute")
def health_check(request: Request):
    """
    Returns system operational status, PostgreSQL database connectivity, and Redis cache health.
    """
    db_status = check_db_connection()
    redis_status = check_redis_connection()
    return {
        "status": "ok",
        "app_name": settings.PROJECT_NAME,
        "version": "0.1.0",
        "database": db_status,
        "redis": redis_status,
    }
