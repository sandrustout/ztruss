import uuid
from typing import List, Optional
from sqlalchemy import String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Dish(Base):
    """Local culinary specialty or iconic regional dish."""
    __tablename__ = "dishes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    destination_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dietary_tags: Mapped[List[str]] = mapped_column(JSON, default=list)
    source_note: Mapped[str] = mapped_column(String(100), default="Editorial pick")
    source_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
