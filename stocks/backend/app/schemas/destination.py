from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class AirportInfo(BaseModel):
    iata: str = Field(..., min_length=3, max_length=3)
    name: str
    city: str
    country: str
    lat: float
    lng: float


class DestinationResponse(BaseModel):
    id: str
    name: str
    country: str
    region: Optional[str] = None
    lat: float
    lng: float
    iata_codes: List[str] = Field(default_factory=list)
    timezone: str = "UTC"
    description: Optional[str] = None
    wiki_title: Optional[str] = None
    hero_image_url: Optional[str] = None
    hero_image_author: Optional[str] = None
    hero_image_attribution: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PlaceResponse(BaseModel):
    id: str
    destination_id: str
    external_id: Optional[str] = None
    source: str
    name: str
    category: str
    lat: float
    lng: float
    description: Optional[str] = None
    rating: float = 4.0
    rate_score: float = 1.0
    wiki_title: Optional[str] = None
    hours_json: Optional[Dict[str, Any]] = None
    fee_text: Optional[str] = None
    typical_duration_minutes: int = 90
    image_url: Optional[str] = None
    image_author: Optional[str] = None
    image_attribution: Optional[str] = None
    why_recommended: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class WeatherForecastDay(BaseModel):
    date: str
    temp_max_c: float
    temp_min_c: float
    precipitation_prob: int
    condition: str
    icon: str


class WeatherResponse(BaseModel):
    summary: str
    days: List[WeatherForecastDay]
    packing_suggestions: List[str]


class EventResponse(BaseModel):
    name: str
    type: str
    start_date: str
    end_date: str
    source: str
    source_url: Optional[str] = None
    impact_level: str = "low"
    closure_risk: bool = False
    description: Optional[str] = None


class DishResponse(BaseModel):
    id: str
    destination_id: str
    name: str
    description: Optional[str] = None
    dietary_tags: List[str] = Field(default_factory=list)
    source_note: str = "Editorial pick"
    source_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
