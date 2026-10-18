import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test health check returns 200 OK and expected structure."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "environment" in data


@pytest.mark.asyncio
async def test_providers_health(client: AsyncClient):
    """Test provider health endpoint returns list of monitored providers."""
    response = await client.get("/api/v1/health/providers")
    assert response.status_code == 200
    providers = response.json()
    assert isinstance(providers, list)
    assert len(providers) >= 5

    names = [p["provider"] for p in providers]
    assert "open-meteo" in names
    assert "nager-date" in names
    assert "wikipedia" in names


@pytest.mark.asyncio
async def test_system_stats(client: AsyncClient):
    """Test stats endpoint returns non-negative counters."""
    response = await client.get("/api/v1/stats")
    assert response.status_code == 200
    data = response.json()
    assert "destinations_count" in data
    assert "providers_compared" in data
    assert "trips_planned" in data
    assert data["destinations_count"] >= 0
    assert data["providers_compared"] >= 1


@pytest.mark.asyncio
async def test_request_id_middleware(client: AsyncClient):
    """Test that every response contains an X-Request-ID header."""
    response = await client.get("/api/v1/health")
    assert "x-request-id" in response.headers
    assert len(response.headers["x-request-id"]) > 0
