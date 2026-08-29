import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Schema for user registration request body."""

    email: str = Field(..., min_length=5, max_length=255, examples=["doctor@clinora.com"])
    password: str = Field(..., min_length=8, max_length=128, examples=["SecurePass123!"])
    full_name: str = Field(..., min_length=2, max_length=255, examples=["Dr. Sarah Khan"])
    role: Optional[str] = Field(
        default="staff",
        pattern="^(admin|staff)$",
        description="User role: 'admin' or 'staff'",
    )


class UserLogin(BaseModel):
    """Schema for user login request body."""

    email: str = Field(..., examples=["doctor@clinora.com"])
    password: str = Field(..., examples=["SecurePass123!"])


class UserResponse(BaseModel):
    """
    Schema for user data returned to the frontend.
    Note: hashed_password is NEVER included here.
    """

    id: uuid.UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    # This tells Pydantic to read data from SQLAlchemy model attributes
    # (e.g., user.email) instead of requiring a dict
    model_config = {"from_attributes": True}


class Token(BaseModel):
    """Schema for JWT token response after login."""

    access_token: str
    token_type: str = "bearer"
