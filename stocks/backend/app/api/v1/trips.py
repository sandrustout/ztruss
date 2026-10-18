from typing import List, Dict, Tuple
from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.db.session import get_db
from app.core.security import get_current_user, AuthUser
from app.core.errors import NotFoundException, ForbiddenException, VersionConflictException
from app.models.trip import Trip
from app.models.trip_item import TripItem
from app.models.place import Place
from app.schemas.trip import (
    TripCreate,
    TripUpdate,
    TripResponse,
    TripItemCreate,
    TripItemUpdate,
    TripItemResponse,
    ReorderItemsRequest,
    ScheduleDayRequest,
    OptimiseDayRequest,
    OptimiseDayResponse
)
from app.services.scheduling import schedule_day
from app.services.optimise import optimise_day_stops

router = APIRouter(prefix="/trips", tags=["Trips & Itinerary"])


async def get_user_trip(trip_id: str, user_id: str, db: AsyncSession) -> Trip:
    """Helper verifying trip existence and user ownership."""
    stmt = select(Trip).where(Trip.id == trip_id)
    res = await db.execute(stmt)
    trip = res.scalar_one_or_none()
    if not trip:
        raise NotFoundException(f"Trip with ID '{trip_id}' does not exist.")
    if trip.user_id != user_id:
        raise ForbiddenException("You do not have permission to access or modify this trip.")
    return trip


