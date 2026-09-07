"""
CLINORA — Rate Limiting Configuration (slowapi)

Implements client-IP based rate limiting across all API endpoints:
  - Auth routes: Max 5 attempts per 15 minutes per IP.
  - Document Uploads: Max 10 requests per minute per IP.
  - OCR Execution: Max 15 requests per minute per IP.
  - Patient CRUD: Max 30 requests per minute per IP.
  - General Reads / Health: Max 120 requests per minute per IP.

Returns HTTP 429 Too Many Requests when the limit is breached.
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# Initialize Limiter using remote client IP address
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["120/minute"],
    headers_enabled=False,
)


def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Custom HTTP 429 response handler returning safe JSON error message.
    """
    retry_after = getattr(exc, "retry_after", None)
    headers = {}
    if retry_after:
        headers["Retry-After"] = str(retry_after)

    return JSONResponse(
        status_code=429,
        content={
            "detail": f"Rate limit exceeded: {exc.detail}. Please slow down your requests.",
            "error_code": "RATE_LIMIT_EXCEEDED",
        },
        headers=headers,
    )
