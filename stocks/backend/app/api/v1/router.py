from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.stats import router as stats_router
from app.api.v1.auth import router as auth_router
from app.api.v1.destinations import router as destinations_router
from app.api.v1.trips import router as trips_router
from app.api.v1.flights import router as flights_router
from app.api.v1.hotels import router as hotels_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(stats_router)
api_router.include_router(auth_router)
api_router.include_router(destinations_router)
api_router.include_router(trips_router)
api_router.include_router(flights_router)
api_router.include_router(hotels_router)
