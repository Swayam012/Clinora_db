import re
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    """Schema for user registration request body with strict security validation."""

    email: EmailStr = Field(..., examples=["doctor@clinora.com"])
    password: str = Field(..., min_length=8, max_length=128, examples=["SecurePass123!"])
    full_name: str = Field(..., min_length=2, max_length=255, examples=["Dr. Sarah Khan"])
    role: Optional[str] = Field(
        default="staff",
        pattern="^(admin|staff)$",
        description="User role: 'admin' or 'staff'",
    )

    @field_validator("full_name")
    @classmethod
    def sanitize_full_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[@$!%*?&#^()_\-+=\[\]{}|;:,.<>/]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class UserLogin(BaseModel):
    """Schema for user login request body."""

    email: EmailStr = Field(..., examples=["doctor@clinora.com"])
    password: str = Field(..., min_length=1, max_length=128, examples=["SecurePass123!"])


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

    model_config = {"from_attributes": True}


class Token(BaseModel):
    """Schema for JWT token response after login."""

    access_token: str
    token_type: str = "bearer"
