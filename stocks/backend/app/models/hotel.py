import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Text, Float, Integer, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Hotel(Base):
    """Accommodation stay with Bayesian TripWise Index ranking."""
    __tablename__ = "hotels"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    destination_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="boutique_hotel")
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    address: Mapped[str] = mapped_column(String(250), nullable=False)
    distance_to_airport_km: Mapped[float] = mapped_column(Float, default=12.5)
    distance_to_center_km: Mapped[float] = mapped_column(Float, default=3.2)
    nearest_attraction_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    nearest_attraction_distance_km: Mapped[float] = mapped_column(Float, default=1.0)
    star_rating: Mapped[float] = mapped_column(Float, default=4.5)
    
    # Transparent pricing
    price_per_night_inr: Mapped[float] = mapped_column(Float, nullable=False)
    taxes_and_fees_inr: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Component scores (0.0 to 10.0)
    location_score: Mapped[float] = mapped_column(Float, default=9.0)     # 30% weight
    cleanliness_score: Mapped[float] = mapped_column(Float, default=9.2)  # 25% weight
    value_score: Mapped[float] = mapped_column(Float, default=8.8)        # 20% weight
    amenities_score: Mapped[float] = mapped_column(Float, default=8.5)    # 15% weight
    quietness_score: Mapped[float] = mapped_column(Float, default=8.7)    # 10% weight
    
    # Bayesian composite score (0.0 to 100.0)
    tripwise_index: Mapped[float] = mapped_column(Float, default=89.5, index=True)
    review_count: Mapped[int] = mapped_column(Integer, default=120)
    
    amenities: Mapped[List[str]] = mapped_column(JSON, default=list)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_author: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    image_attribution: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
