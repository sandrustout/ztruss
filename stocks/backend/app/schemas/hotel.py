from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class HotelIndexBreakdown(BaseModel):
    """Detailed mathematical explanation of the Bayesian TripWise Hotel Index score."""
    hotel_id: str
    hotel_name: str
    final_tripwise_index: float
    review_count: int
    
    # 5 Key Metric Weights
    location_score: float = Field(..., description="Proximity to transit, sights, and safe walkable hubs (30% weight)")
    location_weight_pct: int = 30
    
    cleanliness_score: float = Field(..., description="Verified housekeeping & hygiene audits (25% weight)")
    cleanliness_weight_pct: int = 25
    
    value_score: float = Field(..., description="Rate fairness vs local seasonal hotel index (20% weight)")
    value_weight_pct: int = 20
    
    amenities_score: float = Field(..., description="WiFi reliability, breakfast, pool, and AC (15% weight)")
    amenities_weight_pct: int = 15
    
    quietness_score: float = Field(..., description="Acoustic insulation and peaceful night rest (10% weight)")
    quietness_weight_pct: int = 10
    
    # Mathematical transparency
    raw_weighted_score: float
    bayesian_shrinkage_applied: bool = True
    bayesian_prior_mean: float = 8.0
    bayesian_confidence_param_m: int = 15
    anti_sponsored_slot_guarantee: str = "100% Organic Rank. Zero payment slots or promoted bid adjustments accepted."


class HotelResponse(BaseModel):
    id: str
    destination_id: str
    name: str
    category: str
    lat: float
    lng: float
    address: str
    distance_to_airport_km: float
    distance_to_center_km: float
    nearest_attraction_name: Optional[str] = None
    nearest_attraction_distance_km: float
    star_rating: float
    
    price_per_night_inr: float
    taxes_and_fees_inr: float
    total_price_inr: float
    
    location_score: float
    cleanliness_score: float
    value_score: float
    amenities_score: float
    quietness_score: float
    
    tripwise_index: float
    review_count: int
    amenities: List[str]
    image_url: Optional[str] = None
    image_author: Optional[str] = None
    image_attribution: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
