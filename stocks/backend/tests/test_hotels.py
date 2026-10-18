import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_destination_hotels_and_seed(client: AsyncClient):
    dest_id = "d0000000-0000-0000-0000-000000000001"  # Goa
    res = await client.get(f"/api/v1/destinations/{dest_id}/hotels")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 4
    
    # Verify Bayesian TripWise Index presence and range
    first = data[0]
    assert "tripwise_index" in first
    assert 70.0 <= first["tripwise_index"] <= 100.0
    assert "location_score" in first
    assert "cleanliness_score" in first
    assert "value_score" in first
    assert "amenities_score" in first
    assert "quietness_score" in first
    assert "total_price_inr" in first
    assert len(first["amenities"]) > 0


@pytest.mark.asyncio
async def test_get_hotel_index_breakdown(client: AsyncClient):
    dest_id = "d0000000-0000-0000-0000-000000000001"
    res_list = await client.get(f"/api/v1/destinations/{dest_id}/hotels")
    hotel_id = res_list.json()[0]["id"]
    
    res = await client.get(f"/api/v1/hotels/{hotel_id}/index-breakdown")
    assert res.status_code == 200
    bd = res.json()
    assert bd["hotel_id"] == hotel_id
    assert bd["location_weight_pct"] == 30
    assert bd["cleanliness_weight_pct"] == 25
    assert bd["value_weight_pct"] == 20
    assert bd["amenities_weight_pct"] == 15
    assert bd["quietness_weight_pct"] == 10
    assert "100% Organic" in bd["anti_sponsored_slot_guarantee"]


@pytest.mark.asyncio
async def test_hotel_sorting_and_filtering(client: AsyncClient):
    dest_id = "d0000000-0000-0000-0000-000000000001"
    # Sort by price ascending
    res = await client.get(f"/api/v1/destinations/{dest_id}/hotels?sort=price_asc")
    assert res.status_code == 200
    items = res.json()
    prices = [h["total_price_inr"] for h in items]
    assert prices == sorted(prices)
