"""
Redis Client Manager, Caching Layer, and In-Memory Graceful Fallback Engine.
Provides high-performance distributed caching, JWT token blacklisting, and
rate-limiting storage with zero-downtime automatic fallback.
"""

import json
import time
import logging
import threading
from typing import Any, Optional, Dict, Tuple
from functools import wraps

import redis
from app.core.config import settings

logger = logging.getLogger("clinora.redis")

# Global Redis connection pool
_redis_client: Optional[redis.Redis] = None
_redis_available: Optional[bool] = None
_last_check_time: float = 0.0
_CHECK_INTERVAL_SECS: float = 30.0  # re-check connectivity every 30s

# Thread-safe in-memory fallback cache
_in_memory_lock = threading.Lock()
_in_memory_cache: Dict[str, Tuple[Any, float]] = {}  # key -> (value, expire_at)
_jwt_blacklist_memory: Dict[str, float] = {}  # token -> expire_at

# Telemetry stats
_cache_stats = {
    "hits": 0,
    "misses": 0,
    "sets": 0,
    "deletes": 0,
}


def get_redis_client() -> Optional[redis.Redis]:
    """
    Returns a connected Redis client instance if Redis is available, or None.
    Re-tests connection periodically to auto-reconnect when Redis comes online.
    """
    global _redis_client, _redis_available, _last_check_time

    if not settings.REDIS_ENABLED:
        return None

    now = time.time()

    # Reuse established client if healthy
    if _redis_client is not None and _redis_available is True:
        return _redis_client

    # Throttle re-connection attempts when Redis was previously unreachable
    if _redis_available is False and (now - _last_check_time) < _CHECK_INTERVAL_SECS:
        return None

    _last_check_time = now

    try:
        redis_url = settings.get_redis_url()
        client = redis.Redis.from_url(
            redis_url,
            socket_connect_timeout=settings.REDIS_CONNECT_TIMEOUT_SECS,
            socket_timeout=settings.REDIS_CONNECT_TIMEOUT_SECS,
            decode_responses=True,
        )
        # Test connection with a fast PING
        client.ping()
        _redis_client = client
        _redis_available = True
        logger.info(f"Connected to Redis server at {settings.REDIS_HOST}:{settings.REDIS_PORT} (DB {settings.REDIS_DB})")
        return _redis_client
    except Exception as exc:
        _redis_available = False
        _redis_client = None
        logger.warning(
            f"Redis server unavailable at {settings.REDIS_HOST}:{settings.REDIS_PORT} ({exc}). "
            f"Using high-performance In-Memory cache fallback."
        )
        return None


def check_redis_connection() -> Dict[str, Any]:
    """
    Diagnoses Redis connectivity, measuring response latency in milliseconds.
    """
    client = get_redis_client()
    if client is not None:
        try:
            start_time = time.perf_counter()
            client.ping()
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            info = client.info("server")
            redis_version = info.get("redis_version", "unknown")
            return {
                "status": "connected",
                "engine": "Redis",
                "host": settings.REDIS_HOST,
                "port": settings.REDIS_PORT,
                "db": settings.REDIS_DB,
                "latency_ms": latency_ms,
                "version": redis_version,
                "cache_stats": _cache_stats,
            }
        except Exception as exc:
            logger.warning(f"Redis ping failed during health check: {exc}")

    return {
        "status": "fallback_in_memory",
        "engine": "InMemoryCache",
        "host": "localhost",
        "port": settings.REDIS_PORT,
        "latency_ms": 0.05,
        "note": "Redis server offline. Automatic in-memory cache active.",
        "cache_stats": _cache_stats,
    }


def redis_cache_get(key: str) -> Optional[Any]:
    """
    Retrieve item from Redis, with automatic in-memory fallback.
    """
    client = get_redis_client()
    if client is not None:
        try:
            val = client.get(key)
            if val is not None:
                _cache_stats["hits"] += 1
                try:
                    return json.loads(val)
                except Exception:
                    return val
            _cache_stats["misses"] += 1
            return None
        except Exception as exc:
            logger.debug(f"Redis GET failed for key {key}: {exc}")

    # Fallback to In-Memory cache
    with _in_memory_lock:
        now = time.time()
        if key in _in_memory_cache:
            value, expire_at = _in_memory_cache[key]
            if expire_at == 0 or expire_at > now:
                _cache_stats["hits"] += 1
                return value
            else:
                del _in_memory_cache[key]

    _cache_stats["misses"] += 1
    return None


