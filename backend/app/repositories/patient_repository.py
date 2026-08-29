import uuid
from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate


def get_patient_by_id(db: Session, patient_id: uuid.UUID) -> Optional[Patient]:
    """Look up a patient by their primary UUID."""
    return db.query(Patient).filter(Patient.id == patient_id).first()


def get_patient_by_custom_id(db: Session, patient_id_str: str) -> Optional[Patient]:
    """Look up a patient by their human-readable ID (e.g., PAT-2026-00001)."""
    return db.query(Patient).filter(Patient.patient_id == patient_id_str).first()


def get_next_patient_sequence(db: Session, year: int) -> int:
    """Calculates the next sequence integer for patient IDs within the given year."""
    prefix = f"PAT-{year}-%"
    count = db.query(func.count(Patient.id)).filter(Patient.patient_id.like(prefix)).scalar()
    return (count or 0) + 1


def get_patients(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    is_active: Optional[bool] = True,
) -> Tuple[List[Patient], int]:
    """
    Search and paginate patients.
    Supports filtering by search query (name, patient_id, phone, email).
    Returns (patients_list, total_count).
    """
    query = db.query(Patient)

    if is_active is not None:
        query = query.filter(Patient.is_active == is_active)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Patient.first_name.ilike(search_filter),
                Patient.last_name.ilike(search_filter),
                Patient.patient_id.ilike(search_filter),
                Patient.phone.ilike(search_filter),
                Patient.email.ilike(search_filter),
            )
        )

    total = query.count()
    patients = query.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()
    return patients, total


def create_patient(
    db: Session,
    patient_data: PatientCreate,
    patient_id_str: str,
    created_by_id: Optional[uuid.UUID] = None,
) -> Patient:
    """Create a new patient record."""
    db_patient = Patient(
        patient_id=patient_id_str,
        first_name=patient_data.first_name,
        last_name=patient_data.last_name,
        date_of_birth=patient_data.date_of_birth,
        gender=patient_data.gender,
        phone=patient_data.phone,
        email=patient_data.email,
        address=patient_data.address,
        blood_group=patient_data.blood_group,
        emergency_contact_name=patient_data.emergency_contact_name,
        emergency_contact_phone=patient_data.emergency_contact_phone,
        medical_notes=patient_data.medical_notes,
        created_by_id=created_by_id,
        is_active=True,
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


def update_patient(
    db: Session,
    patient: Patient,
    update_data: PatientUpdate,
) -> Patient:
    """Update existing patient details."""
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(patient, field, value)
    
    db.commit()
    db.refresh(patient)
    return patient


def delete_patient(db: Session, patient: Patient, hard_delete: bool = False) -> Patient:
    """Soft deletes patient by default, or hard deletes if specified."""
    if hard_delete:
        db.delete(patient)
    else:
        patient.is_active = False
    db.commit()
    return patient
