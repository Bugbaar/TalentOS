"""Rate limiting middleware for API protection."""

import time
from collections import defaultdict
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimiter:
    """Simple in-memory rate limiter using sliding window."""

    def __init__(self, requests_per_minute: int = 60) -> None:
        self.requests_per_minute = requests_per_minute
        self.window: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, client_id: str) -> tuple[bool, int]:
        """Check if a request from client_id is allowed.

        Returns (is_allowed, remaining_requests).
        """
        now = time.time()
        window_start = now - 60  # 1-minute window

        # Clean old entries
        self.window[client_id] = [
            ts for ts in self.window[client_id] if ts > window_start
        ]

        if len(self.window[client_id]) >= self.requests_per_minute:
            return False, 0

        self.window[client_id].append(now)
        remaining = self.requests_per_minute - len(self.window[client_id])
        return True, remaining


# Global rate limiter instance
_rate_limiter = RateLimiter(requests_per_minute=60)


def get_client_id(request: Request) -> str:
    """Extract client identifier from request."""
    # Use X-Forwarded-For header if behind a proxy, otherwise use client host
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit_response(retry_after: int) -> JSONResponse:
    """Return a 429 Too Many Requests response."""
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "error": {
                "message": "Too many requests. Please try again later.",
                "status_code": 429,
                "retry_after_seconds": retry_after,
            },
        },
        headers={"Retry-After": str(retry_after), "X-RateLimit-Remaining": "0"},
    )


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware that enforces rate limits per client."""

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Response]
    ) -> Response:
        # Skip rate limiting for health checks
        if request.url.path in {"/health", "/docs", "/openapi.json", "/redoc"}:
            return await call_next(request)

        client_id = get_client_id(request)
        allowed, remaining = _rate_limiter.is_allowed(client_id)

        if not allowed:
            return rate_limit_response(60)

        response = await call_next(request)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Limit"] = str(_rate_limiter.requests_per_minute)
        return response
