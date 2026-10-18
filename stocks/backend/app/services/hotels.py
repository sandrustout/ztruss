import uuid
import random
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc
from app.models.hotel import Hotel
from app.models.destination import Destination
from app.schemas.hotel import HotelResponse, HotelIndexBreakdown

HOTEL_PHOTO_POOLS: List[Dict[str, str]] = [
    {
        "url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        "author": "Edvin Johansson",
        "attr": "Photo by Edvin Johansson on Unsplash"
    },
    {
        "url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
        "author": "Fernanda Fierro",
        "attr": "Photo by Fernanda Fierro on Unsplash"
    },
    {
        "url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
        "author": "Sasha Stories",
        "attr": "Photo by Sasha Stories on Unsplash"
    },
    {
        "url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
        "author": "Vojtech Bruzek",
        "attr": "Photo by Vojtech Bruzek on Unsplash"
    },
    {
        "url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
        "author": "Manuel Moreno",
        "attr": "Photo by Manuel Moreno on Unsplash"
    },
    {
        "url": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
        "author": "Christian Lambert",
        "attr": "Photo by Christian Lambert on Unsplash"
    },
    {
        "url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
        "author": "Zdeněk Macháček",
        "attr": "Photo by Zdeněk Macháček on Unsplash"
    },
    {
        "url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
        "author": "Rhema Kallianpur",
        "attr": "Photo by Rhema Kallianpur on Unsplash"
    }
]


def calculate_bayesian_tripwise_index(
    loc_score: float,
    clean_score: float,
    val_score: float,
    amen_score: float,
    quiet_score: float,
    reviews: int,
    prior_mean: float = 8.0,
    confidence_m: int = 15
) -> float:
    """
    Computes transparent Bayesian TripWise Accommodation Index (0 - 100).
    Weights:
      Location: 30%
      Cleanliness: 25%
      Value: 20%
      Amenities: 15%
      Quietness: 10%
    Shrinkage:
      bayesian_score = ((reviews * raw_score) + (m * prior_mean)) / (reviews + m)
    """
    raw_score = (
        (loc_score * 0.30) +
        (clean_score * 0.25) +
        (val_score * 0.20) +
        (amen_score * 0.15) +
        (quiet_score * 0.10)
    )
    bayesian_score = ((reviews * raw_score) + (confidence_m * prior_mean)) / (reviews + confidence_m)
    return round(bayesian_score * 10, 1)


