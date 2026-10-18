from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class TripItemBase(BaseModel):
    type: str = Field(..., pattern="^(place|hotel|restaurant|flight|cab|event|note)$")
    day_index: int = Field(0, ge=0)
    order_index: int = Field(0, ge=0)
    ref_table: Optional[str] = None
    ref_id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=150)
    start_time: str = Field("09:00", pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$")
    end_time: str = Field("10:30", pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$")
    duration_minutes: int = Field(90, ge=5, le=720)
    travel_minutes_from_prev: int = Field(15, ge=0, le=360)
    travel_mode: str = Field("cab", pattern="^(walk|cab|transit|drive)$")
    travel_source: str = Field("estimate", pattern="^(live|estimate)$")
    notes: Optional[str] = None
    cost_estimate: float = Field(0.0, ge=0.0)
    cost_is_estimate: bool = True
    lat: Optional[float] = None
    lng: Optional[float] = None
    locked: bool = False


class TripItemCreate(TripItemBase):
    pass


class TripItemUpdate(BaseModel):
    title: Optional[str] = None
    day_index: Optional[int] = Field(None, ge=0)
    order_index: Optional[int] = Field(None, ge=0)
    start_time: Optional[str] = Field(None, pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$")
    end_time: Optional[str] = Field(None, pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$")
    duration_minutes: Optional[int] = Field(None, ge=5, le=720)
    travel_minutes_from_prev: Optional[int] = Field(None, ge=0, le=360)
    travel_mode: Optional[str] = Field(None, pattern="^(walk|cab|transit|drive)$")
    travel_source: Optional[str] = Field(None, pattern="^(live|estimate)$")
    notes: Optional[str] = None
    cost_estimate: Optional[float] = Field(None, ge=0.0)
    cost_is_estimate: Optional[bool] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    locked: Optional[bool] = None


class TripItemResponse(TripItemBase):
    id: str
    trip_id: str
    version: int

    model_config = ConfigDict(from_attributes=True)


class TripBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    status: str = Field("draft", pattern="^(draft|planned|booked|completed|cancelled)$")
    origin_iata: str = Field("MAA", min_length=3, max_length=3)
    destination_id: str
    start_date: date
    end_date: date
    trip_type: str = Field("holiday", pattern="^(holiday|vacation|honeymoon|trip)$")
    travellers_json: Dict[str, Any] = Field(default_factory=lambda: {"adults": 1, "children": 0, "infants": 0})
    cabin: str = Field("economy", pattern="^(economy|premium_economy|business)$")
    budget: Optional[float] = Field(None, ge=0.0)
    currency: str = Field("INR", min_length=3, max_length=3)
    is_public: bool = False


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(draft|planned|booked|completed|cancelled)$")
    origin_iata: Optional[str] = Field(None, min_length=3, max_length=3)
    destination_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    trip_type: Optional[str] = Field(None, pattern="^(holiday|vacation|honeymoon|trip)$")
    travellers_json: Optional[Dict[str, Any]] = None
    cabin: Optional[str] = Field(None, pattern="^(economy|premium_economy|business)$")
    budget: Optional[float] = None
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    is_public: Optional[bool] = None
    version: Optional[int] = None


class TripResponse(TripBase):
    id: str
    user_id: str
    share_token: Optional[str] = None
    version: int
    created_at: datetime
    updated_at: datetime
    items: List[TripItemResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ReorderItemEntry(BaseModel):
    id: str
    day_index: int = Field(..., ge=0)
    order_index: int = Field(..., ge=0)


class ReorderItemsRequest(BaseModel):
    items: List[ReorderItemEntry]
    client_version: Optional[int] = None


class ScheduleDayRequest(BaseModel):
    day_index: int = Field(..., ge=0)
    preferred_start_time: str = Field("09:00", pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$")


class OptimiseDayRequest(BaseModel):
    day_index: int = Field(..., ge=0)


class OptimiseDayResponse(BaseModel):
    day_index: int
    before_travel_minutes: int
    after_travel_minutes: int
    saved_minutes: int
    items: List[TripItemResponse]
