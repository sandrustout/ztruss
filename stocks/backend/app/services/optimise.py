import math
from typing import List, Tuple, Dict
from app.models.trip_item import TripItem


def haversine_distance(c1: Tuple[float, float], c2: Tuple[float, float]) -> float:
    """Computes great-circle distance in kilometers between two lat/lng coordinates."""
    if c1 == (0.0, 0.0) or c2 == (0.0, 0.0):
        return 5.0
    R = 6371.0
    dlat = math.radians(c2[0] - c1[0])
    dlng = math.radians(c2[1] - c1[1])
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(c1[0])) * math.cos(math.radians(c2[0])) * math.sin(dlng / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def total_route_distance(route: List[TripItem], coords_map: Dict[str, Tuple[float, float]]) -> float:
    """Calculates total transit route distance in km for an ordered sequence of stops."""
    dist = 0.0
    for i in range(len(route) - 1):
        c1 = coords_map.get(route[i].ref_id or "", (0.0, 0.0))
        c2 = coords_map.get(route[i + 1].ref_id or "", (0.0, 0.0))
        dist += haversine_distance(c1, c2)
    return dist


def nearest_neighbour_heuristic(items: List[TripItem], coords_map: Dict[str, Tuple[float, float]]) -> List[TripItem]:
    """Nearest-neighbour tour construction algorithm."""
    if len(items) <= 2:
        return list(items)

    unvisited = list(items[1:])
    current = items[0]
    route = [current]

    while unvisited:
        c_curr = coords_map.get(current.ref_id or "", (0.0, 0.0))
        nearest = min(
            unvisited,
            key=lambda x: haversine_distance(c_curr, coords_map.get(x.ref_id or "", (0.0, 0.0)))
        )
        unvisited.remove(nearest)
        route.append(nearest)
        current = nearest

    return route


def two_opt_improvement(route: List[TripItem], coords_map: Dict[str, Tuple[float, float]]) -> List[TripItem]:
    """2-opt pairwise exchange heuristic to eliminate route crossings."""
    n = len(route)
    if n <= 3:
        return route

    best_route = list(route)
    best_dist = total_route_distance(best_route, coords_map)
    improved = True

    iterations = 0
    while improved and iterations < 50:
        improved = False
        iterations += 1
        for i in range(1, n - 1):
            for k in range(i + 1, n):
                # Don't swap locked stops
                if best_route[i].locked or best_route[k].locked:
                    continue

                # 2-opt reversal of segment [i:k+1]
                new_route = best_route[:i] + best_route[i:k + 1][::-1] + best_route[k + 1:]
                new_dist = total_route_distance(new_route, coords_map)

                if new_dist < best_dist - 0.1:  # Significant improvement threshold
                    best_route = new_route
                    best_dist = new_dist
                    improved = True
                    break
            if improved:
                break

    return best_route


def optimise_day_stops(
    items: List[TripItem],
    coords_map: Dict[str, Tuple[float, float]]
) -> Tuple[List[TripItem], int, int]:
    """
    Applies Nearest-Neighbour followed by 2-Opt optimization.
    Returns: (reordered_items, before_travel_minutes, after_travel_minutes)
    """
    if len(items) <= 2:
        total_time = sum(item.travel_minutes_from_prev for item in items)
        return items, total_time, total_time

    before_dist = total_route_distance(items, coords_map)
    before_mins = max(10, int((before_dist / 30.0) * 60))

    # 1. Nearest Neighbour
    nn_route = nearest_neighbour_heuristic(items, coords_map)

    # 2. 2-Opt Improvement
    final_route = two_opt_improvement(nn_route, coords_map)

    after_dist = total_route_distance(final_route, coords_map)
    after_mins = max(5, int((after_dist / 30.0) * 60))

    # Update order indices
    for idx, item in enumerate(final_route):
        item.order_index = idx

    return final_route, before_mins, after_mins