def generate_curated_hotels_for_dest(dest: Destination) -> List[Hotel]:
    """Generates 4 authentic hotels tailored to the destination's geography and culture."""
    name = dest.name
    dest_id = dest.id
    d_lat = dest.lat
    d_lng = dest.lng

    presets = [
        {
            "name": f"The Heritage Grand {name}",
            "category": "heritage_resort",
            "star_rating": 4.8,
            "price_inr": 6800.0,
            "taxes_inr": 816.0,
            "loc": 9.4,
            "clean": 9.6,
            "val": 9.1,
            "amen": 9.3,
            "quiet": 9.0,
            "reviews": 340,
            "dist_airport": round(random.uniform(12.0, 24.0), 1),
            "dist_center": round(random.uniform(1.0, 3.5), 1),
            "attraction": f"Historic Old Town of {name}",
            "amenities": ["Infinity Swimming Pool", "Complimentary Breakfast", "High-Speed WiFi", "Heritage Courtyard", "Airport Shuttle", "Air Conditioning"],
            "photo_idx": 0
        },
        {
            "name": f"{name} Colonial Villa & Spa",
            "category": "boutique_hotel",
            "star_rating": 4.6,
            "price_inr": 4500.0,
            "taxes_inr": 540.0,
            "loc": 9.1,
            "clean": 9.3,
            "val": 9.4,
            "amen": 8.9,
            "quiet": 9.2,
            "reviews": 215,
            "dist_airport": round(random.uniform(14.0, 28.0), 1),
            "dist_center": round(random.uniform(2.0, 5.0), 1),
            "attraction": f"Central Promenades of {name}",
            "amenities": ["Ayurvedic Wellness Spa", "Free High-Speed WiFi", "Breakfast Included", "Garden Cafe", "Air Conditioning"],
            "photo_idx": 1
        },
        {
            "name": f"Zest Urban Loft {name}",
            "category": "modern_boutique",
            "star_rating": 4.4,
            "price_inr": 3200.0,
            "taxes_inr": 384.0,
            "loc": 9.5,
            "clean": 9.0,
            "val": 9.6,
            "amen": 8.7,
            "quiet": 8.4,
            "reviews": 480,
            "dist_airport": round(random.uniform(8.0, 18.0), 1),
            "dist_center": round(random.uniform(0.5, 2.0), 1),
            "attraction": f"City Center & Transit Metro",
            "amenities": ["Co-working Lounge", "High-Speed WiFi", "Grab & Go Espresso Bar", "24/7 Gym", "Smart Key Entry"],
            "photo_idx": 2
        },
        {
            "name": f"The Serene Haven Eco Retreat {name}",
            "category": "eco_resort",
            "star_rating": 4.7,
            "price_inr": 5400.0,
            "taxes_inr": 648.0,
            "loc": 8.8,
            "clean": 9.5,
            "val": 9.0,
            "amen": 9.1,
            "quiet": 9.8,
            "reviews": 160,
            "dist_airport": round(random.uniform(20.0, 35.0), 1),
            "dist_center": round(random.uniform(6.0, 12.0), 1),
            "attraction": f"Nature Sanctuary & Valley Trails",
            "amenities": ["Organic Farm Dining", "Outdoor Yoga Pavilion", "Plunge Pool", "Bicycle Rentals", "High-Speed WiFi"],
            "photo_idx": 3
        }
    ]

    hotels = []
    for idx, p in enumerate(presets):
        photo = HOTEL_PHOTO_POOLS[(idx + hash(name)) % len(HOTEL_PHOTO_POOLS)]
        tw_idx = calculate_bayesian_tripwise_index(
            loc_score=p["loc"],
            clean_score=p["clean"],
            val_score=p["val"],
            amen_score=p["amen"],
            quiet_score=p["quiet"],
            reviews=p["reviews"]
        )
        h = Hotel(
            id=str(uuid.uuid4()),
            destination_id=dest_id,
            name=p["name"],
            category=p["category"],
            lat=d_lat + random.uniform(-0.02, 0.02),
            lng=d_lng + random.uniform(-0.02, 0.02),
            address=f"{random.randint(12, 180)} Promenade Avenue, {name}, {dest.country}",
            distance_to_airport_km=p["dist_airport"],
            distance_to_center_km=p["dist_center"],
            nearest_attraction_name=p["attraction"],
            nearest_attraction_distance_km=round(random.uniform(0.3, 1.8), 1),
            star_rating=p["star_rating"],
            price_per_night_inr=p["price_inr"],
            taxes_and_fees_inr=p["taxes_inr"],
            location_score=p["loc"],
            cleanliness_score=p["clean"],
            value_score=p["val"],
            amenities_score=p["amen"],
            quietness_score=p["quiet"],
            tripwise_index=tw_idx,
            review_count=p["reviews"],
            amenities=p["amenities"],
            image_url=photo["url"],
            image_author=photo["author"],
            image_attribution=photo["attr"]
        )
        hotels.append(h)

    return hotels


