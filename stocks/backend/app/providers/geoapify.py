from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.providers.base import BaseProvider


class GeoapifyProvider(BaseProvider):
    """Geoapify adapter for geocoding, autocomplete, places and transit routing."""

    def __init__(self):
        super().__init__(name="geoapify", timeout_seconds=8.0)
        self.api_key = settings.GEOAPIFY_KEY

    async def geocode(self, query: str) -> List[Dict[str, Any]]:
        """Geocode query text into lat, lng, city, country, and bounding box."""
        if not self.api_key or not query.strip():
            return []

        url = "https://api.geoapify.com/v1/geocode/search"
        params = {
            "text": query.strip(),
            "apiKey": self.api_key,
            "limit": 5,
            "format": "json"
        }
        data = await self.get_json(url, params=params)
        if not data or "results" not in data:
            return []

        results = []
        for item in data.get("results", []):
            results.append({
                "name": item.get("city") or item.get("name") or item.get("formatted"),
                "country": item.get("country", ""),
                "region": item.get("state") or item.get("county"),
                "lat": item.get("lat"),
                "lng": item.get("lon"),
                "formatted": item.get("formatted", ""),
                "place_id": item.get("place_id")
            })
        return results

    async def places(
        self,
        lat: float,
        lng: float,
        categories: str = "tourism.sights,entertainment.museum,heritage",
        radius_meters: int = 15000,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Queries tourist sights, monuments, and amenities around geographic coordinates."""
        if not self.api_key:
            return []

        url = "https://api.geoapify.com/v2/places"
        params = {
            "categories": categories,
            "filter": f"circle:{lng},{lat},{radius_meters}",
            "bias": f"proximity:{lng},{lat}",
            "limit": limit,
            "apiKey": self.api_key
        }
        data = await self.get_json(url, params=params)
        if not data or "features" not in data:
            return []

        places = []
        for feat in data.get("features", []):
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates", [lng, lat])

            name = props.get("name")
            if not name:
                continue

            cats = props.get("categories", [])
            primary_cat = "monument"
            if any("museum" in c for c in cats):
                primary_cat = "museum"
            elif any("place_of_worship" in c or "temple" in c for c in cats):
                primary_cat = "temple"
            elif any("natural" in c or "beach" in c for c in cats):
                primary_cat = "nature"
            elif any("catering" in c or "restaurant" in c for c in cats):
                primary_cat = "restaurant"

            places.append({
                "external_id": props.get("place_id"),
                "source": "geoapify",
                "name": name,
                "category": primary_cat,
                "lat": coords[1],
                "lng": coords[0],
                "address": props.get("formatted", ""),
                "rating": 4.2,  # Default signal when rate count is absent
                "rate_score": 2.0,
                "description": props.get("description") or f"{name} is an attraction in {props.get('city', 'the region')}.",
                "hours_json": props.get("opening_hours")
            })
        return places

    async def route_travel_time(
        self,
        from_lat: float,
        from_lng: float,
        to_lat: float,
        to_lng: float,
        mode: str = "drive"
    ) -> Dict[str, Any]:
        """Calculates transit distance in km and duration in minutes between two waypoints."""
        if not self.api_key:
            # Fallback haversine estimation when key absent
            import math
            R = 6371.0
            dlat = math.radians(to_lat - from_lat)
            dlng = math.radians(to_lng - from_lng)
            a = math.sin(dlat / 2)**2 + math.cos(math.radians(from_lat)) * math.cos(math.radians(to_lat)) * math.sin(dlng / 2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            dist_km = R * c
            # Assume 30 km/h average city driving speed
            minutes = max(5, int((dist_km / 30.0) * 60))
            return {
                "distance_km": round(dist_km, 2),
                "duration_minutes": minutes,
                "source": "estimate"
            }

        url = "https://api.geoapify.com/v1/routing"
        params = {
            "waypoints": f"{from_lat},{from_lng}|{to_lat},{to_lng}",
            "mode": mode,
            "apiKey": self.api_key
        }
        data = await self.get_json(url, params=params)
        if not data or "features" not in data or not data["features"]:
            return {"distance_km": 5.0, "duration_minutes": 15, "source": "estimate"}

        props = data["features"][0].get("properties", {})
        dist_m = props.get("distance", 5000)
        time_s = props.get("time", 900)

        return {
            "distance_km": round(dist_m / 1000.0, 2),
            "duration_minutes": max(1, int(time_s / 60.0)),
            "source": "live"
        }


geoapify = GeoapifyProvider()
