from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.session import get_db
from app.core.security import get_current_user, AuthUser
from app.core.errors import NotFoundException
from app.models.profile import Profile
from app.models.trip import Trip
from app.schemas.profile import ProfileResponse, ProfileUpdate

router = APIRouter(tags=["Auth & Profile"])


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ProfileResponse:
    """
    Returns the authenticated user's profile.
    Automatically initializes the profile if logging in for the first time.
    """
    stmt = select(Profile).where(Profile.id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        profile = Profile(
            id=current_user.id,
            display_name=current_user.email.split("@")[0].capitalize() if current_user.email else "Traveller",
            home_airport="MAA",
            currency="INR",
            theme="system",
            preferred_day_start="09:00",
            travel_style="balanced",
            dietary_prefs=[],
            accessibility_needs=[]
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return profile


@router.patch("/me", response_model=ProfileResponse)
async def update_my_profile(
    payload: ProfileUpdate,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ProfileResponse:
    """Updates the authenticated user's travel preferences and theme."""
    stmt = select(Profile).where(Profile.id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        profile = Profile(id=current_user.id)
        db.add(profile)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile


@router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_my_account(
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Deletes the authenticated user's profile and planned trips.
    Implements GDPR / privacy compliance per prompt requirement 17.8.
    """
    # Delete associated trips
    await db.execute(delete(Trip).where(Trip.user_id == current_user.id))
    # Delete profile
    await db.execute(delete(Profile).where(Profile.id == current_user.id))
    await db.commit()

    return {"message": "User account and associated trip data have been permanently removed."}
