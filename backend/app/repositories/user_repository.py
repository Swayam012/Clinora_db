import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import hash_password
from app.schemas.user import UserCreate


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """
    Look up a user by their email address.
    Returns the User object if found, None otherwise.
    """
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: uuid.UUID) -> Optional[User]:
    """
    Look up a user by their UUID.
    Returns the User object if found, None otherwise.
    """
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user_data: UserCreate) -> User:
    """
    Create a new user row in the database.

    Takes the validated UserCreate schema, hashes the password,
    and inserts the record. Returns the created User object.
    """
    db_user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role or "staff",
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)  # Reload from DB to get generated fields (id, created_at)
    return db_user
