from fastapi import APIRouter
from app.core.config import settings
from app.db.session import check_db_connection

router = APIRouter()

@router.get("/health", summary="Health Check")
def health_check():
    """
    Returns system operational status and database connection details.
    """
    db_status = check_db_connection()
    return {
        "status": "ok",
        "app_name": settings.PROJECT_NAME,
        "version": "0.1.0",
        "database": db_status
    }
