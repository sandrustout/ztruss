export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  home_airport: string;
  currency: string;
  theme: ThemeMode;
  preferred_day_start: string;
  travel_style: 'relaxed' | 'balanced' | 'packed' | 'fast';
  dietary_prefs: string[];
  accessibility_needs: string[];
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  type?: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details: ApiErrorDetail[];
  };
  request_id: string;
}

export interface SystemStats {
  destinations_count: number;
  providers_compared: number;
  trips_planned: number;
}

export interface ProviderHealthStatus {
  provider: string;
  configured: boolean;
  status: 'healthy' | 'unconfigured' | 'degraded';
  latency_ms?: number;
  note?: string;
}

export interface AirportInfo {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export interface DestinationResponse {
  id: string;
  name: string;
  country: string;
  region?: string;
  lat: number;
  lng: number;
  iata_codes: string[];
  timezone?: string;
  description?: string;
  wiki_title?: string;
  hero_image_url?: string;
  hero_image_author?: string;
  hero_image_attribution?: string;
}

export interface PlaceResponse {
  id: string;
  destination_id: string;
  external_id?: string;
  source: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  description?: string;
  rating: number;
  rate_score: number;
  wiki_title?: string;
  hours_json?: Record<string, any>;
  fee_text?: string;
  typical_duration_minutes: number;
  image_url?: string;
  image_author?: string;
  image_attribution?: string;
  why_recommended?: string[];
}

export interface WeatherForecastDay {
  date: string;
  temp_max_c: number;
  temp_min_c: number;
  precipitation_prob: number;
  condition: string;
  icon: string;
}

export interface WeatherResponse {
  summary: string;
  days: WeatherForecastDay[];
  packing_suggestions: string[];
}

export interface EventResponse {
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  source: string;
  source_url?: string;
  impact_level: string;
  closure_risk: boolean;
  description?: string;
}

export interface DishResponse {
  id: string;
  destination_id: string;
  name: string;
  description?: string;
  dietary_tags: string[];
  source_note: string;
  source_url?: string;
}

export interface TripItem {
  id: string;
  trip_id: string;
  type: 'place' | 'hotel' | 'restaurant' | 'flight' | 'cab' | 'event' | 'note';
  day_index: number;
  order_index: number;
  ref_table?: string;
  ref_id?: string;
  title: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  travel_minutes_from_prev: number;
  travel_mode: 'walk' | 'cab' | 'transit' | 'drive';
  travel_source: 'live' | 'estimate';
  notes?: string;
  cost_estimate: number;
  cost_is_estimate: boolean;
  lat?: number;
  lng?: number;
  locked: boolean;
  version: number;
}

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  status: 'draft' | 'planned' | 'booked' | 'completed' | 'cancelled';
  origin_iata: string;
  destination_id: string;
  start_date: string;
  end_date: string;
  trip_type: 'holiday' | 'vacation' | 'honeymoon' | 'trip';
  travellers_json: { adults: number; children: number; infants: number };
  cabin: 'economy' | 'premium_economy' | 'business';
  budget?: number;
  currency: string;
  is_public: boolean;
  share_token?: string;
  version: number;
  created_at: string;
  updated_at: string;
  items: TripItem[];
}

export interface OptimiseDayResponse {
  day_index: number;
  before_travel_minutes: number;
  after_travel_minutes: number;
  saved_minutes: number;
  items: TripItem[];
}

export interface FlightOffer {
  id: string;
  provider: string;
  airline_name: string;
  airline_code: string;
  airline_color?: string;
  airline_type?: string;
  flight_number: string;
  origin_iata: string;
  origin_city: string;
  destination_iata: string;
  destination_city: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  stops: number;
  stopover_airports: string[];
  cabin_class: string;
  price_inr: number;
  base_fare_inr: number;
  taxes_inr: number;
  convenience_fee: number;
  currency: string;
  baggage_cabin_kg: number;
  baggage_checked_kg: number;
  carbon_kg: number;
  is_cheapest: boolean;
  is_fastest: boolean;
  is_best_value: boolean;
  savings_pct_vs_highest: number;
  duffel_offer_id?: string;
  duffel_passenger_id?: string;
}

export interface FlightSearchResponse {
  offers: FlightOffer[];
  total_offers: number;
  cheapest_price_inr: number;
  highest_price_inr: number;
  max_savings_percentage: number;
  route_summary: string;
  providers_queried: string[];
}

export interface PassengerDetails {
  title: 'mr' | 'mrs' | 'ms';
  given_name: string;
  family_name: string;
  born_on: string;
  gender: 'm' | 'f';
  email: string;
  phone: string;
}

export interface FlightBookingResponse {
  booking_reference: string;
  order_id: string;
  status: string;
  airline_name: string;
  flight_number: string;
  route: string;
  departure_time: string;
  amount_paid_inr: number;
  currency: string;
  documents: Array<{ type: string; number: string }>;
  confirmation_message: string;
}

export interface HotelResponse {
  id: string;
  destination_id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address: string;
  distance_to_airport_km: number;
  distance_to_center_km: number;
  nearest_attraction_name?: string;
  nearest_attraction_distance_km: number;
  star_rating: number;
  price_per_night_inr: number;
  taxes_and_fees_inr: number;
  total_price_inr: number;
  location_score: number;
  cleanliness_score: number;
  value_score: number;
  amenities_score: number;
  quietness_score: number;
  tripwise_index: number;
  review_count: number;
  amenities: string[];
  image_url?: string;
  image_author?: string;
  image_attribution?: string;
}

export interface HotelIndexBreakdown {
  hotel_id: string;
  hotel_name: string;
  final_tripwise_index: number;
  review_count: number;
  location_score: number;
  location_weight_pct: number;
  cleanliness_score: number;
  cleanliness_weight_pct: number;
  value_score: number;
  value_weight_pct: number;
  amenities_score: number;
  amenities_weight_pct: number;
  quietness_score: number;
  quietness_weight_pct: number;
  raw_weighted_score: number;
  bayesian_shrinkage_applied: boolean;
  bayesian_prior_mean: number;
  bayesian_confidence_param_m: number;
  anti_sponsored_slot_guarantee: string;
}

