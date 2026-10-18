import urllib.parse
from typing import Dict, Any, Optional
from app.providers.base import BaseProvider


class WikipediaProvider(BaseProvider):
    """Wikipedia / Wikidata REST adapter for monument summaries and licensed imagery."""

    def __init__(self):
        super().__init__(name="wikipedia", timeout_seconds=6.0)

    async def get_summary(self, title: str) -> Optional[Dict[str, Any]]:
        """Retrieves page extract, thumbnail image, and canonical URL from Wikipedia REST API."""
        if not title:
            return None

        # Clean title for REST URL
        clean_title = urllib.parse.quote(title.strip().replace(" ", "_"))
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{clean_title}"

        data = await self.get_json(url)
        if not data or data.get("type") == "https://mediawiki.org/wiki/HyperSwitch/errors/not_found":
            return None

        image_url = None
        if "thumbnail" in data:
            image_url = data["thumbnail"].get("source")
        elif "originalimage" in data:
            image_url = data["originalimage"].get("source")

        return {
            "title": data.get("title"),
            "extract": data.get("extract"),
            "image_url": image_url,
            "page_url": data.get("content_urls", {}).get("desktop", {}).get("page"),
            "attribution": "Summary text and media provided under CC BY-SA 4.0 via Wikipedia"
        }


wikipedia = WikipediaProvider()
