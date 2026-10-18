from typing import List, Optional, Dict, Any
from datetime import date
from pydantic import BaseModel, Field, ConfigDict


class FlightSearchRequest(BaseModel):
    origin_iata: str = Field(..., min_length=3, max_length=3, description="Origin 3-letter IATA code")
    destination_iata: str = Field(..., min_length=3, max_length=3, description="Destination 3-letter IATA code")
    departure_date: str = Field(..., description="YYYY-MM-DD")
    return_date: Optional[str] = Field(None, description="Optional YYYY-MM-DD return date")
    adults: int = Field(1, ge=1, le=9)
    children: int = Field(0, ge=0, le=8)
    infants: int = Field(0, ge=0, le=4)
    cabin: str = Field("economy", pattern="^(economy|premium_economy|business)$")


class FlightOffer(BaseModel):
    id: str
    provider: str
    airline_name: str
    airline_code: str
    airline_color: Optional[str] = "#C05800"
    airline_type: Optional[str] = "Standard"
    flight_number: str
    origin_iata: str
    origin_city: str
    destination_iata: str
    destination_city: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    stops: int
    stopover_airports: List[str] = Field(default_factory=list)
    cabin_class: str
    price_inr: float
    base_fare_inr: float
    taxes_inr: float
    convenience_fee: float = 0.0
    currency: str = "INR"
    baggage_cabin_kg: int = 7
    baggage_checked_kg: int = 15
    carbon_kg: float
    is_cheapest: bool = False
    is_fastest: bool = False
    is_best_value: bool = False
    savings_pct_vs_highest: int = 0
    duffel_offer_id: Optional[str] = None
    duffel_passenger_id: Optional[str] = None
    duffel_raw_currency: Optional[str] = None
    duffel_raw_amount: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class FlightSearchResponse(BaseModel):
    offers: List[FlightOffer]
    total_offers: int
    cheapest_price_inr: float
    highest_price_inr: float
    max_savings_percentage: int
    route_summary: str
    providers_queried: List[str]


class PassengerDetails(BaseModel):
    title: str = Field("mr", pattern="^(mr|mrs|ms)$")
    given_name: str = Field(..., min_length=1, max_length=50)
    family_name: str = Field(..., min_length=1, max_length=50)
    born_on: str = Field(..., description="YYYY-MM-DD")
    gender: str = Field("m", pattern="^(m|f)$")
    email: str = Field(..., description="Contact email for e-ticket")
    phone: str = Field(..., description="Contact phone with country code")


class FlightBookingRequest(BaseModel):
    offer_id: str
    passengers: List[PassengerDetails]


class FlightBookingResponse(BaseModel):
    booking_reference: str
    order_id: str
    status: str
    airline_name: str
    flight_number: str
    route: str
    departure_time: str
    amount_paid_inr: float
    currency: str = "INR"
    documents: List[Dict[str, Any]] = Field(default_factory=list)
    confirmation_message: str
