"""Authentication API routes."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.user_ai_balance import UserAIBalance
from app.models.user_session import UserSession
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    SendCodeRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.services.sms import generate_code, store_code, verify_code

router = APIRouter()


def _build_token_response(user_id: str, db: Session) -> TokenResponse:
    """Create a new session and return token pair."""
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)

    session = UserSession(
        user_id=user_id,
        refresh_token=refresh_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(session)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


def _user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else "",
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/send-code")
def send_code(body: SendCodeRequest):
    """Generate a 6-digit SMS code and store it in Redis (5 min TTL)."""
    code = generate_code()
    store_code(body.phone, code)
    # In production the code would be sent via SMS; for development we return it.
    return {"message": "Code sent", "code": code}


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user with phone, password, and SMS verification code."""
    # 1. Verify SMS code
    if not verify_code(body.phone, body.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code",
        )

    # 2. Check duplicate phone
    existing = db.query(User).filter_by(phone=body.phone).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Phone number already registered",
        )

    # 3. Create user
    user = User(
        phone=body.phone,
        password_hash=hash_password(body.password),
        role="user",
    )
    db.add(user)
    db.flush()  # get user.id

    # 4. Grant free trial credits
    balance = UserAIBalance(
        user_id=user.id,
        image_credits=10,
        text_credits=5,
    )
    db.add(balance)

    # 5. Create session + return tokens
    return _build_token_response(user.id, db)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with phone and password, return token pair."""
    user = db.query(User).filter_by(phone=body.phone).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled",
        )

    return _build_token_response(user.id, db)


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    """Refresh an access token using a valid refresh token (rotation)."""
    # Validate the refresh token JWT
    payload = decode_token(body.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload["sub"]

    # Find the matching session
    session = (
        db.query(UserSession)
        .filter_by(user_id=user_id, refresh_token=body.refresh_token)
        .first()
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found (already used or revoked)",
        )

    # Rotate: delete old session, create new one
    db.delete(session)
    db.flush()

    return _build_token_response(user_id, db)


@router.post("/logout")
def logout(body: RefreshRequest, db: Session = Depends(get_db)):
    """Revoke a refresh token (delete the corresponding session)."""
    session = (
        db.query(UserSession)
        .filter_by(refresh_token=body.refresh_token)
        .first()
    )
    if session is not None:
        db.delete(session)
        db.commit()
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return _user_to_response(current_user)
