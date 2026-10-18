from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.providers.base import BaseProvider


class UnsplashProvider(BaseProvider):
    """Unsplash Photography API adapter with mandatory photographer attribution."""

    def __init__(self):
        super().__init__(name="unsplash", timeout_seconds=6.0)
        self.access_key = settings.UNSPLASH_KEY

    async def search_photos(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Searches high-resolution travel photography with photographer credits and URLs."""
        if not self.access_key or not query.strip():
            return []

        url = "https://api.unsplash.com/search/photos"
        params = {
            "query": f"{query.strip()} landmark travel",
            "per_page": limit,
            "orientation": "landscape"
        }
        headers = {
            "Authorization": f"Client-ID {self.access_key}",
            "Accept-Version": "v1"
        }

        data = await self.get_json(url, params=params, headers=headers)
        if not data or "results" not in data:
            return []

        photos = []
        for item in data.get("results", []):
            user = item.get("user", {})
            urls = item.get("urls", {})
            links = item.get("links", {})

            photos.append({
                "id": item.get("id"),
                "image_url": urls.get("regular") or urls.get("small"),
                "thumb_url": urls.get("thumb"),
                "width": item.get("width"),
                "height": item.get("height"),
                "author": user.get("name", "Unsplash Contributor"),
                "author_url": user.get("links", {}).get("html"),
                "licence": "Unsplash Licence",
                "attribution_text": f"Photo by {user.get('name', 'Photographer')} on Unsplash",
                "source_url": links.get("html")
            })
        return photos


unsplash = UnsplashProvider()