@router.get("", response_model=List[TripResponse])
async def list_trips(
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[TripResponse]:
    """Returns all planned trips and drafts owned by the authenticated user."""
    stmt = select(Trip).where(Trip.user_id == current_user.id).order_by(Trip.updated_at.desc())
    res = await db.execute(stmt)
    trips = res.scalars().all()

    responses = []
    for t in trips:
        item_stmt = select(TripItem).where(TripItem.trip_id == t.id).order_by(TripItem.day_index, TripItem.order_index)
        item_res = await db.execute(item_stmt)
        items = item_res.scalars().all()

        resp = TripResponse.model_validate(t)
        resp.items = [TripItemResponse.model_validate(it) for it in items]
        responses.append(resp)

    return responses


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    payload: TripCreate,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TripResponse:
    """Creates a new trip draft for the authenticated user."""
    dest_id = payload.destination_id
    if len(dest_id) != 36:
        from app.models.destination import Destination
        dest_res = await db.execute(select(Destination))
        all_dests = dest_res.scalars().all()
        dest_upper = dest_id.upper()
        matched = next(
            (d for d in all_dests if dest_upper in (d.iata_codes or []) or dest_id.lower() in d.name.lower()),
            None
        )
        if matched:
            dest_id = matched.id
        elif all_dests:
            dest_id = all_dests[0].id

    trip = Trip(
        user_id=current_user.id,
        title=payload.title,
        status=payload.status,
        origin_iata=payload.origin_iata.upper(),
        destination_id=dest_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        trip_type=payload.trip_type,
        travellers_json=payload.travellers_json,
        cabin=payload.cabin,
        budget=payload.budget,
        currency=payload.currency,
        is_public=payload.is_public
    )
    db.add(trip)
    await db.commit()
    await db.refresh(trip)

    resp = TripResponse.model_validate(trip)
    resp.items = []
    return resp


@router.get("/{id}", response_model=TripResponse)
async def get_trip(
    id: str = Path(..., description="Trip UUID"),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TripResponse:
    if id == "new":
        stmt = select(Trip).where(Trip.user_id == current_user.id).order_by(Trip.updated_at.desc())
        res = await db.execute(stmt)
        latest_trip = res.scalars().first()
        if latest_trip:
            trip = latest_trip
        else:
            from app.models.destination import Destination
            import datetime
            all_dests_res = await db.execute(select(Destination))
            first_dest = all_dests_res.scalars().first()
            dest_id = first_dest.id if first_dest else "d0000000-0000-0000-0000-000000000001"
            today = datetime.date.today().isoformat()
            future_day = (datetime.date.today() + datetime.timedelta(days=4)).isoformat()
            trip = Trip(
                user_id=current_user.id,
                title="New Exploration Trip",
                status="draft",
                origin_iata="MAA",
                destination_id=dest_id,
                start_date=today,
                end_date=future_day,
                trip_type="holiday",
                travellers_json={"adults": 1, "children": 0, "infants": 0},
                cabin="economy",
                budget=35000,
                currency="INR",
                is_public=False
            )
            db.add(trip)
            await db.commit()
            await db.refresh(trip)
    else:
        trip = await get_user_trip(id, current_user.id, db)

    item_stmt = select(TripItem).where(TripItem.trip_id == trip.id).order_by(TripItem.day_index, TripItem.order_index)
    item_res = await db.execute(item_stmt)
    items = item_res.scalars().all()

    resp = TripResponse.model_validate(trip)
    resp.items = [TripItemResponse.model_validate(it) for it in items]
    return resp


@router.patch("/{id}", response_model=TripResponse)
async def update_trip(
    payload: TripUpdate,
    id: str = Path(..., description="Trip UUID"),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TripResponse:
    """
    Updates trip properties with optimistic concurrency version check (Section 19.3).
    """
    trip = await get_user_trip(id, current_user.id, db)

    # Concurrency conflict detection
    if payload.version is not None and payload.version < trip.version:
        raise VersionConflictException(
            f"Trip was modified elsewhere (server version: {trip.version}, payload version: {payload.version})."
        )

    update_dict = payload.model_dump(exclude_unset=True)
    update_dict.pop("version", None)

    for field, value in update_dict.items():
        setattr(trip, field, value)

    trip.version += 1
    await db.commit()
    await db.refresh(trip)

    return await get_trip(id, current_user, db)


@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_trip(
    id: str = Path(..., description="Trip UUID"),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Deletes a trip and all its scheduled items."""
    trip = await get_user_trip(id, current_user.id, db)
    await db.execute(delete(TripItem).where(TripItem.trip_id == trip.id))
    await db.execute(delete(Trip).where(Trip.id == trip.id))
    await db.commit()
    return {"message": "Trip successfully deleted."}


@router.post("/{id}/items", response_model=TripItemResponse, status_code=status.HTTP_201_CREATED)
async def add_trip_item(
    payload: TripItemCreate,
    id: str = Path(..., description="Trip UUID"),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TripItemResponse:
    """Adds a place, hotel, restaurant, or activity stop into an itinerary day."""
    trip = await get_user_trip(id, current_user.id, db)

    # Determine order_index if not supplied
    count_stmt = select(TripItem).where(
        TripItem.trip_id == trip.id,
        TripItem.day_index == payload.day_index
    )
    count_res = await db.execute(count_stmt)
    existing_items = count_res.scalars().all()
    next_order = len(existing_items)

    item_lat = payload.lat
    item_lng = payload.lng

    if item_lat is None and payload.ref_id:
        if payload.ref_table == "places":
            p_res = await db.execute(select(Place).where(Place.id == payload.ref_id))
            place_obj = p_res.scalar_one_or_none()
            if place_obj:
                item_lat = place_obj.lat
                item_lng = place_obj.lng
        elif payload.ref_table == "hotels":
            from app.models.hotel import Hotel
            h_res = await db.execute(select(Hotel).where(Hotel.id == payload.ref_id))
            hotel_obj = h_res.scalar_one_or_none()
            if hotel_obj:
                item_lat = hotel_obj.lat
                item_lng = hotel_obj.lng

    item = TripItem(
        trip_id=trip.id,
        type=payload.type,
        day_index=payload.day_index,
        order_index=payload.order_index if payload.order_index > 0 else next_order,
        ref_table=payload.ref_table,
        ref_id=payload.ref_id,
        title=payload.title,
        start_time=payload.start_time,
        end_time=payload.end_time,
        duration_minutes=payload.duration_minutes,
        travel_minutes_from_prev=payload.travel_minutes_from_prev,
        travel_mode=payload.travel_mode,
        travel_source=payload.travel_source,
        notes=payload.notes,
        cost_estimate=payload.cost_estimate,
        cost_is_estimate=payload.cost_is_estimate,
        lat=item_lat,
        lng=item_lng,
        locked=payload.locked
    )
    db.add(item)
    trip.version += 1
    await db.commit()
    await db.refresh(item)

    return TripItemResponse.model_validate(item)


@router.patch("/{id}/items/{item_id}", response_model=TripItemResponse)
async def update_trip_item(
    payload: TripItemUpdate,
    id: str = Path(..., description="Trip UUID"),
    item_id: str = Path(..., description="Item UUID"),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TripItemResponse:
    """Updates a stop's notes, timing, travel mode, or cost estimate."""
    trip = await get_user_trip(id, current_user.id, db)

    stmt = select(TripItem).where(TripItem.id == item_id, TripItem.trip_id == trip.id)
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise NotFoundException(f"Trip item with ID '{item_id}' not found.")

    update_dict = payload.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(item, field, value)

    item.version += 1
    trip.version += 1
    await db.commit()
    await db.refresh(item)

    return TripItemResponse.model_validate(item)


@router.delete("/{id}/items/{item_id}", status_code=status.HTTP_200_OK)
async def delete_trip_item(
    id: str = Path(..., description="Trip UUID"),
    item_id: str = Path(..., description="Item UUID"),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Removes a stop from the itinerary board."""
    trip = await get_user_trip(id, current_user.id, db)

    stmt = select(TripItem).where(TripItem.id == item_id, TripItem.trip_id == trip.id)
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise NotFoundException(f"Trip item with ID '{item_id}' not found.")

    await db.execute(delete(TripItem).where(TripItem.id == item.id))
    trip.version += 1
    await db.commit()

    return {"message": "Stop removed from itinerary."}


@router.post("/{id}/items/reorder", response_model=List[TripItemResponse])
async def reorder_trip_items(
    payload: ReorderItemsRequest,
    id: str = Path(..., description="Trip UUID"),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[TripItemResponse]:
    """
    Batch updates day_index and order_index for cards after drag-and-drop operations (Section 19.1).
    """
    trip = await get_user_trip(id, current_user.id, db)

    for entry in payload.items:
        stmt = select(TripItem).where(TripItem.id == entry.id, TripItem.trip_id == trip.id)
        res = await db.execute(stmt)
        item = res.scalar_one_or_none()
        if item:
            item.day_index = entry.day_index
            item.order_index = entry.order_index
            item.version += 1

    trip.version += 1
    await db.commit()

    # Return freshly ordered items
    item_stmt = select(TripItem).where(TripItem.trip_id == trip.id).order_by(TripItem.day_index, TripItem.order_index)
    item_res = await db.execute(item_stmt)
    items = item_res.scalars().all()
    return [TripItemResponse.model_validate(it) for it in items]


@router.post("/{id}/schedule", response_model=List[TripItemResponse])
async def schedule_day_endpoint(
    payload: ScheduleDayRequest,
    id: str = Path(..., description="Trip UUID"),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[TripItemResponse]:
    """
    Runs the timing engine with live routing, buffers, and peak-hour traffic multipliers.
    """
    trip = await get_user_trip(id, current_user.id, db)

    item_stmt = select(TripItem).where(
        TripItem.trip_id == trip.id,
        TripItem.day_index == payload.day_index
    ).order_by(TripItem.order_index)
    item_res = await db.execute(item_stmt)
    items = list(item_res.scalars().all())

    if not items:
        return []

    # Map place coordinates
    place_ids = [it.ref_id for it in items if it.ref_id]
    coords_map: Dict[str, Tuple[float, float]] = {}
    if place_ids:
        p_stmt = select(Place).where(Place.id.in_(place_ids))
        p_res = await db.execute(p_stmt)
        for p in p_res.scalars().all():
            coords_map[p.id] = (p.lat, p.lng)

    scheduled, meta = await schedule_day(
        items=items,
        place_coords=coords_map,
        preferred_start_time=payload.preferred_start_time
    )

    trip.version += 1
    await db.commit()

    return [TripItemResponse.model_validate(it) for it in scheduled]


@router.post("/{id}/optimise-day", response_model=OptimiseDayResponse)
async def optimise_day_endpoint(
    payload: OptimiseDayRequest,
    id: str = Path(..., description="Trip UUID"),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> OptimiseDayResponse:
    """
    Optimises stops using Nearest-Neighbour followed by 2-Opt heuristic (Section 13.11).
    """
    trip = await get_user_trip(id, current_user.id, db)

    item_stmt = select(TripItem).where(
        TripItem.trip_id == trip.id,
        TripItem.day_index == payload.day_index
    ).order_by(TripItem.order_index)
    item_res = await db.execute(item_stmt)
    items = list(item_res.scalars().all())

    place_ids = [it.ref_id for it in items if it.ref_id]
    coords_map: Dict[str, Tuple[float, float]] = {}
    if place_ids:
        p_stmt = select(Place).where(Place.id.in_(place_ids))
        p_res = await db.execute(p_stmt)
        for p in p_res.scalars().all():
            coords_map[p.id] = (p.lat, p.lng)

    reordered, before_mins, after_mins = optimise_day_stops(items, coords_map)

    trip.version += 1
    await db.commit()

    return OptimiseDayResponse(
        day_index=payload.day_index,
        before_travel_minutes=before_mins,
        after_travel_minutes=after_mins,
        saved_minutes=max(0, before_mins - after_mins),
        items=[TripItemResponse.model_validate(it) for it in reordered]
    )
