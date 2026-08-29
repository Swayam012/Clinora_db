import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientUpdate, PatientListResponse, PatientResponse
from app.repositories import patient_repository


def generate_patient_id(db: Session, year: Optional[int] = None) -> str:
    """
    Generates a structured human-readable identifier: PAT-YYYY-00001
    """
    current_year = year or datetime.now(timezone.utc).year
    seq = patient_repository.get_next_patient_sequence(db, current_year)
    return f"PAT-{current_year}-{seq:05d}"


def create_new_patient(
    db: Session,
    patient_data: PatientCreate,
    current_user: Optional[User] = None,
) -> Patient:
    """
    Creates a new patient with auto-generated patient_id.
    """
    patient_id_str = generate_patient_id(db)
    
    # Ensure patient_id uniqueness (in case of race conditions)
    while patient_repository.get_patient_by_custom_id(db, patient_id_str):
        # Bump sequence if collision
        current_year = datetime.now(timezone.utc).year
        seq = patient_repository.get_next_patient_sequence(db, current_year) + 1
        patient_id_str = f"PAT-{current_year}-{seq:05d}"

    created_by_id = current_user.id if current_user else None
    return patient_repository.create_patient(
        db=db,
        patient_data=patient_data,
        patient_id_str=patient_id_str,
        created_by_id=created_by_id,
    )


def get_patient_details(db: Session, patient_id: uuid.UUID) -> Optional[Patient]:
    """Retrieves patient by UUID."""
    return patient_repository.get_patient_by_id(db, patient_id)


def list_patients(
    db: Session,
    page: int = 1,
    per_page: int = 20,
    search: Optional[str] = None,
    is_active: Optional[bool] = True,
) -> PatientListResponse:
    """Lists patients with pagination and search."""
    if page < 1:
        page = 1
    if per_page < 1 or per_page > 100:
        per_page = 20

    skip = (page - 1) * per_page
    patients, total = patient_repository.get_patients(
        db=db,
        skip=skip,
        limit=per_page,
        search=search,
        is_active=is_active,
    )

    return PatientListResponse(
        total=total,
        page=page,
        per_page=per_page,
        patients=[PatientResponse.model_validate(p) for p in patients],
    )


def update_patient_details(
    db: Session,
    patient_id: uuid.UUID,
    update_data: PatientUpdate,
) -> Optional[Patient]:
    """Updates an existing patient."""
    patient = patient_repository.get_patient_by_id(db, patient_id)
    if not patient:
        return None
    return patient_repository.update_patient(db, patient, update_data)


def soft_delete_patient(db: Session, patient_id: uuid.UUID) -> Optional[Patient]:
    """Soft deletes patient (marks inactive)."""
    patient = patient_repository.get_patient_by_id(db, patient_id)
    if not patient:
        return None
    return patient_repository.delete_patient(db, patient, hard_delete=False)
