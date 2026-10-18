import pytest
from httpx import AsyncClient
from datetime import date, timedelta


@pytest.mark.asyncio
async def test_search_flights_domestic(client: AsyncClient):
    """Test concurrent multi-provider flight search on domestic route."""
    dep_date = str(date.today() + timedelta(days=20))
    payload = {
        "origin_iata": "DEL",
        "destination_iata": "JAI",
        "departure_date": dep_date,
        "adults": 1,
        "cabin": "economy"
    }

    response = await client.post("/api/v1/flights/search", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "offers" in data
    assert data["total_offers"] >= 3
    assert data["cheapest_price_inr"] > 0
    assert "providers_queried" in data

    # Verify normalization of first offer
    first = data["offers"][0]
    assert "airline_name" in first
    assert "flight_number" in first
    assert "price_inr" in first
    assert "base_fare_inr" in first
    assert "taxes_inr" in first
    assert first["convenience_fee"] == 0.0
    assert first["currency"] == "INR"
    assert first["baggage_cabin_kg"] >= 7


@pytest.mark.asyncio
async def test_search_flights_rankings(client: AsyncClient):
    """Test that cheapest, fastest, and best value tags are correctly calculated."""
    dep_date = str(date.today() + timedelta(days=25))
    payload = {
        "origin_iata": "BOM",
        "destination_iata": "GOI",
        "departure_date": dep_date,
        "adults": 2,
        "cabin": "economy"
    }

    response = await client.post("/api/v1/flights/search", json=payload)
    assert response.status_code == 200
    data = response.json()

    offers = data["offers"]
    assert any(o["is_cheapest"] for o in offers)
    assert any(o["is_fastest"] for o in offers)
    assert any(o["is_best_value"] for o in offers)


@pytest.mark.asyncio
async def test_book_flight_sandbox(client: AsyncClient):
    """Test booking an offer in Duffel / carrier sandbox mode returns confirmed PNR."""
    dep_date = str(date.today() + timedelta(days=30))
    search_payload = {
        "origin_iata": "DEL",
        "destination_iata": "JAI",
        "departure_date": dep_date,
        "adults": 1,
        "cabin": "economy"
    }
    search_res = await client.post("/api/v1/flights/search", json=search_payload)
    assert search_res.status_code == 200
    offers = search_res.json()["offers"]
    selected_offer = offers[0]

    book_payload = {
        "offer_id": selected_offer["id"],
        "passengers": [
            {
                "title": "mr",
                "given_name": "Rohan",
                "family_name": "Verma",
                "born_on": "1994-11-12",
                "gender": "m",
                "email": "rohan.verma@example.com",
                "phone": "+919876543210"
            }
        ]
    }

    book_res = await client.post("/api/v1/flights/book-sandbox", json=book_payload)
    assert book_res.status_code == 201
    book_data = book_res.json()

    assert book_data["status"] == "confirmed"
    assert len(book_data["booking_reference"]) >= 5
    assert "PNR" in book_data["confirmation_message"]
    assert book_data["amount_paid_inr"] > 0
