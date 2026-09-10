from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserLogin, UserResponse
from app.services.auth_service import authenticate_user, register_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
@limiter.limit(settings.AUTH_RATE_LIMIT)
def register(
    request: Request,
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new user account with rate limiting.
    Enforces staff role on public registration to prevent privilege escalation.
    """
    # Defensive enforcement: public registrations can only create 'staff' accounts
    user_data.role = "staff"
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
@limiter.limit(settings.AUTH_RATE_LIMIT)
def login(
    request: Request,
    login_data: UserLogin,
    db: Session = Depends(get_db),
):
    """
    Authenticate with email and password (max 5 attempts per 15 mins per IP).
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
@limiter.limit("60/minute")
def get_me(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Return the profile of the currently authenticated user.
    """
    return current_user
