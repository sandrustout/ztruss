from typing import List, Dict, Any, Optional
from datetime import datetime, date
from app.core.config import settings
from app.providers.base import BaseProvider


class EventsProvider(BaseProvider):
    """Multi-source events and festival adapter combining Nager.Date, Calendarific, and Ticketmaster."""

    def __init__(self):
        super().__init__(name="events", timeout_seconds=8.0)
        self.calendarific_key = settings.CALENDARIFIC_KEY
        self.ticketmaster_key = settings.TICKETMASTER_KEY

    async def get_festivals(
        self,
        country_code: str = "IN",
        city: str = "",
        year: int = 2026,
        start_date_str: Optional[str] = None,
        end_date_str: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Aggregates national holidays, regional festivals, and verified local cultural events."""
        events: List[Dict[str, Any]] = []

        # 1. Query Nager.Date for national public holidays (Free open API)
        nager_url = f"https://date.nager.at/api/v3/PublicHolidays/{year}/{country_code.upper()}"
        nager_data = await self.get_json(nager_url)
        if nager_data and isinstance(nager_data, list):
            for item in nager_data:
                d_str = item.get("date")
                events.append({
                    "name": item.get("localName") or item.get("name"),
                    "type": "public_holiday",
                    "start_date": d_str,
                    "end_date": d_str,
                    "source": "nager_date",
                    "source_url": "https://date.nager.at",
                    "impact_level": "medium",
                    "closure_risk": True,
                    "description": f"National public holiday in {country_code}. Banks, offices, and select markets may operate on modified hours."
                })

        # 2. Query Calendarific if key is configured for religious and regional festivals
        if self.calendarific_key:
            cal_url = "https://calendarific.com/api/v2/holidays"
            cal_params = {
                "api_key": self.calendarific_key,
                "country": country_code.lower(),
                "year": year
            }
            cal_data = await self.get_json(cal_url, params=cal_params)
            if cal_data and "response" in cal_data and "holidays" in cal_data["response"]:
                for h in cal_data["response"]["holidays"]:
                    h_date = h.get("date", {}).get("iso")
                    if h_date:
                        # Normalize date string YYYY-MM-DD
                        clean_date = h_date[:10]
                        events.append({
                            "name": h.get("name"),
                            "type": "festival",
                            "start_date": clean_date,
                            "end_date": clean_date,
                            "source": "calendarific",
                            "source_url": "https://calendarific.com",
                            "impact_level": "high" if "Major" in h.get("type", []) else "medium",
                            "closure_risk": "National" in h.get("type", []),
                            "description": h.get("description") or f"Celebrated across {country_code}."
                        })

        # 3. Query Ticketmaster if key is configured and city is specified
        if self.ticketmaster_key and city:
            tm_url = "https://app.ticketmaster.com/discovery/v2/events.json"
            tm_params = {
                "apikey": self.ticketmaster_key,
                "city": city,
                "size": 10,
                "sort": "date,asc"
            }
            tm_data = await self.get_json(tm_url, params=tm_params)
            if tm_data and "_embedded" in tm_data and "events" in tm_data["_embedded"]:
                for e in tm_data["_embedded"]["events"]:
                    dates = e.get("dates", {}).get("start", {})
                    local_date = dates.get("localDate")
                    if local_date:
                        events.append({
                            "name": e.get("name"),
                            "type": "cultural_event",
                            "start_date": local_date,
                            "end_date": local_date,
                            "source": "ticketmaster",
                            "source_url": e.get("url"),
                            "impact_level": "medium",
                            "closure_risk": False,
                            "description": f"Live entertainment event at {e.get('_embedded', {}).get('venues', [{}])[0].get('name', 'local venue')}."
                        })

        # Filter by date range if provided
        if start_date_str and end_date_str:
            filtered = []
            for ev in events:
                if ev["start_date"] >= start_date_str and ev["start_date"] <= end_date_str:
                    filtered.append(ev)
            return filtered

        return events[:30]


events_provider = EventsProvider()
