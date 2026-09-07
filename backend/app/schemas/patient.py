import re
import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class PatientBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100, examples=["Rajesh"])
    last_name: str = Field(..., min_length=1, max_length=100, examples=["Kumar"])
    date_of_birth: date = Field(..., examples=["1985-06-15"])
    gender: str = Field(..., pattern="^(male|female|other)$", examples=["male"])
    phone: Optional[str] = Field(None, max_length=30, examples=["+91-9876543210"])
    email: Optional[EmailStr] = Field(None, examples=["rajesh.kumar@example.com"])
    address: Optional[str] = Field(None, max_length=500, examples=["Flat 402, Green Valley Apartments, Mumbai"])
    blood_group: Optional[str] = Field(None, pattern="^(A|B|AB|O)[+-]$", examples=["B+"])
    emergency_contact_name: Optional[str] = Field(None, max_length=100, examples=["Sunita Kumar"])
    emergency_contact_phone: Optional[str] = Field(None, max_length=30, examples=["+91-9876543211"])
    medical_notes: Optional[str] = Field(None, max_length=2000, examples=["History of hypertension."])

    @field_validator("first_name", "last_name")
    @classmethod
    def sanitize_names(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be blank")
        return v

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: date) -> date:
        today = date.today()
        if v > today:
            raise ValueError("Date of birth cannot be in the future")
        if (today.year - v.year) > 130:
            raise ValueError("Invalid date of birth: age exceeds reasonable limit")
        return v

    @field_validator("phone", "emergency_contact_phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not v:
            return None
        if not re.match(r"^\+?[0-9\s\-()]{7,25}$", v):
            raise ValueError("Invalid phone number format")
        return v


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    phone: Optional[str] = Field(None, max_length=30)
    email: Optional[EmailStr] = None
    address: Optional[str] = Field(None, max_length=500)
    blood_group: Optional[str] = Field(None, pattern="^(A|B|AB|O)[+-]$")
    emergency_contact_name: Optional[str] = Field(None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(None, max_length=30)
    medical_notes: Optional[str] = Field(None, max_length=2000)
    is_active: Optional[bool] = None

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: Optional[date]) -> Optional[date]:
        if v is None:
            return v
        today = date.today()
        if v > today:
            raise ValueError("Date of birth cannot be in the future")
        if (today.year - v.year) > 130:
            raise ValueError("Invalid date of birth: age exceeds reasonable limit")
        return v

    @field_validator("phone", "emergency_contact_phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not v:
            return None
        if not re.match(r"^\+?[0-9\s\-()]{7,25}$", v):
            raise ValueError("Invalid phone number format")
        return v


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
