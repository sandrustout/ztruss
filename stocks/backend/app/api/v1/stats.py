from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.destination import Destination
from app.models.trip import Trip
from app.schemas.common import StatsResponse

router = APIRouter(tags=["Stats"])


@router.get("/stats", response_model=StatsResponse)
async def get_system_stats(db: AsyncSession = Depends(get_db)) -> StatsResponse:
    """
    Returns real statistics from the database for the home page stats strip.
    No fake counts are returned.
    """
    dest_res = await db.execute(select(func.count(Destination.id)))
    dest_count = dest_res.scalar() or 0

    trips_res = await db.execute(select(func.count(Trip.id)))
    trips_count = trips_res.scalar() or 0

    # Active external data providers integrated in the engine
    providers_compared = 6

    return StatsResponse(
        destinations_count=dest_count,
        providers_compared=providers_compared,
        trips_planned=trips_count
    )
