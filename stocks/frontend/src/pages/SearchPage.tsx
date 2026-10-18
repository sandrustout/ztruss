import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Plane, 
  Building, 
  MapPin, 
  Calendar, 
  Filter, 
  ArrowLeft, 
  RefreshCw, 
  X,
  Search,
  CheckCircle,
  AlertCircle,
  SlidersHorizontal,
  ShieldCheck
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { 
  DestinationResponse, 
  PlaceResponse, 
  EventResponse, 
  WeatherResponse,
  FlightOffer,
  FlightSearchResponse,
  FlightBookingResponse,
  HotelResponse
} from '../types';
import { PlaceCard } from '../components/places/PlaceCard';
import { WeatherStrip } from '../components/weather/WeatherStrip';
import { FestivalBanner } from '../components/events/FestivalBanner';
import { Chip } from '../components/ui/Chip';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { FlightCard } from '../components/flights/FlightCard';
import { FlightFilters, FlightFilterState } from '../components/flights/FlightFilters';
import { FlightComparisonView } from '../components/flights/FlightComparisonView';
import { FlightBookingModal } from '../components/flights/FlightBookingModal';
import { HotelCard } from '../components/hotels/HotelCard';
import { HotelFilters, HotelFilterState } from '../components/hotels/HotelFilters';
import { useTripStore } from '../store/tripStore';
import { AddToTripModal, StagedItemToAdd } from '../components/trips/AddToTripModal';

