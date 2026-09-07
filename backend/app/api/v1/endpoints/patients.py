import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.models.user import User
from app.schemas.patient import (
    PatientCreate,
    PatientListResponse,
    PatientResponse,
    PatientUpdate,
)
from app.services import patient_service

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post(
    "",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new patient",
)
@limiter.limit("30/minute")
def create_patient(
    request: Request,
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registers a new patient and assigns an automatic structured ID (max 30/min per IP).
    """
    patient = patient_service.create_new_patient(
        db=db,
        patient_data=patient_in,
        current_user=current_user,
    )
    return patient


@router.get(
    "",
    response_model=PatientListResponse,
    summary="List patients with search and pagination",
)
@limiter.limit("120/minute")
def get_patients(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name, ID, phone, or email"),
    is_active: Optional[bool] = Query(True, description="Filter active/inactive patients"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetches a paginated list of patients. Supports quick keyword searching.
    """
    return patient_service.list_patients(
        db=db,
        page=page,
        per_page=per_page,
        search=search,
        is_active=is_active,
    )


@router.get(
    "/{patient_id}",
    response_model=PatientResponse,
    summary="Get patient by ID",
)
@limiter.limit("120/minute")
def get_patient(
    request: Request,
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetches complete profile for a single patient by UUID.
    """
    patient = patient_service.get_patient_details(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )
    return patient


@router.put(
    "/{patient_id}",
    response_model=PatientResponse,
    summary="Update patient information",
)
@limiter.limit("30/minute")
def update_patient(
    request: Request,
    patient_id: uuid.UUID,
    patient_in: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Updates details of an existing patient.
    """
    patient = patient_service.update_patient_details(db, patient_id, patient_in)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )
    return patient


@router.delete(
    "/{patient_id}",
    response_model=PatientResponse,
    summary="Soft delete a patient",
)
@limiter.limit("30/minute")
def delete_patient(
    request: Request,
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Marks a patient record as inactive.
    """
    patient = patient_service.soft_delete_patient(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )
    return patient
