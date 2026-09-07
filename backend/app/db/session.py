from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Create SQLAlchemy engine using the computed DATABASE_URL
database_url = settings.get_database_url()
engine = create_engine(
    database_url,
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator:
    """Dependency for obtaining database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

import logging

logger = logging.getLogger(__name__)


def check_db_connection() -> dict:
    """
    Safely tests PostgreSQL connection without throwing an unhandled exception.
    Returns a sanitized status dict without exposing internal server, port, or DB credentials.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            return {
                "connected": True,
                "status": "operational",
            }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "connected": False,
            "status": "unavailable",
        }
