import uuid
from datetime import datetime, timezone, date
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, String, Date, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class Patient(Base):
    """
    SQLAlchemy model for the 'patients' table.
    
    Stores clinical and demographic information about patients.
    Linked with the User who registered/created the record.
    """

    __tablename__ = "patients"

    # UUID primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    # Human-readable sequential / structured identifier: e.g. PAT-2026-00001
    patient_id = Column(String(50), unique=True, index=True, nullable=False)

    first_name = Column(String(100), nullable=False, index=True)
    last_name = Column(String(100), nullable=False, index=True)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(20), nullable=False)  # male, female, other

    phone = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    address = Column(Text, nullable=True)
    blood_group = Column(String(10), nullable=True)  # A+, B+, O+, AB+, etc.

    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(30), nullable=True)
    medical_notes = Column(Text, nullable=True)

    # Soft delete
    is_active = Column(Boolean, default=True, nullable=False)

    # Creator link
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_by = relationship("User", backref="patients_created")

    # Timestamps
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
