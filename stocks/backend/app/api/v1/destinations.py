from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.core.errors import NotFoundException
from app.models.destination import Destination
from app.schemas.destination import (
    AirportInfo,
    DestinationResponse,
    PlaceResponse,
    WeatherResponse,
    EventResponse,
    DishResponse
)
from app.services.discovery import (
    search_airports,
    search_destinations,
    get_destination_places,
    get_destination_weather,
    get_destination_events,
    get_destination_food
)

router = APIRouter(tags=["Destinations & Discovery"])


@router.get("/airports/search", response_model=List[AirportInfo])
async def search_airports_endpoint(
    q: str = Query("", description="IATA code, city, or airport name")
) -> List[AirportInfo]:
    """Returns matching domestic and international airports for autocomplete."""
    return search_airports(q)


@router.get("/destinations/search", response_model=List[DestinationResponse])
async def search_destinations_endpoint(
    q: str = Query("", description="City or destination query"),
    db: AsyncSession = Depends(get_db)
) -> List[DestinationResponse]:
    """Searches destination database and dynamically discovers new locations via Geoapify."""
    return await search_destinations(q, db)


@router.get("/destinations/{id}", response_model=DestinationResponse)
async def get_destination_details_endpoint(
    id: str = Path(..., description="Destination UUID"),
    db: AsyncSession = Depends(get_db)
) -> DestinationResponse:
    """Returns details, coordinates, timezone, and facts for a specific destination."""
    stmt = select(Destination).where(Destination.id == id)
    res = await db.execute(stmt)
    dest = res.scalar_one_or_none()
    if not dest:
        id_clean = id.strip()
        id_upper = id_clean.upper()
        all_dests_res = await db.execute(select(Destination))
        all_dests = all_dests_res.scalars().all()
        dest = next(
            (d for d in all_dests if id_upper in (d.iata_codes or []) or id_clean.lower() == d.name.lower() or id_clean.lower() in d.name.lower() or d.name.lower() in id_clean.lower()),
            None
        )
    if not dest:
        raise NotFoundException(f"Destination with ID '{id}' was not found.")
    return DestinationResponse.model_validate(dest)


@router.get("/destinations/{id}/places", response_model=List[PlaceResponse])
async def get_places_endpoint(
    id: str = Path(..., description="Destination UUID"),
    category: Optional[str] = Query(None, description="Category filter (monument, museum, temple, nature, etc.)"),
    sort: str = Query("rank", description="Sort order: rank, rating, or duration"),
    min_rating: float = Query(0.0, description="Minimum rating filter"),
    limit: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
) -> List[PlaceResponse]:
    """
    Returns attractions, monuments, and points of interest.
    Integrates OpenTripMap, Geoapify, and Wikipedia extracts with transparent 'Why recommended' signals.
    """
    return await get_destination_places(
        destination_id=id,
        db=db,
        category=category,
        sort=sort,
        min_rating=min_rating,
        limit=limit
    )


@router.get("/destinations/{id}/weather", response_model=WeatherResponse)
async def get_weather_endpoint(
    id: str = Path(..., description="Destination UUID"),
    db: AsyncSession = Depends(get_db)
) -> WeatherResponse:
    """Returns Open-Meteo 7-day temperature trends and automated packing checklist."""
    return await get_destination_weather(destination_id=id, db=db)


@router.get("/destinations/{id}/events", response_model=List[EventResponse])
async def get_events_endpoint(
    id: str = Path(..., description="Destination UUID"),
    from_date: Optional[str] = Query(None, alias="from", description="Departure date YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, alias="to", description="Return date YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db)
) -> List[EventResponse]:
    """Returns national public holidays and regional festivals with crowd and closure impact risk."""
    return await get_destination_events(
        destination_id=id,
        db=db,
        from_date=from_date,
        to_date=to_date
    )


@router.get("/destinations/{id}/food", response_model=List[DishResponse])
async def get_food_endpoint(
    id: str = Path(..., description="Destination UUID"),
    db: AsyncSession = Depends(get_db)
) -> List[DishResponse]:
    """Returns editorial culinary specialties and must-try regional dishes."""
    return await get_destination_food(destination_id=id, db=db)
