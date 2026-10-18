import pytest
from httpx import AsyncClient
from app.models.destination import Destination
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_search_airports(client: AsyncClient):
    """Test searching airports returns matching IATA codes and coordinates."""
    response = await client.get("/api/v1/airports/search?q=chennai")
    assert response.status_code == 200
    airports = response.json()
    assert isinstance(airports, list)
    assert len(airports) >= 1
    assert airports[0]["iata"] == "MAA"


@pytest.mark.asyncio
async def test_search_destinations(client: AsyncClient):
    """Test searching destinations returns list of destinations."""
    async with TestSessionLocal() as session:
        dest = Destination(
            id="test-dest-001",
            name="Jaipur",
            country="India",
            region="Rajasthan",
            lat=26.9124,
            lng=75.7873,
            iata_codes=["JAI"],
            description="The Pink City"
        )
        session.add(dest)
        await session.commit()

    response = await client.get("/api/v1/destinations/search?q=Jaipur")
    assert response.status_code == 200
    results = response.json()
    assert len(results) >= 1
    assert results[0]["name"] == "Jaipur"


@pytest.mark.asyncio
async def test_get_destination_details(client: AsyncClient):
    """Test retrieving destination details by ID."""
    async with TestSessionLocal() as session:
        dest = Destination(
            id="test-dest-002",
            name="Goa",
            country="India",
            region="Western Coast",
            lat=15.2993,
            lng=74.1240,
            iata_codes=["GOI"],
            description="Coastal state celebrated for beaches"
        )
        session.add(dest)
        await session.commit()

    response = await client.get("/api/v1/destinations/test-dest-002")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Goa"
    assert data["lat"] == 15.2993


@pytest.mark.asyncio
async def test_destination_not_found(client: AsyncClient):
    """Test requesting a non-existent destination ID returns 404."""
    response = await client.get("/api/v1/destinations/non-existent-uuid")
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "NOT_FOUND"
