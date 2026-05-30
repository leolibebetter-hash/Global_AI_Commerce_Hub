"""Authentication utilities: password hashing and JWT token management."""

import uuid
import bcrypt
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.core.config import settings


def _now() -> datetime:
    """Return timezone-aware UTC now."""
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    """Return a bcrypt hash of *password*."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hash: str) -> bool:
    """Return True if *password* matches the bcrypt *hash*."""
    return bcrypt.checkpw(password.encode("utf-8"), hash.encode("utf-8"))


def create_access_token(user_id: str) -> str:
    """Create a short-lived JWT access token for the given user."""
    expire = _now() + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "access", "jti": str(uuid.uuid4())},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def create_refresh_token(user_id: str) -> str:
    """Create a long-lived JWT refresh token for the given user."""
    expire = _now() + timedelta(days=7)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "refresh", "jti": str(uuid.uuid4())},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_token(token: str) -> dict | None:
    """Decode and validate a JWT token. Returns the payload dict or None."""
    try:
        return jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
    except JWTError:
        return None
