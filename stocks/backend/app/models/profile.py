import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Profile(Base):
    """User profile matching Supabase auth user metadata and preferences."""
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="Traveller")
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    home_airport: Mapped[str] = mapped_column(String(3), default="MAA")
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    theme: Mapped[str] = mapped_column(String(10), default="system")
    preferred_day_start: Mapped[str] = mapped_column(String(5), default="09:00")
    travel_style: Mapped[str] = mapped_column(String(20), default="balanced")
    dietary_prefs: Mapped[List[str]] = mapped_column(JSON, default=list)
    accessibility_needs: Mapped[List[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
