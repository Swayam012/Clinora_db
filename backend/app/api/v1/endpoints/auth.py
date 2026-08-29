from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import register_user, authenticate_user
from app.core.security import create_access_token
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user account.

    - Validates the input (email format, password length, role).
    - Checks if the email is already taken.
    - Hashes the password with bcrypt.
    - Stores the user in the database.
    - Returns the user profile (without password).
    """
    try:
        user = register_user(db, user_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return user


@router.post(
    "/login",
    response_model=Token,
    summary="Login and receive JWT token",
)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate with email and password.

    - Finds the user by email.
    - Verifies the password against the stored bcrypt hash.
    - If valid, creates a JWT token containing the user's ID.
    - Returns the token for use in subsequent requests.
    """
    user = authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create JWT with the user's ID as the subject
    access_token = create_access_token(subject=user.id)
    return Token(access_token=access_token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Return the profile of the currently authenticated user.

    This is a protected route — it requires a valid JWT token
    in the Authorization header: `Authorization: Bearer <token>`.
    """
    return current_user
