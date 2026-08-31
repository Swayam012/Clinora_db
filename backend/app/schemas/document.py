import uuid
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field


class DocumentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, examples=["Blood Chemistry Report"])
    document_type: str = Field(
        default="other",
        pattern="^(prescription|lab_report|clinical_note|discharge_summary|other)$",
        examples=["lab_report"],
    )


class DocumentCreate(DocumentBase):
    patient_id: uuid.UUID


class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    document_type: Optional[str] = Field(
        None,
        pattern="^(prescription|lab_report|clinical_note|discharge_summary|other)$",
    )
    status: Optional[str] = Field(
        None,
        pattern="^(uploaded|pending|processing|processed|failed)$",
    )
    ocr_text: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class DocumentResponse(DocumentBase):
    id: uuid.UUID
    patient_id: uuid.UUID
    patient_name: Optional[str] = None
    patient_custom_id: Optional[str] = None
    file_name: str
    file_size: int
    mime_type: str
    status: str
    ocr_text: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    checksum: Optional[str] = None
    uploaded_by_id: Optional[uuid.UUID] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    total: int
    page: int
    per_page: int
    documents: List[DocumentResponse]
