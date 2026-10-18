from fastapi import APIRouter, Depends, status
from app.schemas.flight import (
    FlightSearchRequest,
    FlightSearchResponse,
    FlightBookingRequest,
    FlightBookingResponse
)
from app.services.aviation import (
    search_multi_provider_flights,
    book_sandbox_flight
)

router = APIRouter(prefix="/flights", tags=["Aviation & Flight Comparison"])


@router.post("/search", response_model=FlightSearchResponse)
async def search_flights_endpoint(req: FlightSearchRequest) -> FlightSearchResponse:
    """
    Concurrent multi-provider aviation search querying Duffel sandbox and Amadeus engine.
    Calculates transparent price breakdowns, savings vs highest fare, and best value scores.
    """
    return await search_multi_provider_flights(req)


@router.post("/book-sandbox", response_model=FlightBookingResponse, status_code=status.HTTP_201_CREATED)
async def book_sandbox_endpoint(req: FlightBookingRequest) -> FlightBookingResponse:
    """
    Creates a real test order on Duffel sandbox or generated carrier PNR.
    Returns guaranteed booking reference (PNR) and electronic ticket documents.
    """
    return await book_sandbox_flight(req)
