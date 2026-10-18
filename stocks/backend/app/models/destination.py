import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Float, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Destination(Base):
    """Destination city or region."""
    __tablename__ = "destinations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    region: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    iata_codes: Mapped[List[str]] = mapped_column(JSON, default=list)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    wiki_title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    hero_image_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    hero_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hero_image_author: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    hero_image_attribution: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="curated")
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
