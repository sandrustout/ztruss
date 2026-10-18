from typing import Any, List, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.logging import request_id_ctx, logger


class AppException(Exception):
    """Base application exception producing consistent error payload."""
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[List[Any]] = None
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or []
        super().__init__(message)


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found", details: Optional[List[Any]] = None):
        super().__init__(code="NOT_FOUND", message=message, status_code=status.HTTP_404_NOT_FOUND, details=details)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Authentication required", details: Optional[List[Any]] = None):
        super().__init__(code="UNAUTHORIZED", message=message, status_code=status.HTTP_401_UNAUTHORIZED, details=details)


class ForbiddenException(AppException):
    def __init__(self, message: str = "Access forbidden", details: Optional[List[Any]] = None):
        super().__init__(code="FORBIDDEN", message=message, status_code=status.HTTP_403_FORBIDDEN, details=details)


class VersionConflictException(AppException):
    def __init__(self, message: str = "Version conflict detected. Refresh and resolve changes.", details: Optional[List[Any]] = None):
        super().__init__(code="VERSION_CONFLICT", message=message, status_code=status.HTTP_409_CONFLICT, details=details)


class ProviderException(AppException):
    def __init__(self, provider: str, message: str, details: Optional[List[Any]] = None):
        super().__init__(
            code="PROVIDER_ERROR",
            message=f"External provider error ({provider}): {message}",
            status_code=status.HTTP_502_BAD_GATEWAY,
            details=details
        )


def build_error_response(code: str, message: str, status_code: int, details: Optional[List[Any]] = None) -> JSONResponse:
    req_id = request_id_ctx.get() or "system"
    payload = {
        "error": {
            "code": code,
            "message": message,
            "details": details or []
        },
        "request_id": req_id
    }
    return JSONResponse(status_code=status_code, content=payload)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    logger.warning(f"AppException: [{exc.code}] {exc.message}")
    return build_error_response(code=exc.code, message=exc.message, status_code=exc.status_code, details=exc.details)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    details = []
    for err in exc.errors():
        details.append({
            "field": ".".join(str(loc) for loc in err.get("loc", [])),
            "message": err.get("msg", "Invalid value"),
            "type": err.get("type", "value_error")
        })
    logger.info(f"Validation error on {request.url.path}: {details}")
    return build_error_response(
        code="VALIDATION_ERROR",
        message="Request validation failed. Check parameters and payload.",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        details=details
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unhandled server error on {request.url.path}: {str(exc)}", exc_info=True)
    return build_error_response(
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected server error occurred. Please retry.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        details=[]
    )
