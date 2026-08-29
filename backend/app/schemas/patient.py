import uuid
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class PatientBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100, examples=["Rajesh"])
    last_name: str = Field(..., min_length=1, max_length=100, examples=["Kumar"])
    date_of_birth: date = Field(..., examples=["1985-06-15"])
    gender: str = Field(..., pattern="^(male|female|other)$", examples=["male"])
    phone: Optional[str] = Field(None, max_length=30, examples=["+91-9876543210"])
    email: Optional[str] = Field(None, max_length=255, examples=["rajesh.kumar@example.com"])
    address: Optional[str] = Field(None, examples=["Flat 402, Green Valley Apartments, Mumbai"])
    blood_group: Optional[str] = Field(None, max_length=10, examples=["B+"])
    emergency_contact_name: Optional[str] = Field(None, max_length=100, examples=["Sunita Kumar"])
    emergency_contact_phone: Optional[str] = Field(None, max_length=30, examples=["+91-9876543211"])
    medical_notes: Optional[str] = Field(None, examples=["History of hypertension, allergic to penicillin."])


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_notes: Optional[str] = None
    is_active: Optional[bool] = None


class PatientResponse(PatientBase):
    id: uuid.UUID
    patient_id: str
    is_active: bool
    created_by_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PatientListResponse(BaseModel):
    total: int
    page: int
    per_page: int
    patients: List[PatientResponse]
