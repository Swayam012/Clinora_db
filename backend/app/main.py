import logging
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.api import api_router
from app.api.v1.endpoints.health import health_check
from app.core.config import settings
from app.core.rate_limit import custom_rate_limit_exceeded_handler, limiter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("clinora")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Clinora — AI-Powered Clinical Document Intelligence & Analysis System API",
    version="0.1.0",
)

# Attach SlowAPI Limiter state and middleware
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Register Custom Rate Limit Handler (HTTP 429)
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_exceeded_handler)


# ──────────────────────────────────────────────
# Global Exception Handlers
# ──────────────────────────────────────────────

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Standardized HTTP error response."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Standardized Pydantic input validation error handler."""
    error_messages = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error.get("loc", []))
        msg = error.get("msg", "Invalid input")
        error_messages.append(f"{field}: {msg}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Input validation failed",
            "errors": error_messages,
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Catches unhandled internal exceptions, logs the full trace server-side,
    and returns a sanitized generic 500 error to prevent sensitive data leakage.
    """
    logger.exception(f"Unhandled internal server error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred. Please try again later.",
            "error_code": "INTERNAL_ERROR",
        },
    )


# ──────────────────────────────────────────────
# Defensive Security Headers Middleware
# ──────────────────────────────────────────────

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """
    Injects defensive HTTP security headers into every response.
    """
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' data: blob:; "
        "frame-src 'self' blob:; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000;"
    )
    return response


# ──────────────────────────────────────────────
# CORS Configuration (Restricted)
# ──────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
)

# Root /health endpoint
@app.get("/health", tags=["Health"])
@limiter.limit("120/minute")
def root_health(request: Request):
    return health_check(request)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
