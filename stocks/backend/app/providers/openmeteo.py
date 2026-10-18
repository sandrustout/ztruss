from typing import Dict, Any, List, Optional
from datetime import datetime
from app.providers.base import BaseProvider


# WMO Weather interpretation codes
WMO_DESCRIPTIONS = {
    0: ("Clear sky", "clear"),
    1: ("Mainly clear", "partly_cloudy"),
    2: ("Partly cloudy", "partly_cloudy"),
    3: ("Overcast", "cloudy"),
    45: ("Foggy", "fog"),
    48: ("Depositing rime fog", "fog"),
    51: ("Light drizzle", "drizzle"),
    53: ("Moderate drizzle", "drizzle"),
    55: ("Dense drizzle", "drizzle"),
    61: ("Slight rain", "rain"),
    63: ("Moderate rain", "rain"),
    65: ("Heavy rain", "rain"),
    71: ("Slight snow", "snow"),
    73: ("Moderate snow", "snow"),
    75: ("Heavy snow", "snow"),
    80: ("Rain showers", "showers"),
    81: ("Moderate showers", "showers"),
    82: ("Violent rain showers", "showers"),
    95: ("Thunderstorm", "thunderstorm"),
    96: ("Thunderstorm with hail", "thunderstorm"),
}


class OpenMeteoProvider(BaseProvider):
    """Open-Meteo weather adapter for climate statistics, packing guidance, and day forecasts."""

    def __init__(self):
        super().__init__(name="open-meteo", timeout_seconds=6.0)

    async def get_forecast(self, lat: float, lng: float, days: int = 7) -> Dict[str, Any]:
        """Fetches daily temperature ranges, precipitation likelihood, and weather conditions."""
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lng,
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode",
            "timezone": "auto",
            "forecast_days": min(days, 14)
        }
        data = await self.get_json(url, params=params)
        if not data or "daily" not in data:
            return {
                "summary": "Mild seasonal temperatures",
                "days": [],
                "packing_suggestions": ["Comfortable walking shoes", "Sunscreen and water bottle"]
            }

        daily = data["daily"]
        dates = daily.get("time", [])
        t_max = daily.get("temperature_2m_max", [])
        t_min = daily.get("temperature_2m_min", [])
        precip = daily.get("precipitation_probability_max", [])
        codes = daily.get("weathercode", [])

        forecast_days = []
        max_overall_temp = -100
        min_overall_temp = 100
        has_rain = False

        for i in range(len(dates)):
            c = codes[i] if i < len(codes) else 0
            condition_text, icon_key = WMO_DESCRIPTIONS.get(c, ("Fair", "clear"))
            max_t = t_max[i] if i < len(t_max) else 25.0
            min_t = t_min[i] if i < len(t_min) else 18.0
            prob = precip[i] if i < len(precip) else 0

            if max_t > max_overall_temp:
                max_overall_temp = max_t
            if min_t < min_overall_temp:
                min_overall_temp = min_t
            if prob > 40:
                has_rain = True

            forecast_days.append({
                "date": dates[i],
                "temp_max_c": round(max_t, 1),
                "temp_min_c": round(min_t, 1),
                "precipitation_prob": prob,
                "condition": condition_text,
                "icon": icon_key
            })

        # Generate intelligent, data-driven packing suggestions per Section 24.7
        packing = ["Breathable layers", "Comfortable footwear"]
        if max_overall_temp > 28:
            packing.extend(["Lightweight cottons", "Hat & sunglasses", "High-SPF sunscreen"])
        elif min_overall_temp < 15:
            packing.extend(["Warm jacket or fleece", "Evening shawl"])

        if has_rain:
            packing.extend(["Compact travel umbrella", "Water-resistant daypack cover"])

        return {
            "summary": f"Highs around {round(max_overall_temp)}°C, lows near {round(min_overall_temp)}°C",
            "days": forecast_days,
            "packing_suggestions": packing
        }


openmeteo = OpenMeteoProvider()
