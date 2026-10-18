import uuid
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class TripItem(Base):
    """Scheduled stop or activity within a trip day."""
    __tablename__ = "trip_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id: Mapped[str] = mapped_column(String(36), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'place', 'hotel', 'restaurant', 'flight', 'cab', 'event', 'note'
    day_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ref_table: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    ref_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    start_time: Mapped[str] = mapped_column(String(5), default="09:00")
    end_time: Mapped[str] = mapped_column(String(5), default="10:30")
    duration_minutes: Mapped[int] = mapped_column(Integer, default=90)
    travel_minutes_from_prev: Mapped[int] = mapped_column(Integer, default=15)
    travel_mode: Mapped[str] = mapped_column(String(20), default="cab")  # 'walk', 'cab', 'transit', 'drive'
    travel_source: Mapped[str] = mapped_column(String(20), default="estimate")  # 'live', 'estimate'
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cost_estimate: Mapped[float] = mapped_column(Float, default=0.0)
    cost_is_estimate: Mapped[bool] = mapped_column(Boolean, default=True)
    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    locked: Mapped[bool] = mapped_column(Boolean, default=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
