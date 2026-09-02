"""Custom exceptions and exception handlers for consistent API error responses."""

import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

logger = logging.getLogger(__name__)


class TalentOSException(Exception):
    """Base exception for TalentOS-specific errors."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(TalentOSException):
    """Raised when a requested resource is not found."""

    def __init__(
        self,
        resource: str,
        identifier: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} with id '{identifier}' not found"
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
        )


class ConflictError(TalentOSException):
    """Raised when an operation conflicts with existing state."""

    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            details=details,
        )


class ValidationError(TalentOSException):
    """Raised when business validation fails."""

    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )


class ServiceUnavailableError(TalentOSException):
    """Raised when an external service is unavailable."""

    def __init__(self, service: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(
            message=f"Service temporarily unavailable: {service}",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details,
        )


def create_error_response(
    message: str,
    status_code: int,
    details: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> dict[str, Any]:
    """Create a standardized error response structure."""
    response = {
        "success": False,
        "error": {
            "message": message,
            "status_code": status_code,
        },
    }
    if details:
        response["error"]["details"] = details
    if request_id:
        response["error"]["request_id"] = request_id
    return response


def setup_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers for consistent error responses."""

    @app.exception_handler(TalentOSException)
    async def talentos_exception_handler(
        request: Request, exc: TalentOSException
    ) -> JSONResponse:
        request_id = request.headers.get("X-Request-ID", "unknown")
        logger.error(
            f"TalentOSException: {exc.message}",
            extra={"request_id": request_id, "details": exc.details},
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=create_error_response(
                message=exc.message,
                status_code=exc.status_code,
                details=exc.details,
                request_id=request_id,
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        request_id = request.headers.get("X-Request-ID", "unknown")
        logger.warning(
            f"Validation error: {exc.errors()}",
            extra={"request_id": request_id},
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=create_error_response(
                message="Request validation failed",
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                details={"validation_errors": exc.errors()},
                request_id=request_id,
            ),
        )

    @app.exception_handler(IntegrityError)
    async def integrity_exception_handler(
        request: Request, exc: IntegrityError
    ) -> JSONResponse:
        request_id = request.headers.get("X-Request-ID", "unknown")
        logger.error(f"Database integrity error: {exc}", extra={"request_id": request_id})
        message = "A data integrity violation occurred"
        if "UNIQUE constraint" in str(exc):
            message = "A record with this value already exists"
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=create_error_response(
                message=message,
                status_code=status.HTTP_409_CONFLICT,
                request_id=request_id,
            ),
        )

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(
        request: Request, exc: SQLAlchemyError
    ) -> JSONResponse:
        request_id = request.headers.get("X-Request-ID", "unknown")
        logger.error(f"Database error: {exc}", extra={"request_id": request_id})
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=create_error_response(
                message="An internal database error occurred",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=request_id,
            ),
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        request_id = request.headers.get("X-Request-ID", "unknown")
        logger.exception(
            f"Unhandled exception: {exc}",
            extra={"request_id": request_id, "path": str(request.url)},
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=create_error_response(
                message="An unexpected error occurred",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=request_id,
            ),
        )