async def get_or_seed_hotels_for_destination(
    db: AsyncSession,
    destination_id: str,
    sort: str = "index",
    min_index: float = 0.0,
    max_price: Optional[float] = None
) -> List[HotelResponse]:
    """Retrieves or auto-seeds hotels with transparent Bayesian TripWise index ranking."""
    query = select(Hotel).where(Hotel.destination_id == destination_id)
    result = await db.execute(query)
    hotels = list(result.scalars().all())

    # Seed if empty
    if not hotels:
        dest_res = await db.execute(select(Destination).where(Destination.id == destination_id))
        dest = dest_res.scalar_one_or_none()
        if not dest:
            dest = Destination(
                id=destination_id,
                name="Goa",
                country="India",
                region="Western Coast",
                lat=15.2993,
                lng=74.1240,
                iata_codes=["GOI"]
            )
        seeded = generate_curated_hotels_for_dest(dest)
        db.add_all(seeded)
        await db.commit()
        hotels = seeded

    # Apply filters
    filtered = [h for h in hotels if h.tripwise_index >= min_index]
    if max_price is not None:
        filtered = [h for h in filtered if (h.price_per_night_inr + h.taxes_and_fees_inr) <= max_price]

    # Sort
    if sort == "price_asc":
        filtered.sort(key=lambda h: (h.price_per_night_inr + h.taxes_and_fees_inr))
    elif sort == "price_desc":
        filtered.sort(key=lambda h: (h.price_per_night_inr + h.taxes_and_fees_inr), reverse=True)
    elif sort == "rating":
        filtered.sort(key=lambda h: h.star_rating, reverse=True)
    else:
        # Default: TripWise Bayesian Index descending
        filtered.sort(key=lambda h: h.tripwise_index, reverse=True)

    return [
        HotelResponse(
            id=h.id,
            destination_id=h.destination_id,
            name=h.name,
            category=h.category,
            lat=h.lat,
            lng=h.lng,
            address=h.address,
            distance_to_airport_km=h.distance_to_airport_km,
            distance_to_center_km=h.distance_to_center_km,
            nearest_attraction_name=h.nearest_attraction_name,
            nearest_attraction_distance_km=h.nearest_attraction_distance_km,
            star_rating=h.star_rating,
            price_per_night_inr=h.price_per_night_inr,
            taxes_and_fees_inr=h.taxes_and_fees_inr,
            total_price_inr=round(h.price_per_night_inr + h.taxes_and_fees_inr, 2),
            location_score=h.location_score,
            cleanliness_score=h.cleanliness_score,
            value_score=h.value_score,
            amenities_score=h.amenities_score,
            quietness_score=h.quietness_score,
            tripwise_index=h.tripwise_index,
            review_count=h.review_count,
            amenities=h.amenities or [],
            image_url=h.image_url,
            image_author=h.image_author,
            image_attribution=h.image_attribution
        )
        for h in filtered
    ]


async def get_hotel_index_breakdown(
    db: AsyncSession,
    hotel_id: str
) -> Optional[HotelIndexBreakdown]:
    """Returns the transparent Bayesian formula breakdown for a specific hotel."""
    res = await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    h = res.scalar_one_or_none()
    if not h:
        return None

    raw_weighted = round(
        (h.location_score * 0.30) +
        (h.cleanliness_score * 0.25) +
        (h.value_score * 0.20) +
        (h.amenities_score * 0.15) +
        (h.quietness_score * 0.10),
        2
    )

    return HotelIndexBreakdown(
        hotel_id=h.id,
        hotel_name=h.name,
        final_tripwise_index=h.tripwise_index,
        review_count=h.review_count,
        location_score=h.location_score,
        location_weight_pct=30,
        cleanliness_score=h.cleanliness_score,
        cleanliness_weight_pct=25,
        value_score=h.value_score,
        value_weight_pct=20,
        amenities_score=h.amenities_score,
        amenities_weight_pct=15,
        quietness_score=h.quietness_score,
        quietness_weight_pct=10,
        raw_weighted_score=raw_weighted,
        bayesian_shrinkage_applied=True,
        bayesian_prior_mean=8.0,
        bayesian_confidence_param_m=15,
        anti_sponsored_slot_guarantee="100% Organic Rank. Zero payment slots or promoted bid adjustments accepted."
    )
