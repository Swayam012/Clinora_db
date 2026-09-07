import hashlib
import os
import uuid
from pathlib import Path
from typing import List, Optional, Tuple

import aiofiles
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.patient import Patient
from app.models.user import User
from app.repositories import document_repository, patient_repository
from app.schemas.document import DocumentListResponse, DocumentResponse, DocumentUpdate


def calculate_sha256(file_bytes: bytes) -> str:
    """Computes SHA-256 hash string for file integrity & deduplication."""
    hasher = hashlib.sha256()
    hasher.update(file_bytes)
    return hasher.hexdigest()


def detect_mime_type_from_magic_bytes(content: bytes) -> Optional[str]:
    """
    Inspects leading file bytes to determine real MIME type.
    Prevents content spoofing attacks (e.g. uploading .exe or .html as .pdf).
    """
    if len(content) < 8:
        return None

    # PDF: %PDF- (hex: 25 50 44 46 2D)
    if content.startswith(b"%PDF-"):
        return "application/pdf"

    # PNG: \x89PNG\r\n\x1a\n (hex: 89 50 4E 47 0D 0A 1A 0A)
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"

    # JPEG: \xFF\xD8\xFF
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"

    # TIFF: II*\x00 (little endian) or MM\x00* (big endian)
    if content.startswith(b"II*\x00") or content.startswith(b"MM\x00*"):
        return "image/tiff"

    # WebP: starts with RIFF and has WEBP at bytes 8-12
    if len(content) >= 12 and content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return "image/webp"

    return None


ALLOWED_EXTENSIONS_MAP = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".webp": "image/webp",
}


def map_document_to_response(doc: Document) -> DocumentResponse:
    """Transforms a Document SQLAlchemy model into DocumentResponse with patient metadata."""
    patient_name = None
    patient_custom_id = None
    if doc.patient:
        patient_name = f"{doc.patient.first_name} {doc.patient.last_name}"
        patient_custom_id = doc.patient.patient_id

    return DocumentResponse(
        id=doc.id,
        patient_id=doc.patient_id,
        patient_name=patient_name,
        patient_custom_id=patient_custom_id,
        title=doc.title,
        file_name=doc.file_name,
        file_size=doc.file_size,
        mime_type=doc.mime_type,
        document_type=doc.document_type,
        status=doc.status,
        ocr_text=doc.ocr_text,
        extracted_data=doc.extracted_data,
        checksum=doc.checksum,
        uploaded_by_id=doc.uploaded_by_id,
        is_active=doc.is_active,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


async def save_and_register_document(
    db: Session,
    patient_id: uuid.UUID,
    title: str,
    document_type: str,
    file: UploadFile,
    current_user: Optional[User] = None,
) -> DocumentResponse:
    """
    Securely validates magic bytes, verifies file extension, checks size bounds,
    writes to isolated storage, computes SHA-256 checksum, and creates database record.
    """
    # 1. Verify patient exists
    patient = patient_repository.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found",
        )

    # 2. Validate filename and extension
    original_filename = os.path.basename(file.filename or "unnamed_document")
    ext = Path(original_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS_MAP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Disallowed file extension '{ext}'. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS_MAP.keys())}",
        )

    # 3. Read content in chunks up to limit (prevents RAM exhaustion DoS)
    chunk_size = 1024 * 1024  # 1 MB
    chunks = []
    total_size = 0

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_size += len(chunk)
        if total_size > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB",
            )
        chunks.append(chunk)

    if total_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    content = b"".join(chunks)

    # 4. Validate Magic Bytes (real file signature inspection)
    detected_mime = detect_mime_type_from_magic_bytes(content)
    if not detected_mime or detected_mime not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format or corrupted file signature. The file content does not match allowed clinical document types (PDF, PNG, JPEG, TIFF, WebP).",
        )

    expected_mime = ALLOWED_EXTENSIONS_MAP[ext]
    if detected_mime != expected_mime and not (ext in [".jpg", ".jpeg"] and detected_mime == "image/jpeg"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '{ext}' does not match detected content format '{detected_mime}'.",
        )

    # 5. Calculate Checksum
    checksum = calculate_sha256(content)

    # 6. Prepare Storage Directory & Filename
    upload_base = Path(settings.UPLOAD_DIR) / str(patient_id)
    upload_base.mkdir(parents=True, exist_ok=True)

    doc_uuid = uuid.uuid4()
    # Safe storage name: strictly doc_uuid.hex + sanitized ext, preventing any path traversal or script execution
    safe_clean_name = "".join(c for c in Path(original_filename).stem if c.isalnum() or c in "._- ")[:50]
    storage_filename = f"{doc_uuid.hex}_{safe_clean_name}{ext}"
    file_path = upload_base / storage_filename

    # 7. Write File asynchronously
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # 8. Create DB Record
    uploaded_by_id = current_user.id if current_user else None
    created_doc = document_repository.create_document(
        db=db,
        patient_id=patient_id,
        title=title.strip(),
        file_name=original_filename,
        file_path=str(file_path.as_posix()),
        file_size=total_size,
        mime_type=detected_mime,
        document_type=document_type,
        status="uploaded",
        checksum=checksum,
        uploaded_by_id=uploaded_by_id,
    )

    return map_document_to_response(created_doc)


def fetch_documents(
    db: Session,
    page: int = 1,
    per_page: int = 20,
    patient_id: Optional[uuid.UUID] = None,
    document_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = True,
) -> DocumentListResponse:
    """Lists documents with pagination and multi-facet filtering."""
    if page < 1:
        page = 1
    if per_page < 1 or per_page > 100:
        per_page = 20

    skip = (page - 1) * per_page
    docs, total = document_repository.get_documents(
        db=db,
        skip=skip,
        limit=per_page,
        patient_id=patient_id,
        document_type=document_type,
        status=status,
        search=search,
        is_active=is_active,
    )

    return DocumentListResponse(
        total=total,
        page=page,
        per_page=per_page,
        documents=[map_document_to_response(d) for d in docs],
    )


def fetch_document_details(db: Session, document_id: uuid.UUID) -> Optional[DocumentResponse]:
    """Fetches document metadata and patient details."""
    doc = document_repository.get_document_by_id(db, document_id)
    if not doc:
        return None
    return map_document_to_response(doc)


def get_document_file_path(db: Session, document_id: uuid.UUID) -> Tuple[str, str, str]:
    """
    Returns (absolute_file_path, file_name, mime_type) for serving/downloading.
    """
    doc = document_repository.get_document_by_id(db, document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if not os.path.exists(doc.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical document file is missing on storage server",
        )

    return doc.file_path, doc.file_name, doc.mime_type


def modify_document(
    db: Session,
    document_id: uuid.UUID,
    update_data: DocumentUpdate,
) -> Optional[DocumentResponse]:
    """Updates document metadata or processing status."""
    doc = document_repository.get_document_by_id(db, document_id)
    if not doc:
        return None
    updated = document_repository.update_document(db, doc, update_data)
    return map_document_to_response(updated)


def remove_document(db: Session, document_id: uuid.UUID) -> Optional[DocumentResponse]:
    """Soft deletes document record."""
    doc = document_repository.get_document_by_id(db, document_id)
    if not doc:
        return None
    deleted = document_repository.delete_document(db, doc, hard_delete=False)
    return map_document_to_response(deleted)
