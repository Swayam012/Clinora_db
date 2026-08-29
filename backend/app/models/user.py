import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class User(Base):
    """
    SQLAlchemy model for the 'users' table.

    Each row represents a registered user in the Clinora system.
    Passwords are never stored in plaintext — only bcrypt hashes.
    """

    __tablename__ = "users"

    # UUID primary key — more secure than sequential integers
    # (sequential IDs let attackers guess valid user IDs)
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)

    # Role: "admin" or "staff" — used for authorization checks later
    role = Column(String(50), nullable=False, default="staff")

    # Soft-delete flag: deactivate accounts without removing data
    is_active = Column(Boolean, default=True, nullable=False)

    # Audit timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
