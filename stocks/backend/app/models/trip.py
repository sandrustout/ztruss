import uuid
from datetime import datetime, date
from typing import Optional, Dict, Any
from sqlalchemy import String, Float, DateTime, Date, Boolean, Integer, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Trip(Base):
    """User planned trip."""
    __tablename__ = "trips"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    origin_iata: Mapped[str] = mapped_column(String(3), nullable=False)
    destination_id: Mapped[str] = mapped_column(String(36), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    trip_type: Mapped[str] = mapped_column(String(20), default="holiday")
    travellers_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=lambda: {"adults": 1, "children": 0, "infants": 0})
    cabin: Mapped[str] = mapped_column(String(20), default="economy")
    budget: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    share_token: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
