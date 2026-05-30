"""Redis client shared across the application."""

import redis as _redis
from app.core.config import settings

r = _redis.from_url(settings.redis_url, decode_responses=True)
