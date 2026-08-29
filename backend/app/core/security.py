from datetime import datetime, timedelta, timezone
from typing import Any, Union

import bcrypt
from jose import jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    """
    Hash a plaintext password using bcrypt.

    How it works:
    1. Convert the password string to bytes (bcrypt operates on bytes).
    2. Generate a random salt (bcrypt.gensalt()).
    3. Hash the password+salt together.
    4. Return the hash as a string for database storage.

    The salt is embedded in the hash, so we don't need to store it separately.
    """
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compare a plaintext password against a stored bcrypt hash.

    bcrypt.checkpw extracts the salt from the hash, re-hashes the
    plaintext password with the same salt, and compares the results.
    Returns True if they match, False otherwise.
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def create_access_token(
    subject: Union[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a signed JWT token.

    Args:
        subject: The value to put in the 'sub' claim (typically user ID).
        expires_delta: How long until the token expires.
        Defaults to ACCESS_TOKEN_EXPIRE_MINUTES from settings.

    Returns:
        Encoded JWT string.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    # JWT payload: 'sub' is the subject (user ID), 'exp' is expiry timestamp
    to_encode = {"sub": str(subject), "exp": expire}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt
