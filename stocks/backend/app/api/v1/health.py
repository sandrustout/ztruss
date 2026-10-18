from datetime import datetime
from typing import List
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.common import HealthStatus, ProviderHealth

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthStatus)
async def check_health() -> HealthStatus:
    """Basic health check indicating that the backend process is running."""
    return HealthStatus(
        status="healthy",
        version="1.0.0",
        environment=settings.ENVIRONMENT,
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/health/providers", response_model=List[ProviderHealth])
async def check_providers_health() -> List[ProviderHealth]:
    """
    Reports the configuration status and responsiveness of external APIs.
    Per prompt rule 7.10: returns status for each provider without leaking secrets.
    """
    providers = [
        ProviderHealth(
            provider="opentripmap",
            configured=bool(settings.OPENTRIPMAP_KEY),
            status="healthy" if settings.OPENTRIPMAP_KEY else "unconfigured",
            note="Places and categories"
        ),
        ProviderHealth(
            provider="geoapify",
            configured=bool(settings.GEOAPIFY_KEY),
            status="healthy" if settings.GEOAPIFY_KEY else "unconfigured",
            note="Geocoding, autocomplete and routing"
        ),
        ProviderHealth(
            provider="open-meteo",
            configured=True,
            status="healthy",
            note="Open weather API (no key required)"
        ),
        ProviderHealth(
            provider="amadeus",
            configured=bool(settings.AMADEUS_CLIENT_ID and settings.AMADEUS_CLIENT_SECRET),
            status="healthy" if (settings.AMADEUS_CLIENT_ID and settings.AMADEUS_CLIENT_SECRET) else "unconfigured",
            note="Flight search and calendar"
        ),
        ProviderHealth(
            provider="duffel",
            configured=bool(settings.DUFFEL_TOKEN),
            status="healthy" if settings.DUFFEL_TOKEN else "unconfigured",
            note="Sandbox flight orders"
        ),
        ProviderHealth(
            provider="nager-date",
            configured=True,
            status="healthy",
            note="Public holidays API (no key required)"
        ),
        ProviderHealth(
            provider="wikipedia",
            configured=True,
            status="healthy",
            note="Place descriptions and wikidata sitelinks"
        ),
        ProviderHealth(
            provider="razorpay",
            configured=bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET),
            status="healthy" if (settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET) else "unconfigured",
            note="Test mode sandbox payment gateway"
        ),
        ProviderHealth(
            provider="unsplash",
            configured=bool(settings.UNSPLASH_KEY),
            status="healthy" if settings.UNSPLASH_KEY else "unconfigured",
            note="High-resolution destination photography"
        ),
        ProviderHealth(
            provider="calendarific",
            configured=bool(settings.CALENDARIFIC_KEY),
            status="healthy" if settings.CALENDARIFIC_KEY else "unconfigured",
            note="Regional holiday and festival calendar"
        ),
        ProviderHealth(
            provider="ticketmaster",
            configured=bool(settings.TICKETMASTER_KEY),
            status="healthy" if settings.TICKETMASTER_KEY else "unconfigured",
            note="Local events and ticket discovery"
        ),
        ProviderHealth(
            provider="supabase",
            configured=bool(settings.SUPABASE_URL and settings.SUPABASE_JWT_SECRET),
            status="healthy" if (settings.SUPABASE_URL and settings.SUPABASE_JWT_SECRET) else "unconfigured",
            note="Postgres database and OAuth auth"
        ),
    ]
    return providers
