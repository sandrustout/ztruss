from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.hotel import HotelResponse, HotelIndexBreakdown
from app.services.hotels import (
    get_or_seed_hotels_for_destination,
    get_hotel_index_breakdown
)
from sqlalchemy import select
from app.models.hotel import Hotel

router = APIRouter(tags=["Stays & TripWise Hotel Index"])


@router.get("/destinations/{destination_id}/hotels", response_model=List[HotelResponse])
async def get_destination_hotels_endpoint(
    destination_id: str,
    sort: str = Query("index", pattern="^(index|price_asc|price_desc|rating)$"),
    min_index: float = Query(0.0, ge=0.0, le=100.0),
    max_price: Optional[float] = Query(None, ge=0.0),
    db: AsyncSession = Depends(get_db)
) -> List[HotelResponse]:
    """
    Returns verified stays ranked by the transparent Bayesian TripWise Accommodation Index.
    Anti-sponsored slot guarantee: 100% organic ranking with zero bid promotions.
    """
    return await get_or_seed_hotels_for_destination(
        db=db,
        destination_id=destination_id,
        sort=sort,
        min_index=min_index,
        max_price=max_price
    )


@router.get("/hotels/{hotel_id}", response_model=HotelResponse)
async def get_hotel_endpoint(
    hotel_id: str,
    db: AsyncSession = Depends(get_db)
) -> HotelResponse:
    """Retrieves stay details for a specific hotel."""
    res = await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    h = res.scalar_one_or_none()
    if not h:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hotel with ID '{hotel_id}' not found."
        )

    return HotelResponse(
        id=h.id,
        destination_id=h.destination_id,
        name=h.name,
        category=h.category,
        lat=h.lat,
        lng=h.lng,
        address=h.address,
        distance_to_airport_km=h.distance_to_airport_km,
        distance_to_center_km=h.distance_to_center_km,
        nearest_attraction_name=h.nearest_attraction_name,
        nearest_attraction_distance_km=h.nearest_attraction_distance_km,
        star_rating=h.star_rating,
        price_per_night_inr=h.price_per_night_inr,
        taxes_and_fees_inr=h.taxes_and_fees_inr,
        total_price_inr=round(h.price_per_night_inr + h.taxes_and_fees_inr, 2),
        location_score=h.location_score,
        cleanliness_score=h.cleanliness_score,
        value_score=h.value_score,
        amenities_score=h.amenities_score,
        quietness_score=h.quietness_score,
        tripwise_index=h.tripwise_index,
        review_count=h.review_count,
        amenities=h.amenities or [],
        image_url=h.image_url,
        image_author=h.image_author,
        image_attribution=h.image_attribution
    )


@router.get("/hotels/{hotel_id}/index-breakdown", response_model=HotelIndexBreakdown)
async def get_hotel_index_breakdown_endpoint(
    hotel_id: str,
    db: AsyncSession = Depends(get_db)
) -> HotelIndexBreakdown:
    """
    Returns mathematical transparency for the TripWise Hotel Index score,
    revealing component weights (Location 30%, Cleanliness 25%, Value 20%, Amenities 15%, Quietness 10%)
    and Bayesian shrinkage parameters.
    """
    breakdown = await get_hotel_index_breakdown(db=db, hotel_id=hotel_id)
    if not breakdown:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hotel with ID '{hotel_id}' not found."
        )
    return breakdown
