from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from app.repositories.user_repository import get_user_by_email, create_user
from app.core.security import verify_password


def register_user(db: Session, user_data: UserCreate) -> User:
    """
    Register a new user.

    Business rules enforced here:
    1. Email must not already be taken.
    2. Password is hashed before storage (handled by repository).

    Raises:
        ValueError: If the email is already registered.

    Returns:
        The newly created User object.
    """
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise ValueError("A user with this email already exists")

    return create_user(db, user_data)


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Verify login credentials.

    Steps:
    1. Find user by email.
    2. Compare plaintext password against stored bcrypt hash.
    3. Check that the account is active.

    Returns:
        User object if credentials are valid and account is active.
        None if email not found, password wrong, or account disabled.
    """
    user = get_user_by_email(db, email)
    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    if not user.is_active:
        return None

    return user
