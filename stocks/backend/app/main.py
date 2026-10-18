import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.logging import logger, request_id_ctx
from app.core.rate_limit import limiter
from app.core.errors import (
    AppException,
    app_exception_handler,
    validation_exception_handler,
    generic_exception_handler
)
from app.db.session import init_db
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context: initializes database on startup."""
    logger.info("Initializing TripWise backend services...")
    await init_db()
    yield
    logger.info("Shutting down TripWise backend services...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="TripWise REST API: Smart multi-provider travel planning engine.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# Attach SlowAPI rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Register custom and uniform error handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"]
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Assigns and propagates a unique request ID for distributed tracing and logging."""
    req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    token = request_id_ctx.set(req_id)
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response
    finally:
        request_id_ctx.reset(token)


# Mount API routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
async def root_redirect():
    """Root status greeting with direct link to OpenAPI documentation."""
    return {
        "name": settings.PROJECT_NAME,
        "status": "operational",
        "documentation": "/docs",
        "api_v1": settings.API_V1_STR
    }
