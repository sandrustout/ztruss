import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Globe, Clock, Compass, Plus, ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { apiClient } from '../lib/api';
import { DestinationResponse, PlaceResponse, WeatherResponse, EventResponse, DishResponse } from '../types';
import { WeatherStrip } from '../components/weather/WeatherStrip';
import { FestivalBanner } from '../components/events/FestivalBanner';
import { PlaceCard } from '../components/places/PlaceCard';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { Skeleton } from '../components/ui/Skeleton';
import { AddToTripModal, StagedItemToAdd } from '../components/trips/AddToTripModal';

export const DestinationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [destination, setDestination] = useState<DestinationResponse | null>(null);
  const [places, setPlaces] = useState<PlaceResponse[]>([]);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [dishes, setDishes] = useState<DishResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('rank');

  const [basketItem, setBasketItem] = useState<StagedItemToAdd | null>(null);
  const [isBasketOpen, setIsBasketOpen] = useState(false);

  const handleOpenBasket = (item: StagedItemToAdd) => {
    setBasketItem(item);
    setIsBasketOpen(true);
  };

  useEffect(() => {
    async function loadDestination() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const [destData, placesData, weatherData, eventsData, foodData] = await Promise.all([
          apiClient<DestinationResponse>(`/destinations/${id}`),
          apiClient<PlaceResponse[]>(`/destinations/${id}/places?sort=${sortOrder}${activeCategory !== 'all' ? `&category=${activeCategory}` : ''}`),
          apiClient<WeatherResponse>(`/destinations/${id}/weather`),
          apiClient<EventResponse[]>(`/destinations/${id}/events`),
          apiClient<DishResponse[]>(`/destinations/${id}/food`),
        ]);

        setDestination(destData);
        setPlaces(placesData);
        setWeather(weatherData);
        setEvents(eventsData);
        setDishes(foodData);
      } catch (err: any) {
        setError(err.message || 'Failed to load destination information.');
      } finally {
        setLoading(false);
      }
    }
    loadDestination();
  }, [id, activeCategory, sortOrder]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <Skeleton className="h-72 w-full rounded-card" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 md:col-span-2" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-text">Destination Information Unavailable</h2>
        <p className="text-xs text-text-muted">{error || 'Could not locate destination records.'}</p>
        <Link to="/">
          <Button variant="primary" size="md">
            Return to Explore
          </Button>
        </Link>
      </div>
    );
  }

  const categories = [
    { key: 'all', label: 'All Attractions' },
    { key: 'monument', label: 'Monuments' },
    { key: 'museum', label: 'Museums' },
    { key: 'temple', label: 'Temples & Heritage' },
    { key: 'nature', label: 'Nature & Beaches' },
  ];

  const DESTINATION_FALLBACK_IMAGES: Record<string, string> = {
    goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    jaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
    kochi: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
    varanasi: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
    bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80',
    bangalore: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80',
    tokyo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
  };

  const heroImageSrc =
    destination.hero_image_url ||
    DESTINATION_FALLBACK_IMAGES[destination.name.toLowerCase()] ||
    DESTINATION_FALLBACK_IMAGES.jaipur;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumb Back Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Explore</span>
      </Link>

      {/* Hero Header Section */}
      <div className="relative rounded-card overflow-hidden h-80 sm:h-96 border border-border shadow-warm-lg group">
        <img
          src={heroImageSrc}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-espresso/90 via-brand-espresso/30 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-brand-cream">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-pill bg-brand-orange text-xs font-bold text-brand-cream uppercase tracking-wider">
                {destination.country}
              </span>
              {destination.iata_codes && destination.iata_codes.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-pill bg-brand-espresso/80 border border-brand-cream/20 text-xs font-mono font-bold">
                  {destination.iata_codes.join(' / ')}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-brand-cream">
              {destination.name}
            </h1>
            <p className="text-xs sm:text-sm text-brand-cream/90 line-clamp-2 leading-relaxed">
              {destination.description}
            </p>
          </div>

          <Link to={`/search?to=${destination.id}&destName=${encodeURIComponent(destination.name)}`}>
            <Button variant="primary" size="lg" className="gap-2 shadow-lg">
              <Compass className="w-4 h-4" />
              <span>Plan Trip to {destination.name}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Facts Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-card bg-surface border border-border shadow-warm">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Coordinates</p>
          <p className="text-sm font-bold text-text tabular-nums mt-1">
            {destination.lat.toFixed(4)}° N, {destination.lng.toFixed(4)}° E
          </p>
        </div>

        <div className="p-4 rounded-card bg-surface border border-border shadow-warm">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Timezone</p>
          <p className="text-sm font-bold text-text mt-1">{destination.timezone}</p>
        </div>

        <div className="p-4 rounded-card bg-surface border border-border shadow-warm">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Region</p>
          <p className="text-sm font-bold text-text mt-1">{destination.region || destination.country}</p>
        </div>

        <div className="p-4 rounded-card bg-surface border border-border shadow-warm">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Attractions Mapped</p>
          <p className="text-sm font-bold text-primary tabular-nums mt-1">{places.length} Sights</p>
        </div>
      </div>

      {/* Live Weather Forecast Strip */}
      {weather && <WeatherStrip weather={weather} />}

      {/* Festival Awareness Panel */}
      <FestivalBanner events={events} />

      {/* Places of Interest Catalog */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
              Top Places in {destination.name}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Ranked using OpenTripMap popularity scores, Wikipedia verification, and travel pacing.
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Sort by:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="h-9 px-2.5 text-xs bg-bg border border-border rounded-input text-text focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="rank">Recommended Rank</option>
              <option value="rating">Top Rated</option>
              <option value="duration">Shortest Visit</option>
            </select>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map(({ key, label }) => (
            <Chip
              key={key}
              active={activeCategory === key}
              onClick={() => setActiveCategory(key)}
            >
              {label}
            </Chip>
          ))}
        </div>

        {/* Places Grid */}
        {places.length === 0 ? (
          <div className="p-12 text-center rounded-card bg-surface border border-border text-xs text-text-muted">
            No attractions found in this category. Try selecting "All Attractions".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onAddToTrip={(p) =>
                  handleOpenBasket({
                    type: 'place',
                    title: p.name,
                    cost_estimate: 0,
                    duration_minutes: p.typical_duration_minutes || 90,
                    ref_table: 'places',
                    ref_id: p.id,
                    lat: p.lat,
                    lng: p.lng,
                    notes: p.category ? `Category: ${p.category}` : undefined,
                    destination_id: destination.id,
                    destination_name: destination.name,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Regional Cuisine & Must-Try Dishes per Section 7.7 & 14 */}
      {dishes.length > 0 && (
        <div className="p-6 rounded-card bg-surface border border-border shadow-warm space-y-4">
          <h3 className="text-base font-bold text-text flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-primary" />
            <span>Must-Try Local Dishes in {destination.name}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {dishes.map((dish) => (
              <div key={dish.id} className="p-3.5 rounded-input bg-bg border border-border space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-text">{dish.name}</p>
                  <span className="text-[10px] text-text-muted">{dish.source_note}</span>
                </div>
                {dish.description && <p className="text-[11px] text-text-muted">{dish.description}</p>}
                {dish.dietary_tags && dish.dietary_tags.length > 0 && (
                  <div className="flex gap-1 pt-1">
                    {dish.dietary_tags.map((t: string, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] bg-bg-elevated text-primary font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add To Trip Basket Modal */}
      <AddToTripModal
        item={basketItem}
        isOpen={isBasketOpen}
        onClose={() => setIsBasketOpen(false)}
      />
    </div>
  );
};
