import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class Document(Base):
    """
    SQLAlchemy model for the 'documents' table.

    Stores clinical document uploads (PDFs, scans, prescriptions, lab reports).
    Maintains relationships with the Patient and the User who uploaded it.
    Pre-configured with fields for OCR and AI clinical information extraction.
    """

    __tablename__ = "documents"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    patient = relationship("Patient", backref="documents")

    title = Column(String(255), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)

    # prescription, lab_report, clinical_note, discharge_summary, other
    document_type = Column(String(50), nullable=False, default="other", index=True)

    # uploaded, pending, processing, processed, failed
    status = Column(String(50), nullable=False, default="uploaded", index=True)

    # Extracted textual and clinical contents (populated in later phases)
    ocr_text = Column(Text, nullable=True)
    extracted_data = Column(JSON, nullable=True)

    # SHA-256 file checksum for deduplication & integrity verification
    checksum = Column(String(64), nullable=True, index=True)

    uploaded_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    uploaded_by = relationship("User", backref="documents_uploaded")

    is_active = Column(Boolean, default=True, nullable=False)

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