def redis_cache_set(key: str, value: Any, ttl_seconds: Optional[int] = None) -> bool:
    """
    Store item in Redis with TTL expiration, with automatic in-memory fallback.
    """
    if ttl_seconds is None:
        ttl_seconds = settings.REDIS_CACHE_TTL_SECONDS

    _cache_stats["sets"] += 1
    client = get_redis_client()
    if client is not None:
        try:
            serialized = json.dumps(value) if not isinstance(value, str) else value
            if ttl_seconds > 0:
                client.setex(key, ttl_seconds, serialized)
            else:
                client.set(key, serialized)
            return True
        except Exception as exc:
            logger.debug(f"Redis SET failed for key {key}: {exc}")

    # Fallback to In-Memory cache
    with _in_memory_lock:
        now = time.time()
        expire_at = (now + ttl_seconds) if ttl_seconds > 0 else 0
        _in_memory_cache[key] = (value, expire_at)
        # Cleanup expired items if memory store grows
        if len(_in_memory_cache) > 1000:
            expired_keys = [k for k, (_, exp) in _in_memory_cache.items() if exp > 0 and exp < now]
            for k in expired_keys:
                _in_memory_cache.pop(k, None)
    return True


def redis_cache_delete(key: str) -> bool:
    """
    Delete item from Redis and in-memory cache.
    """
    _cache_stats["deletes"] += 1
    client = get_redis_client()
    if client is not None:
        try:
            client.delete(key)
        except Exception as exc:
            logger.debug(f"Redis DELETE failed for key {key}: {exc}")

    with _in_memory_lock:
        _in_memory_cache.pop(key, None)
    return True


def redis_cache_delete_pattern(pattern: str) -> int:
    """
    Delete all keys matching a glob pattern (e.g. 'ocr:doc:*').
    """
    count = 0
    client = get_redis_client()
    if client is not None:
        try:
            keys = client.keys(pattern)
            if keys:
                client.delete(*keys)
                count = len(keys)
        except Exception as exc:
            logger.debug(f"Redis DELETE pattern failed for {pattern}: {exc}")

    # Also clean matching in-memory keys
    prefix = pattern.replace("*", "")
    with _in_memory_lock:
        matching = [k for k in _in_memory_cache.keys() if k.startswith(prefix)]
        for k in matching:
            _in_memory_cache.pop(k, None)
            count += 1
    return count


def blacklist_jwt_token(token: str, exp_seconds: int = 1800) -> bool:
    """
    Blacklist a revoked JWT token until its expiration time.
    """
    key = f"jwt:blacklist:{token}"
    client = get_redis_client()
    if client is not None:
        try:
            client.setex(key, max(exp_seconds, 60), "revoked")
            return True
        except Exception as exc:
            logger.debug(f"Redis JWT blacklist failed: {exc}")

    with _in_memory_lock:
        now = time.time()
        _jwt_blacklist_memory[token] = now + max(exp_seconds, 60)
    return True


def is_token_blacklisted(token: str) -> bool:
    """
    Check if a JWT token has been revoked/logged out. O(1) complexity.
    """
    key = f"jwt:blacklist:{token}"
    client = get_redis_client()
    if client is not None:
        try:
            return client.exists(key) > 0
        except Exception as exc:
            logger.debug(f"Redis JWT check failed: {exc}")

    with _in_memory_lock:
        now = time.time()
        if token in _jwt_blacklist_memory:
            if _jwt_blacklist_memory[token] > now:
                return True
            else:
                del _jwt_blacklist_memory[token]
    return False


def cached_clinical_query(prefix: str, ttl: int = 3600):
    """
    Decorator for caching deterministic service/query functions by arguments.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Build cache key from function arguments
            args_str = ":".join(str(a) for a in args)
            kwargs_str = ":".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
            cache_key = f"{prefix}:{args_str}:{kwargs_str}"

            cached = redis_cache_get(cache_key)
            if cached is not None:
                return cached

            result = func(*args, **kwargs)
            if result is not None:
                redis_cache_set(cache_key, result, ttl_seconds=ttl)
            return result
        return wrapper
    return decorator
