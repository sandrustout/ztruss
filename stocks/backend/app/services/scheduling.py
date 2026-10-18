from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from app.models.trip_item import TripItem
from app.models.place import Place
from app.providers.geoapify import geoapify


def time_to_minutes(t_str: str) -> int:
    """Converts 'HH:MM' string to minutes from midnight."""
    parts = t_str.split(":")
    return int(parts[0]) * 60 + int(parts[1])


def minutes_to_time(m: int) -> str:
    """Converts minutes from midnight to 'HH:MM' string."""
    m = m % (24 * 60)
    hh = m // 60
    mm = m % 60
    return f"{hh:02d}:{mm:02d}"


def is_peak_hour(minutes: int) -> bool:
    """Checks if the hour falls into urban peak traffic bands (8-11am, 5-9pm)."""
    hh = minutes // 60
    return (8 <= hh <= 11) or (17 <= hh <= 21)


async def schedule_day(
    items: List[TripItem],
    place_coords: Dict[str, Tuple[float, float]],
    preferred_start_time: str = "09:00",
    cab_pickup_buffer_mins: int = 10
) -> Tuple[List[TripItem], Dict[str, Any]]:
    """
    Computes realistic arrival, stay, transit, and departure times for a sequence of stops.
    Applies transit buffers, peak hour congestion factors, and active day duration warnings.
    """
    if not items:
        return [], {"total_travel_minutes": 0, "total_stay_minutes": 0, "warnings": []}

    # Sort strictly by order_index
    sorted_items = sorted(items, key=lambda x: x.order_index)

    current_clock = time_to_minutes(preferred_start_time)
    start_of_day = current_clock
    total_travel_mins = 0
    total_stay_mins = 0
    warnings: List[str] = []

    prev_coords: Tuple[float, float] = (0.0, 0.0)

    for i, item in enumerate(sorted_items):
        coords = place_coords.get(item.ref_id or "", (0.0, 0.0))

        if i == 0:
            # First item of the day
            item.travel_minutes_from_prev = 0
            item.travel_source = "estimate"
        else:
            # Transit from previous stop
            travel_mins = 15
            travel_source = "estimate"

            if prev_coords != (0.0, 0.0) and coords != (0.0, 0.0):
                # Call Geoapify live routing
                route = await geoapify.route_travel_time(
                    from_lat=prev_coords[0],
                    from_lng=prev_coords[1],
                    to_lat=coords[0],
                    to_lng=coords[1],
                    mode="drive" if item.travel_mode in ("cab", "drive") else item.travel_mode
                )
                travel_mins = route.get("duration_minutes", 15)
                travel_source = route.get("source", "estimate")

            # Add parking/pickup delay buffer (Section 13.5)
            if item.travel_mode in ("cab", "drive"):
                travel_mins += cab_pickup_buffer_mins

            # Apply peak-hour congestion multiplier (25% increase)
            if is_peak_hour(current_clock):
                travel_mins = int(travel_mins * 1.25)
                warnings.append(f"Transit to '{item.title}' passes through peak traffic hour.")

            item.travel_minutes_from_prev = travel_mins
            item.travel_source = travel_source
            current_clock += travel_mins
            total_travel_mins += travel_mins

        # Set arrival and departure for this stop
        item.start_time = minutes_to_time(current_clock)
        current_clock += item.duration_minutes
        item.end_time = minutes_to_time(current_clock)
        total_stay_mins += item.duration_minutes

        prev_coords = coords

    # Active day duration check (comfort cap: 10 hours active per Section 13.5)
    active_span_minutes = current_clock - start_of_day
    if active_span_minutes > 600:
        over = round((active_span_minutes - 600) / 60.0, 1)
        warnings.append(f"Active day duration ({round(active_span_minutes / 60.0, 1)} hrs) exceeds comfortable 10-hour cap by {over} hours.")

    meta = {
        "total_travel_minutes": total_travel_mins,
        "total_stay_minutes": total_stay_mins,
        "active_duration_minutes": active_span_minutes,
        "warnings": list(set(warnings))
    }
    return sorted_items, meta
