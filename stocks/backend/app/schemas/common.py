from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str
    type: Optional[str] = None


class ErrorPayload(BaseModel):
    code: str
    message: str
    details: List[ErrorDetail] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    error: ErrorPayload
    request_id: str


class ResponseEnvelope(BaseModel, Generic[T]):
    data: T
    request_id: str = "system"


class HealthStatus(BaseModel):
    status: str
    version: str
    environment: str
    timestamp: str


class ProviderHealth(BaseModel):
    provider: str
    configured: bool
    status: str
    latency_ms: Optional[int] = None
    note: Optional[str] = None


class StatsResponse(BaseModel):
    destinations_count: int
    providers_compared: int
    trips_planned: int