const CITY_TO_IATA: Record<string, string> = {
  goa: 'GOI',
  jaipur: 'JAI',
  kochi: 'COK',
  varanasi: 'VNS',
  bengaluru: 'BLR',
  bangalore: 'BLR',
  tokyo: 'HND',
  paris: 'CDG',
  dubai: 'DXB',
  mumbai: 'BOM',
  delhi: 'DEL',
  agra: 'AGR',
  udaipur: 'UDR',
  munnar: 'COK',
  manali: 'KUU',
  rishikesh: 'DED',
  amritsar: 'ATQ',
  srinagar: 'SXR',
  darjeeling: 'IXB',
  pondicherry: 'PNY',
  puducherry: 'PNY',
  ooty: 'CJB',
  shimla: 'SLV',
  hyderabad: 'HYD',
  kolkata: 'CCU',
  hampi: 'VDY',
  leh: 'IXL',
  mysuru: 'MYQ',
  mysore: 'MYQ',
  bangkok: 'BKK',
  singapore: 'SIN',
  kuala_lumpur: 'KUL',
  bali: 'DPS',
  london: 'LHR',
  rome: 'FCO',
  amsterdam: 'AMS',
  istanbul: 'IST',
  new_york: 'JFK',
  barcelona: 'BCN',
  sydney: 'SYD',
  cairo: 'CAI',
  seoul: 'ICN',
  zurich: 'ZRH',
  prague: 'PRG',
  vienna: 'VIE',
  cape_town: 'CPT',
  rio_de_janeiro: 'GIG',
  toronto: 'YYZ',
  los_angeles: 'LAX',
  hong_kong: 'HKG',
  athens: 'ATH',
  budapest: 'BUD',
  florence: 'FLR',
  kyoto: 'KIX',
  venice: 'VCE',
  santorini: 'JTR',
  san_francisco: 'SFO',
  'san francisco': 'SFO',
  vancouver: 'YVR',
  melbourne: 'MEL',
  dublin: 'DUB',
  edinburgh: 'EDI',
  lisbon: 'LIS',
  madrid: 'MAD',
  berlin: 'BER',
  munich: 'MUC',
  copenhagen: 'CPH',
  stockholm: 'ARN',
  oslo: 'OSL',
  reykjavik: 'KEF',
  marrakech: 'RAK',
  auckland: 'AKL',
  buenos_aires: 'EZE',
  'buenos aires': 'EZE',
  phuket: 'HKT',
  hanoi: 'HAN',
  doha: 'DOH',
  abu_dhabi: 'AUH',
  'abu dhabi': 'AUH',
  maldives: 'MLE',
  mauritius: 'MRU',
};

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const fromIataParam = (searchParams.get('from') || 'MAA').toUpperCase();
  const toParam = searchParams.get('to') || 'd0000000-0000-0000-0000-000000000001';
  const destNameParam = searchParams.get('destName') || 'Goa';
  const departDateParam = searchParams.get('depart') || '';
  const returnDateParam = searchParams.get('return') || '';
  const cabinParam = (searchParams.get('cabin') || 'economy') as 'economy' | 'premium_economy' | 'business';
  const tripType = searchParams.get('type') || 'holiday';
  const tabParam = searchParams.get('tab') as 'places' | 'flights' | 'stays' | 'events' | null;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'places' | 'flights' | 'stays' | 'events'>(
    tabParam && ['places', 'flights', 'stays', 'events'].includes(tabParam) ? tabParam : 'places'
  );

  // Discovery State
  const [destination, setDestination] = useState<DestinationResponse | null>(null);
  const [places, setPlaces] = useState<PlaceResponse[]>([]);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for Places Tab
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('rank');

  // Flight Route Search State
  const [flightOrigin, setFlightOrigin] = useState<string>(fromIataParam);
  const [flightDest, setFlightDest] = useState<string>('GOI');
  const [flightDate, setFlightDate] = useState<string>(
    departDateParam || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [flightCabin, setFlightCabin] = useState<'economy' | 'premium_economy' | 'business'>(cabinParam);

  // Flights State
  const [flightData, setFlightData] = useState<FlightSearchResponse | null>(null);
  const [flightLoading, setFlightLoading] = useState(false);
  const [flightError, setFlightError] = useState<string | null>(null);

  // Flight Filters State
  const [flightFilters, setFlightFilters] = useState<FlightFilterState>({
    sortBy: 'best_value',
    stops: 'all',
    selectedAirlines: [],
    timeWindow: 'all',
    provider: 'all',
    maxPrice: 35000,
  });

  // Hotel Stays State
  const [hotels, setHotels] = useState<HotelResponse[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [hotelsError, setHotelsError] = useState<string | null>(null);
  const [hotelFilters, setHotelFilters] = useState<HotelFilterState>({
    sortBy: 'index',
    minIndex: 0,
    maxPrice: 25000,
    category: 'all',
  });

  // Modal State
  const [bookingOffer, setBookingOffer] = useState<FlightOffer | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { trip, addItem } = useTripStore();

  // Load Destination and Place Discovery Data
  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      setError(null);
      try {
        let resolvedDestId = toParam;
        if (!toParam.includes('-')) {
          const dests = await apiClient<DestinationResponse[]>(`/destinations/search?q=${encodeURIComponent(destNameParam)}`);
          if (dests.length > 0) {
            resolvedDestId = dests[0].id;
          }
        }

        const [destData, placesData, weatherData, eventsData] = await Promise.all([
          apiClient<DestinationResponse>(`/destinations/${resolvedDestId}`),
          apiClient<PlaceResponse[]>(`/destinations/${resolvedDestId}/places?sort=${sortBy}${categoryFilter !== 'all' ? `&category=${categoryFilter}` : ''}&min_rating=${minRatingFilter}`),
          apiClient<WeatherResponse>(`/destinations/${resolvedDestId}/weather`),
          apiClient<EventResponse[]>(`/destinations/${resolvedDestId}/events?from=${departDateParam}&to=${returnDateParam}`),
        ]);

        setDestination(destData);
        setPlaces(placesData);
        setWeather(weatherData);
        setEvents(eventsData);

        // Resolve Destination IATA
        let destIata = 'GOI';
        if (destData.iata_codes && destData.iata_codes.length > 0) {
          destIata = destData.iata_codes[0];
        } else {
          const normName = (destData.name || destNameParam).toLowerCase().replace(/\s+/g, '_');
          destIata = CITY_TO_IATA[normName] || 'GOI';
        }
        setFlightDest(destIata);

      } catch (err: any) {
        setError(err.message || 'Unable to retrieve destination discovery results.');
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [toParam, destNameParam, departDateParam, returnDateParam, categoryFilter, minRatingFilter, sortBy]);

  // Fetch Flights whenever activeTab is 'flights' or flight inputs change
  const searchFlights = async (orig?: string, dest?: string, dateStr?: string, cabinStr?: string) => {
    const o = orig || flightOrigin;
    const d = dest || flightDest;
    const dt = dateStr || flightDate;
    const c = cabinStr || flightCabin;

    if (!o || !d || !dt) return;

    setFlightLoading(true);
    setFlightError(null);
    try {
      const res = await apiClient.post<FlightSearchResponse>('/flights/search', {
        origin_iata: o.toUpperCase(),
        destination_iata: d.toUpperCase(),
        departure_date: dt,
        cabin: c,
        adults: 1,
        children: 0,
        infants: 0
      });

      setFlightData(res);
      if (res.highest_price_inr > 0) {
        setFlightFilters(prev => ({
          ...prev,
          maxPrice: Math.max(prev.maxPrice, res.highest_price_inr)
        }));
      }
    } catch (err: any) {
      setFlightError(err.message || 'Failed to search multi-provider flight offers.');
    } finally {
      setFlightLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'flights' && (!flightData || flightDest)) {
      searchFlights();
    }
  }, [activeTab, flightDest]);

  // Basket state for AddToTrip modal
  const [basketItem, setBasketItem] = useState<StagedItemToAdd | null>(null);
  const [isBasketOpen, setIsBasketOpen] = useState(false);

  const handleOpenBasket = (item: StagedItemToAdd) => {
    setBasketItem(item);
    setIsBasketOpen(true);
  };

  // Handle Toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Attach flight to active trip or open trip basket modal
  const handleAddToTrip = async (offer: FlightOffer, bookingResp?: FlightBookingResponse) => {
    const flightTitle = `Flight: ${offer.airline_name} (${offer.flight_number}) ${offer.origin_iata} → ${offer.destination_iata}`;
    const departureTimeOnly = offer.departure_time.includes('T')
      ? offer.departure_time.split('T')[1].substring(0, 5)
      : offer.departure_time;

    // Cache in local storage for instant access
    localStorage.setItem('tripwise_selected_flight', JSON.stringify({
      offer,
      booking: bookingResp || null,
      added_at: new Date().toISOString()
    }));

    handleOpenBasket({
      type: 'flight',
      title: flightTitle,
      cost_estimate: offer.price_inr,
      duration_minutes: offer.duration_minutes || 180,
      notes: bookingResp 
        ? `Duffel Sandbox PNR: ${bookingResp.booking_reference}. Order: ${bookingResp.order_id}`
        : `Carrier Offer: ${offer.provider.toUpperCase()}. Cabin: ${offer.cabin_class}. Baggage: ${offer.baggage_checked_kg}kg check-in.`,
      destination_id: destination?.id || toParam,
      destination_name: destination?.name || destNameParam
    });
  };

  // Fetch verified hotels with Bayesian TripWise Index
  const fetchHotels = async (destId?: string) => {
    const dId = destId || destination?.id || toParam;
    if (!dId) return;

    setHotelsLoading(true);
    setHotelsError(null);
    try {
      const data = await apiClient<HotelResponse[]>(
        `/destinations/${dId}/hotels?sort=${hotelFilters.sortBy}&min_index=${hotelFilters.minIndex}`
      );
      setHotels(data);
      if (data.length > 0) {
        const highestPrice = Math.max(...data.map(h => h.total_price_inr));
        setHotelFilters(prev => ({
          ...prev,
          maxPrice: Math.max(prev.maxPrice, highestPrice)
        }));
      }
    } catch (err: any) {
      setHotelsError(err.message || 'Unable to retrieve verified accommodations.');
    } finally {
      setHotelsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stays' || destination?.id) {
      fetchHotels();
    }
  }, [activeTab, destination?.id, hotelFilters.sortBy, hotelFilters.minIndex]);

  // Filtered hotels based on property style & budget
  const filteredHotels = useMemo(() => {
    let list = [...hotels];
    if (hotelFilters.category !== 'all') {
      list = list.filter(h => h.category === hotelFilters.category);
    }
    list = list.filter(h => h.total_price_inr <= hotelFilters.maxPrice);
    return list;
  }, [hotels, hotelFilters]);

  // Attach stay to trip basket
  const handleAttachStayToTrip = async (hotel: HotelResponse) => {
    localStorage.setItem('tripwise_selected_hotel', JSON.stringify({
      hotel,
      added_at: new Date().toISOString()
    }));

    handleOpenBasket({
      type: 'hotel',
      title: `Stay: ${hotel.name}`,
      cost_estimate: hotel.total_price_inr,
      duration_minutes: 720,
      ref_table: 'hotels',
      ref_id: hotel.id,
      lat: hotel.lat,
      lng: hotel.lng,
      notes: `TripWise Index: ${hotel.tripwise_index}/100. Category: ${hotel.category}. Address: ${hotel.address}`,
      destination_id: destination?.id || toParam,
      destination_name: destination?.name || destNameParam
    });
  };

  // Derive unique airlines from flight data
  const availableAirlines = useMemo(() => {
    if (!flightData?.offers) return [];
    const map = new Map<string, { code: string; name: string; count: number; color?: string }>();
    flightData.offers.forEach(o => {
      const existing = map.get(o.airline_code);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(o.airline_code, {
          code: o.airline_code,
          name: o.airline_name,
          count: 1,
          color: o.airline_color
        });
      }
    });
    return Array.from(map.values());
  }, [flightData]);

  // Filter and sort flight offers
  const filteredOffers = useMemo(() => {
    if (!flightData?.offers) return [];

    let list = [...flightData.offers];

    // 1. Stops filter
    if (flightFilters.stops === '0') {
      list = list.filter(o => o.stops === 0);
    } else if (flightFilters.stops === '1') {
      list = list.filter(o => o.stops <= 1);
    }

    // 2. Airline filter
    if (flightFilters.selectedAirlines.length > 0) {
      list = list.filter(o => flightFilters.selectedAirlines.includes(o.airline_code));
    }

    // 3. Provider filter
    if (flightFilters.provider !== 'all') {
      list = list.filter(o => o.provider.toLowerCase() === flightFilters.provider);
    }

    // 4. Departure Time Window
    if (flightFilters.timeWindow !== 'all') {
      list = list.filter(o => {
        let hour = 10;
        try {
          if (o.departure_time.includes('T')) {
            hour = parseInt(o.departure_time.split('T')[1].split(':')[0], 10);
          } else if (o.departure_time.includes(':')) {
            hour = parseInt(o.departure_time.split(':')[0], 10);
          }
        } catch {}

        if (flightFilters.timeWindow === 'early') return hour >= 0 && hour < 6;
        if (flightFilters.timeWindow === 'morning') return hour >= 6 && hour < 12;
        if (flightFilters.timeWindow === 'afternoon') return hour >= 12 && hour < 18;
        if (flightFilters.timeWindow === 'evening') return hour >= 18 && hour < 24;
        return true;
      });
    }

    // 5. Max Price
    list = list.filter(o => o.price_inr <= flightFilters.maxPrice);

    // 6. Sorting
    list.sort((a, b) => {
      if (flightFilters.sortBy === 'best_value') {
        if (a.is_best_value && !b.is_best_value) return -1;
        if (!a.is_best_value && b.is_best_value) return 1;
        return a.price_inr - b.price_inr;
      }
      if (flightFilters.sortBy === 'price_asc') {
        return a.price_inr - b.price_inr;
      }
      if (flightFilters.sortBy === 'duration_asc') {
        return a.duration_minutes - b.duration_minutes;
      }
      if (flightFilters.sortBy === 'departure_asc') {
        return a.departure_time.localeCompare(b.departure_time);
      }
      return 0;
    });

    return list;
  }, [flightData, flightFilters]);

  const clearAllPlaceFilters = () => {
    setCategoryFilter('all');
    setMinRatingFilter(0);
    setSortBy('rank');
  };

  const hasActivePlaceFilters = categoryFilter !== 'all' || minRatingFilter > 0 || sortBy !== 'rank';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[var(--primary)] text-[#FDFBD4] shadow-2xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Search Header Strip */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
            <Link to="/" className="hover:text-[var(--primary)] transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Modify Route</span>
            </Link>
            <span>•</span>
            <span className="capitalize">{tripType} Pace</span>
            <span>•</span>
            <span className="capitalize">{flightCabin.replace('_', ' ')}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)]">
            {flightOrigin} <span className="text-[var(--primary)]">→</span> {destination ? destination.name : destNameParam} ({flightDest})
          </h1>

          <p className="text-xs text-[var(--text-muted)] font-mono">
            Departing: {flightDate} {returnDateParam ? `• Returning: ${returnDateParam}` : '• One-Way'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {destination && (
            <Link to={`/destination/${destination.id}`}>
              <Button variant="secondary" size="sm">
                Destination Guide
              </Button>
            </Link>
          )}
          <Link to={`/trip/new?dest=${destination?.id || toParam}&title=${encodeURIComponent(`${destination?.name || destNameParam} Trip`)}`}>
            <Button size="sm" className="gap-1.5">
              <span>Planner Board</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Weather Strip for Trip Dates */}
      {weather && <WeatherStrip weather={weather} />}

      {/* Navigation Tabs (Flights, Places, Stays, Events) */}
      <div className="border-b border-[var(--border)] flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('places')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'places'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Places & Attractions ({places.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('flights')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'flights'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Plane className="w-4 h-4" />
          <span>Flight Comparison Engine {flightData?.total_offers ? `(${flightData.total_offers})` : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stays')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'stays'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Stays & TripWise Index {hotels.length ? `(${hotels.length})` : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'events'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Local Festivals ({events.length})</span>
        </button>
      </div>

      {/* TAB 1: PLACES */}
      {activeTab === 'places' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5 mr-1">
                <Filter className="w-3.5 h-3.5 text-[var(--primary)]" />
                Category:
              </span>
              {[
                { key: 'all', label: 'All' },
                { key: 'monument', label: 'Monuments' },
                { key: 'museum', label: 'Museums' },
                { key: 'temple', label: 'Temples' },
                { key: 'nature', label: 'Nature' },
              ].map(({ key, label }) => (
                <Chip
                  key={key}
                  active={categoryFilter === key}
                  onClick={() => setCategoryFilter(key)}
                >
                  {label}
                </Chip>
              ))}

              {hasActivePlaceFilters && (
                <button
                  type="button"
                  onClick={clearAllPlaceFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[var(--primary)] hover:underline ml-2"
                >
                  <X className="w-3 h-3" />
                  <span>Clear filters</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--text-muted)]">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-8 px-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="rank">Popularity Rank</option>
                <option value="rating">Rating (High to Low)</option>
                <option value="duration">Visit Duration</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-2xl" />
              ))}
            </div>
          ) : places.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-3 max-w-md mx-auto shadow-xs">
              <p className="text-sm font-bold text-[var(--text)]">No places match your active filters</p>
              <p className="text-xs text-[var(--text-muted)]">
                Try expanding your rating range or switching back to all categories.
              </p>
              <Button variant="secondary" size="sm" onClick={clearAllPlaceFilters}>
                Reset All Filters
              </Button>
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
                      destination_id: destination?.id || toParam,
                      destination_name: destination?.name || destNameParam
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FLIGHTS COMPARISON ENGINE */}
      {activeTab === 'flights' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Quick Route Modifier Strip */}
          <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[var(--text-muted)] uppercase">From:</span>
                <input
                  type="text"
                  maxLength={3}
                  value={flightOrigin}
                  onChange={(e) => setFlightOrigin(e.target.value.toUpperCase())}
                  className="w-16 h-8 px-2 uppercase font-mono font-bold text-center bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[var(--text-muted)] uppercase">To:</span>
                <input
                  type="text"
                  maxLength={3}
                  value={flightDest}
                  onChange={(e) => setFlightDest(e.target.value.toUpperCase())}
                  className="w-16 h-8 px-2 uppercase font-mono font-bold text-center bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[var(--text-muted)] uppercase">Date:</span>
                <input
                  type="date"
                  value={flightDate}
                  onChange={(e) => setFlightDate(e.target.value)}
                  className="h-8 px-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[var(--text-muted)] uppercase">Cabin:</span>
                <select
                  value={flightCabin}
                  onChange={(e) => setFlightCabin(e.target.value as any)}
                  className="h-8 px-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)]"
                >
                  <option value="economy">Economy</option>
                  <option value="premium_economy">Prem. Economy</option>
                  <option value="business">Business</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => searchFlights()}
              disabled={flightLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[var(--primary)] text-[#FDFBD4] rounded-xl hover:bg-[var(--primary-strong)] disabled:opacity-50 transition-all shadow-xs"
            >
              {flightLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching Multi-Provider...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Refresh Fares</span>
                </>
              )}
            </button>
          </div>

          {/* Comparison View Summary Cards */}
          {flightData && flightData.offers.length > 0 && (
            <FlightComparisonView
              offers={flightData.offers}
              cheapestPrice={flightData.cheapest_price_inr}
              highestPrice={flightData.highest_price_inr}
              maxSavingsPct={flightData.max_savings_percentage}
              providers={flightData.providers_queried}
              onSelectOffer={(offer) => setBookingOffer(offer)}
            />
          )}

          {/* Filters Bar */}
          {flightData && flightData.offers.length > 0 && (
            <FlightFilters
              filters={flightFilters}
              onFilterChange={setFlightFilters}
              availableAirlines={availableAirlines}
              minPrice={flightData.cheapest_price_inr}
              maxPrice={flightData.highest_price_inr}
              totalResultsCount={flightData.total_offers}
              filteredResultsCount={filteredOffers.length}
              onReset={() =>
                setFlightFilters({
                  sortBy: 'best_value',
                  stops: 'all',
                  selectedAirlines: [],
                  timeWindow: 'all',
                  provider: 'all',
                  maxPrice: flightData.highest_price_inr || 35000,
                })
              }
            />
          )}

          {/* Results List */}
          {flightLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-44 w-full rounded-2xl" />
              ))}
            </div>
          ) : flightError ? (
            <div className="p-8 text-center rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-3">
              <AlertCircle className="w-8 h-8 text-[var(--primary)] mx-auto" />
              <h4 className="text-sm font-bold text-[var(--text)]">Unable to fetch aviation offers</h4>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">{flightError}</p>
              <Button size="sm" onClick={() => searchFlights()}>Retry Search</Button>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-3">
              <Plane className="w-8 h-8 text-[var(--primary)] mx-auto" />
              <h4 className="text-sm font-bold text-[var(--text)]">No flight offers match active filters</h4>
              <p className="text-xs text-[var(--text-muted)]">
                Try resetting your stops, budget, or airline filter options.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setFlightFilters({
                    sortBy: 'best_value',
                    stops: 'all',
                    selectedAirlines: [],
                    timeWindow: 'all',
                    provider: 'all',
                    maxPrice: flightData?.highest_price_inr || 35000,
                  })
                }
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOffers.map((offer) => (
                <FlightCard
                  key={offer.id}
                  offer={offer}
                  onBookSandbox={(selected) => setBookingOffer(selected)}
                  onAddToTrip={(selected) => handleAddToTrip(selected)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STAYS & TRIPWISE HOTEL INDEX ENGINE */}
      {activeTab === 'stays' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Transparent Index Explanation Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </span>
                <h3 className="text-sm font-bold text-[var(--text)]">
                  TripWise Hotel Index (0 - 100)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Zero Sponsored Slots
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] max-w-2xl leading-relaxed">
                Objective Bayesian ranking calculated across 5 verified components: <strong className="text-[var(--text)]">Location (30%)</strong>, <strong className="text-[var(--text)]">Cleanliness (25%)</strong>, <strong className="text-[var(--text)]">Value (20%)</strong>, <strong className="text-[var(--text)]">Amenities (15%)</strong>, and <strong className="text-[var(--text)]">Quietness (10%)</strong>. No property can pay or bid to manipulate rankings.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0 text-xs">
              <button
                onClick={() => fetchHotels()}
                disabled={hotelsLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[var(--primary)] text-[#FDFBD4] rounded-xl hover:bg-[var(--primary-strong)] disabled:opacity-50 transition-all shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${hotelsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Stays</span>
              </button>
            </div>
          </div>

          {/* Hotel Filters */}
          {hotels.length > 0 && (
            <HotelFilters
              filters={hotelFilters}
              onFilterChange={setHotelFilters}
              minPrice={Math.min(...hotels.map(h => h.total_price_inr))}
              maxPrice={Math.max(...hotels.map(h => h.total_price_inr))}
              totalCount={hotels.length}
              filteredCount={filteredHotels.length}
              onReset={() =>
                setHotelFilters({
                  sortBy: 'index',
                  minIndex: 0,
                  maxPrice: Math.max(...hotels.map(h => h.total_price_inr)),
                  category: 'all',
                })
              }
            />
          )}

          {/* Results List */}
          {hotelsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-56 w-full rounded-2xl" />
              ))}
            </div>
          ) : hotelsError ? (
            <div className="p-8 text-center rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-3 shadow-xs">
              <AlertCircle className="w-8 h-8 text-[var(--primary)] mx-auto" />
              <h4 className="text-sm font-bold text-[var(--text)]">Unable to fetch hotel stays</h4>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">{hotelsError}</p>
              <Button size="sm" onClick={() => fetchHotels()}>Retry Stays</Button>
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-3 shadow-xs">
              <Building className="w-8 h-8 text-[var(--primary)] mx-auto" />
              <h4 className="text-sm font-bold text-[var(--text)]">No accommodations match your active filters</h4>
              <p className="text-xs text-[var(--text-muted)]">
                Try lowering the minimum TripWise Index or expanding your budget range.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setHotelFilters({
                    sortBy: 'index',
                    minIndex: 0,
                    maxPrice: 35000,
                    category: 'all',
                  })
                }
              >
                Reset Hotel Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  onAddToTrip={handleAttachStayToTrip}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EVENTS */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <FestivalBanner events={events} />
        </div>
      )}

      {/* Duffel Sandbox Booking Modal */}
      <FlightBookingModal
        offer={bookingOffer}
        isOpen={!!bookingOffer}
        onClose={() => setBookingOffer(null)}
        onAddToTrip={(offer, booking) => handleAddToTrip(offer, booking)}
      />

      {/* Add To Trip Basket Modal */}
      <AddToTripModal
        item={basketItem}
        isOpen={isBasketOpen}
        onClose={() => setIsBasketOpen(false)}
      />
    </div>
  );
};
