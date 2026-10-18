from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.providers.base import BaseProvider


class OpenTripMapProvider(BaseProvider):
    """OpenTripMap adapter for cultural landmarks, historic monuments, and ratings."""

    def __init__(self):
        super().__init__(name="opentripmap", timeout_seconds=8.0)
        self.api_key = settings.OPENTRIPMAP_KEY

    async def places_by_radius(
        self,
        lat: float,
        lng: float,
        radius_meters: int = 15000,
        kinds: str = "interesting_places,historic,cultural,architecture,natural",
        rate: int = 2,
        limit: int = 25
    ) -> List[Dict[str, Any]]:
        """Queries tourist sights filtered by popularity rate (1 to 3)."""
        if not self.api_key:
            return []

        url = "https://api.opentripmap.com/0.1/en/places/radius"
        params = {
            "radius": radius_meters,
            "lon": lng,
            "lat": lat,
            "kinds": kinds,
            "rate": rate,
            "format": "json",
            "limit": limit,
            "apikey": self.api_key
        }
        data = await self.get_json(url, params=params)
        if not data or not isinstance(data, list):
            return []

        items = []
        for p in data:
            name = p.get("name")
            if not name:
                continue

            point = p.get("point", {})
            kinds_str = p.get("kinds", "")

            # Normalize category
            category = "monument"
            if "museum" in kinds_str:
                category = "museum"
            elif "religion" in kinds_str or "temple" in kinds_str or "church" in kinds_str:
                category = "temple"
            elif "natural" in kinds_str or "beach" in kinds_str:
                category = "nature"
            elif "viewpoint" in kinds_str:
                category = "viewpoint"

            rate_score = float(p.get("rate", 1))

            items.append({
                "external_id": p.get("xid"),
                "source": "opentripmap",
                "name": name,
                "category": category,
                "lat": point.get("lat", lat),
                "lng": point.get("lon", lng),
                "rate_score": rate_score,
                "rating": round(3.5 + (rate_score * 0.5), 1),
                "wiki_title": p.get("wikipedia") or name,
                "distance_m": p.get("dist", 0)
            })
        return items

    async def get_place_details(self, xid: str) -> Optional[Dict[str, Any]]:
        """Retrieves detailed descriptions, hours, and wiki extract for an attraction."""
        if not self.api_key or not xid:
            return None

        url = f"https://api.opentripmap.com/0.1/en/places/xid/{xid}"
        params = {"apikey": self.api_key}
        data = await self.get_json(url, params=params)
        if not data:
            return None

        info = data.get("wikipedia_extracts", {})
        description = info.get("text") or data.get("info", {}).get("descr")

        image_url = None
        preview = data.get("preview", {})
        if preview and preview.get("source"):
            image_url = preview.get("source")

        return {
            "external_id": xid,
            "name": data.get("name"),
            "description": description,
            "wiki_url": data.get("wikipedia"),
            "image_url": image_url,
            "address": data.get("address", {})
        }


opentripmap = OpenTripMapProvider()
