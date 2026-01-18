from typing import override

from fastapi import Request
from fastapi.responses import JSONResponse
from limits import parse
from limits.storage import MemoryStorage
from limits.strategies import MovingWindowRateLimiter
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response


def get_real_ip(request: Request) -> str:
    """Get real client IP from X-Forwarded-For header (behind Caddy proxy)."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


_storage = MemoryStorage()
_rate_limiter = MovingWindowRateLimiter(_storage)
_RATE_LIMIT = parse("10/minute")


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware that applies rate limiting BEFORE request body parsing."""

    @override
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Only rate limit POST requests to /api/contact
        if request.method == "POST" and request.url.path == "/api/contact":
            client_ip = get_real_ip(request)
            if not _rate_limiter.hit(_RATE_LIMIT, client_ip):
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."},
                )
        return await call_next(request)
