import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    """Test that protected route /api/v1/me returns 401 without token."""
    response = await client.get("/api/v1/me")
    assert response.status_code == 401
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert "request_id" in data


@pytest.mark.asyncio
async def test_get_my_profile_authenticated(client: AsyncClient, auth_headers: dict):
    """Test profile retrieval for authenticated user with auto-creation."""
    response = await client.get("/api/v1/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "00000000-0000-0000-0000-000000000001"
    assert data["home_airport"] == "MAA"
    assert data["currency"] == "INR"


@pytest.mark.asyncio
async def test_update_my_profile(client: AsyncClient, auth_headers: dict):
    """Test updating user preferences (theme, travel style, currency)."""
    # Ensure profile exists first
    await client.get("/api/v1/me", headers=auth_headers)

    payload = {
        "theme": "dark",
        "home_airport": "BLR",
        "travel_style": "relaxed",
        "currency": "INR"
    }
    response = await client.patch("/api/v1/me", headers=auth_headers, json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["theme"] == "dark"
    assert data["home_airport"] == "BLR"
    assert data["travel_style"] == "relaxed"


@pytest.mark.asyncio
async def test_delete_my_account(client: AsyncClient, auth_headers: dict):
    """Test account deletion removes profile."""
    # Ensure profile exists
    await client.get("/api/v1/me", headers=auth_headers)

    response = await client.delete("/api/v1/me", headers=auth_headers)
    assert response.status_code == 200
    assert "permanently removed" in response.json()["message"]
