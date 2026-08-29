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

def check_db_connection() -> dict:
    """
    Safely tests PostgreSQL connection without throwing an unhandled exception.
    Returns status dict containing connectivity boolean and message/error details.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            return {
                "connected": True,
                "message": "Database connection successful",
                "database_url": database_url.split("@")[-1]  # Hide credentials
            }
    except Exception as e:
        return {
            "connected": False,
            "message": f"Database unreachable: {str(e)}",
            "database_url": database_url.split("@")[-1]
        }
