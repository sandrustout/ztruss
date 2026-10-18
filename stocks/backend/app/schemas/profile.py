from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class ProfileBase(BaseModel):
    display_name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None
    home_airport: str = Field("MAA", min_length=3, max_length=3)
    currency: str = Field("INR", min_length=3, max_length=3)
    theme: str = Field("system", pattern="^(light|dark|system)$")
    preferred_day_start: str = Field("09:00", pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$")
    travel_style: str = Field("balanced", pattern="^(relaxed|balanced|packed|fast)$")
    dietary_prefs: List[str] = Field(default_factory=list)
    accessibility_needs: List[str] = Field(default_factory=list)


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None
    home_airport: Optional[str] = Field(None, min_length=3, max_length=3)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    theme: Optional[str] = Field(None, pattern="^(light|dark|system)$")
    preferred_day_start: Optional[str] = Field(None, pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$")
    travel_style: Optional[str] = Field(None, pattern="^(relaxed|balanced|packed|fast)$")
    dietary_prefs: Optional[List[str]] = None
    accessibility_needs: Optional[List[str]] = None


class ProfileResponse(ProfileBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
