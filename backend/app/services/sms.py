"""Mock SMS service: stores verification codes in Redis (5-minute TTL).

Falls back to an in-memory dictionary when Redis is unavailable so that
tests (and local development without Redis) still work.
"""

import logging
import random

from app.core.redis import r as redis_client

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory fallback
# ---------------------------------------------------------------------------
_fallback_store: dict[str, str] = {}
_redis_available: bool = True


def _check_redis() -> bool:
    """Return True if Redis is reachable."""
    try:
        redis_client.ping()
        return True
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def generate_code() -> str:
    """Return a random 6-digit code as a zero-padded string."""
    return f"{random.randint(0, 999999):06d}"


def store_code(phone: str, code: str) -> None:
    """Store *code* for *phone* with a 5-minute TTL."""
    global _redis_available
    if _redis_available and _check_redis():
        try:
            redis_client.setex(f"sms:{phone}", 300, code)
            return
        except Exception as exc:
            logger.warning("Redis setex failed, falling back to memory: %s", exc)
            _redis_available = False
    _fallback_store[phone] = code


def verify_code(phone: str, code: str) -> bool:
    """Verify *code* for *phone*. Consumes the code on success."""
    global _redis_available
    if _redis_available:
        try:
            stored = redis_client.get(f"sms:{phone}")
            if stored is not None and stored == code:
                redis_client.delete(f"sms:{phone}")
                return True
            return False
        except Exception as exc:
            logger.warning("Redis get/delete failed, falling back to memory: %s", exc)
            _redis_available = False

    stored = _fallback_store.pop(phone, None)
    return stored is not None and stored == code
