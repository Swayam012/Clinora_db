import uuid
from typing import Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    UploadFile,
    File,
    Form,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.document import DocumentResponse, DocumentListResponse, DocumentUpdate
from app.services import document_service

router = APIRouter(prefix="/documents", tags=["Clinical Documents"])


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a new clinical document",
)
async def upload_document(
    patient_id: uuid.UUID = Form(..., description="Target patient UUID"),
    title: str = Form(..., min_length=1, max_length=255, description="Document title/label"),
    document_type: str = Form(
        "other",
        description="Type: prescription, lab_report, clinical_note, discharge_summary, other",
    ),
    file: UploadFile = File(..., description="PDF or image document"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Accepts medical PDFs, scans, and clinical images, verifies file integrity,
    stores on disk, and binds the record to the patient profile.
    """
    valid_types = ["prescription", "lab_report", "clinical_note", "discharge_summary", "other"]
    if document_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document_type. Allowed types: {', '.join(valid_types)}",
        )

    return await document_service.save_and_register_document(
        db=db,
        patient_id=patient_id,
        title=title,
        document_type=document_type,
        file=file,
        current_user=current_user,
    )


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List clinical documents with filters & search",
)
def get_documents(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    patient_id: Optional[uuid.UUID] = Query(None, description="Filter by Patient UUID"),
    document_type: Optional[str] = Query(None, description="Filter by Document Type"),
    status: Optional[str] = Query(None, description="Filter by Processing Status"),
    search: Optional[str] = Query(None, description="Search by document title or patient name"),
    is_active: Optional[bool] = Query(True, description="Filter active/deleted records"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lists clinical documents with multi-parameter filtering, keyword search, and pagination.
    """
    return document_service.fetch_documents(
        db=db,
        page=page,
        per_page=per_page,
        patient_id=patient_id,
        document_type=document_type,
        status=status,
        search=search,
        is_active=is_active,
    )


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get clinical document metadata",
)
def get_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves full document metadata and patient details.
    """
    doc = document_service.fetch_document_details(db, document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return doc


from app.api.deps import get_current_user, validate_token_string


@router.get(
    "/{document_id}/file",
    summary="Download or stream clinical document file",
)
def stream_document_file(
    document_id: uuid.UUID,
    token: Optional[str] = Query(None, description="Auth token for direct media preview"),
    db: Session = Depends(get_db),
):
    """
    Streams the raw PDF or image file for rendering in the Document Viewer.
    Accepts token via ?token= query parameter for direct browser iframe/img embedding.
    """
    if token:
        user = validate_token_string(token, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired preview token",
            )

    file_path, file_name, mime_type = document_service.get_document_file_path(db, document_id)
    return FileResponse(
        path=file_path,
        media_type=mime_type,
        filename=file_name,
    )


@router.put(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Update document metadata or processing status",
)
def update_document(
    document_id: uuid.UUID,
    doc_in: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Updates document title, category type, or processing status.
    """
    updated = document_service.modify_document(db, document_id, doc_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return updated


@router.delete(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Soft delete clinical document",
)
def delete_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deactivates document record from active listings.
    """
    deleted = document_service.remove_document(db, document_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return deleted
