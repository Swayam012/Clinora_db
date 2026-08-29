import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import get_user_by_id

# This tells FastAPI where to look for the JWT token.
# The frontend must send: Authorization: Bearer <token>
# The tokenUrl is for Swagger UI's "Authorize" button — it points
# to our login endpoint so you can test auth directly in the docs.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency that extracts and validates the JWT from the request.

    How it works:
    1. OAuth2PasswordBearer extracts the token from the Authorization header.
    2. We decode the JWT using our SECRET_KEY.
    3. We extract the user ID from the 'sub' (subject) claim.
    4. We look up the user in the database.
    5. If anything fails, we return 401 Unauthorized.

    Usage in routes:
        @router.get("/protected")
        def protected_route(current_user: User = Depends(get_current_user)):
            return {"hello": current_user.full_name}
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode the JWT token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        # Extract the 'sub' claim (user ID we put in during login)
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
    except JWTError:
        # Token is invalid, expired, or tampered with
        raise credentials_exception

    # Look up the user in the database
    user = get_user_by_id(db, uuid.UUID(user_id_str))
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return user
