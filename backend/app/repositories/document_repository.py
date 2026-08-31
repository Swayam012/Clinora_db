import uuid
from typing import Optional, List, Tuple
from sqlalchemy import or_, desc
from sqlalchemy.orm import Session, joinedload

from app.models.document import Document
from app.models.patient import Patient
from app.schemas.document import DocumentUpdate


def get_document_by_id(db: Session, document_id: uuid.UUID) -> Optional[Document]:
    """Retrieve document by UUID with eager loaded Patient details."""
    return (
        db.query(Document)
        .options(joinedload(Document.patient))
        .filter(Document.id == document_id)
        .first()
    )


def get_document_by_checksum(db: Session, checksum: str) -> Optional[Document]:
    """Check if a file with identical SHA-256 hash has already been stored."""
    return db.query(Document).filter(Document.checksum == checksum, Document.is_active == True).first()


def get_documents(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    patient_id: Optional[uuid.UUID] = None,
    document_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = True,
) -> Tuple[List[Document], int]:
    """
    Search and paginate documents.
    Supports filtering by patient, document type, status, and search string.
    Returns (documents_list, total_count).
    """
    query = db.query(Document).options(joinedload(Document.patient)).join(Patient)

    if is_active is not None:
        query = query.filter(Document.is_active == is_active)

    if patient_id:
        query = query.filter(Document.patient_id == patient_id)

    if document_type and document_type != "all":
        query = query.filter(Document.document_type == document_type)

    if status and status != "all":
        query = query.filter(Document.status == status)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Document.title.ilike(search_filter),
                Document.file_name.ilike(search_filter),
                Patient.first_name.ilike(search_filter),
                Patient.last_name.ilike(search_filter),
                Patient.patient_id.ilike(search_filter),
            )
        )

    total = query.count()
    documents = query.order_by(desc(Document.created_at)).offset(skip).limit(limit).all()
    return documents, total


def create_document(
    db: Session,
    patient_id: uuid.UUID,
    title: str,
    file_name: str,
    file_path: str,
    file_size: int,
    mime_type: str,
    document_type: str = "other",
    status: str = "uploaded",
    checksum: Optional[str] = None,
    uploaded_by_id: Optional[uuid.UUID] = None,
) -> Document:
    """Insert a new document record into database."""
    db_doc = Document(
        patient_id=patient_id,
        title=title,
        file_name=file_name,
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type,
        document_type=document_type,
        status=status,
        checksum=checksum,
        uploaded_by_id=uploaded_by_id,
        is_active=True,
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc


def update_document(
    db: Session,
    document: Document,
    update_data: DocumentUpdate,
) -> Document:
    """Update metadata or status of an existing document."""
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(document, field, value)

    db.commit()
    db.refresh(document)
    return document


def delete_document(db: Session, document: Document, hard_delete: bool = False) -> Document:
    """Soft delete document record."""
    if hard_delete:
        db.delete(document)
    else:
        document.is_active = False
    db.commit()
    return document
