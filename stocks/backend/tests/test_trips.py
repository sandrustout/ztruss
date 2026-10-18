import pytest
from httpx import AsyncClient
from datetime import date, timedelta
from tests.conftest import TestSessionLocal
from app.models.destination import Destination


@pytest.mark.asyncio
async def test_create_trip(client: AsyncClient, auth_headers: dict):
    """Test creating a new trip."""
    # Seed destination
    async with TestSessionLocal() as session:
        dest = Destination(
            id="dest-jaipur",
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

    payload = {
        "title": "Jaipur Heritage Tour",
        "destination_id": "dest-jaipur",
        "origin_iata": "DEL",
        "start_date": str(date.today() + timedelta(days=10)),
        "end_date": str(date.today() + timedelta(days=13)),
        "trip_type": "holiday",
        "budget": 25000.0,
        "currency": "INR",
        "travellers_json": {"adults": 2, "children": 0, "infants": 0}
    }

    response = await client.post("/api/v1/trips", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Jaipur Heritage Tour"
    assert data["destination_id"] == "dest-jaipur"
    assert data["version"] == 1
    assert data["budget"] == 25000.0


@pytest.mark.asyncio
async def test_get_trips_list(client: AsyncClient, auth_headers: dict):
    """Test listing trips for authenticated user."""
    payload = {
        "title": "Weekend in Goa",
        "destination_id": "dest-goa-001",
        "origin_iata": "BOM",
        "start_date": str(date.today() + timedelta(days=5)),
        "end_date": str(date.today() + timedelta(days=7)),
        "trip_type": "vacation",
        "currency": "INR"
    }
    create_res = await client.post("/api/v1/trips", json=payload, headers=auth_headers)
    assert create_res.status_code == 201

    response = await client.get("/api/v1/trips", headers=auth_headers)
    assert response.status_code == 200
    trips = response.json()
    assert len(trips) >= 1
    assert any(t["title"] == "Weekend in Goa" for t in trips)


@pytest.mark.asyncio
async def test_trip_crud_and_items(client: AsyncClient, auth_headers: dict):
    """Test trip retrieval, updating, adding items, reordering, and deleting."""
    # 1. Create trip
    payload = {
        "title": "Kerala Exploration",
        "destination_id": "dest-kochi-001",
        "origin_iata": "MAA",
        "start_date": str(date.today() + timedelta(days=15)),
        "end_date": str(date.today() + timedelta(days=18)),
        "trip_type": "holiday",
        "currency": "INR"
    }
    create_res = await client.post("/api/v1/trips", json=payload, headers=auth_headers)
    assert create_res.status_code == 201
    trip = create_res.json()
    trip_id = trip["id"]

    # 2. Get single trip
    get_res = await client.get(f"/api/v1/trips/{trip_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Kerala Exploration"

    # 3. Add Item 1 to Day 0
    item1_payload = {
        "type": "place",
        "day_index": 0,
        "order_index": 0,
        "title": "Fort Kochi Heritage Walk",
        "cost_estimate": 500.0,
        "duration_minutes": 120,
        "start_time": "09:00",
        "end_time": "11:00",
        "travel_mode": "cab"
    }
    item1_res = await client.post(f"/api/v1/trips/{trip_id}/items", json=item1_payload, headers=auth_headers)
    assert item1_res.status_code == 201
    item1 = item1_res.json()
    assert item1["title"] == "Fort Kochi Heritage Walk"
    assert item1["day_index"] == 0

    # 4. Add Item 2 to Day 0
    item2_payload = {
        "type": "place",
        "day_index": 0,
        "order_index": 1,
        "title": "Mattancherry Palace",
        "cost_estimate": 300.0,
        "duration_minutes": 90,
        "start_time": "11:30",
        "end_time": "13:00",
        "travel_mode": "cab"
    }
    item2_res = await client.post(f"/api/v1/trips/{trip_id}/items", json=item2_payload, headers=auth_headers)
    assert item2_res.status_code == 201
    item2 = item2_res.json()

    # 5. Check updated trip has 2 items
    trip_res = await client.get(f"/api/v1/trips/{trip_id}", headers=auth_headers)
    trip_data = trip_res.json()
    assert len(trip_data["items"]) == 2

    # 6. Reorder items (swap order)
    reorder_payload = {
        "items": [
            {"id": item2["id"], "day_index": 0, "order_index": 0},
            {"id": item1["id"], "day_index": 0, "order_index": 1}
        ]
    }
    reorder_res = await client.post(f"/api/v1/trips/{trip_id}/items/reorder", json=reorder_payload, headers=auth_headers)
    assert reorder_res.status_code == 200
    reordered_items = reorder_res.json()
    assert reordered_items[0]["id"] == item2["id"]
    assert reordered_items[1]["id"] == item1["id"]

    # 7. Schedule Day 0 timing
    schedule_payload = {
        "day_index": 0,
        "preferred_start_time": "09:30"
    }
    sched_res = await client.post(f"/api/v1/trips/{trip_id}/schedule", json=schedule_payload, headers=auth_headers)
    assert sched_res.status_code == 200
    sched_items = sched_res.json()
    assert len(sched_items) == 2
    assert sched_items[0]["start_time"] == "09:30"

    # 8. Optimise Day 0 stops
    optimise_payload = {
        "day_index": 0
    }
    opt_res = await client.post(f"/api/v1/trips/{trip_id}/optimise-day", json=optimise_payload, headers=auth_headers)
    assert opt_res.status_code == 200
    opt_data = opt_res.json()
    assert "saved_minutes" in opt_data
    assert len(opt_data["items"]) == 2

    # 9. Delete Item 1
    del_item_res = await client.delete(f"/api/v1/trips/{trip_id}/items/{item1['id']}", headers=auth_headers)
    assert del_item_res.status_code == 200

    # Verify item deleted
    trip_after_del = await client.get(f"/api/v1/trips/{trip_id}", headers=auth_headers)
    assert len(trip_after_del.json()["items"]) == 1

    # 10. Delete Trip
    del_trip_res = await client.delete(f"/api/v1/trips/{trip_id}", headers=auth_headers)
    assert del_trip_res.status_code == 200

    # Verify trip not found
    get_del = await client.get(f"/api/v1/trips/{trip_id}", headers=auth_headers)
    assert get_del.status_code == 404
