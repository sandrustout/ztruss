import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import String, Text, Float, Integer, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Place(Base):
    """Tourist sight, monument, beach, museum, or religious landmark."""
    __tablename__ = "places"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    destination_id: Mapped[str] = mapped_column(String(36), nullable=False)
    external_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="opentripmap")
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="monument")
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rating: Mapped[float] = mapped_column(Float, default=4.0)
    rate_score: Mapped[float] = mapped_column(Float, default=1.0)
    wiki_title: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    hours_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    fee_text: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    typical_duration_minutes: Mapped[int] = mapped_column(Integer, default=90)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_author: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    image_attribution: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
