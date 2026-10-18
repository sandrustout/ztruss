import httpx
from typing import Optional, Dict, Any
from cachetools import TTLCache
from app.core.logging import logger

# In-memory TTL cache: 500 items, 15 minutes TTL per Section 3.15
provider_cache: TTLCache = TTLCache(maxsize=500, ttl=900)


class BaseProvider:
    """Base external provider adapter with resilience, timeouts, and rate-limit caching."""

    def __init__(self, name: str, timeout_seconds: float = 8.0):
        self.name = name
        self.timeout = timeout_seconds

    async def get_json(
        self,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        cache_ttl_seconds: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """Makes an asynchronous GET request with caching, timeout, and graceful failure."""
        cache_key = f"{url}:{sorted(params.items()) if params else ''}"
        if cache_key in provider_cache:
            return provider_cache[cache_key]

        req_headers = {
            "User-Agent": "TripWise/1.0 (AWS Student Builder Group Recruitment; educational travel planner)",
            **(headers or {})
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params, headers=req_headers)
                if response.status_code == 200:
                    data = response.json()
                    provider_cache[cache_key] = data
                    return data
                elif response.status_code == 429:
                    logger.warning(f"[{self.name}] Rate limit reached on {url}")
                    return None
                else:
                    logger.warning(f"[{self.name}] Request failed: status {response.status_code} for {url}")
                    return None
        except httpx.TimeoutException:
            logger.warning(f"[{self.name}] Request timed out after {self.timeout}s on {url}")
            return None
        except Exception as e:
            logger.warning(f"[{self.name}] Unexpected error on {url}: {e}")
            return None

    async def post_json(
        self,
        url: str,
        json: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Optional[Dict[str, Any]]:
        """Makes an asynchronous POST request with timeout and error handling."""
        req_headers = {
            "User-Agent": "TripWise/1.0 (AWS Student Builder Group Recruitment; educational travel planner)",
            **(headers or {})
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=json, headers=req_headers)
                if response.status_code in (200, 201):
                    return response.json()
                elif response.status_code == 429:
                    logger.warning(f"[{self.name}] Rate limit reached on {url}")
                    return None
                else:
                    logger.warning(f"[{self.name}] POST failed: status {response.status_code} for {url} - {response.text[:200]}")
                    return None
        except httpx.TimeoutException:
            logger.warning(f"[{self.name}] POST timed out after {self.timeout}s on {url}")
            return None
        except Exception as e:
            logger.warning(f"[{self.name}] Unexpected POST error on {url}: {e}")
            return None
