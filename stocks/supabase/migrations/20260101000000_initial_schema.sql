-- TripWise Initial Schema Migration
-- Compatible with Supabase PostgreSQL and standard PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    home_airport VARCHAR(3) DEFAULT 'MAA',
    currency VARCHAR(3) DEFAULT 'INR',
    theme VARCHAR(10) DEFAULT 'system',
    preferred_day_start VARCHAR(5) DEFAULT '09:00',
    travel_style VARCHAR(20) DEFAULT 'balanced',
    dietary_prefs TEXT[] DEFAULT '{}',
    accessibility_needs TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. IMAGES (Curated & uploaded photography with licensing attribution)
CREATE TABLE IF NOT EXISTS public.images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    storage_path TEXT,
    public_url TEXT NOT NULL,
    source VARCHAR(50) NOT NULL,
    author TEXT,
    licence TEXT,
    attribution_text TEXT NOT NULL,
    width INT,
    height INT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. DESTINATIONS (Core destination directory)
CREATE TABLE IF NOT EXISTS public.destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    region TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    iata_codes TEXT[] DEFAULT '{}',
    timezone VARCHAR(50) DEFAULT 'UTC',
    description TEXT,
    wiki_title TEXT,
    hero_image_id UUID REFERENCES public.images(id) ON DELETE SET NULL,
    source VARCHAR(50) DEFAULT 'curated',
    fetched_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. PLACES (Monuments, attractions, nature, viewpoints)
CREATE TABLE IF NOT EXISTS public.places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
    external_id TEXT,
    source VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    description TEXT,
    rating DOUBLE PRECISION DEFAULT 4.0,
    rate_score DOUBLE PRECISION DEFAULT 0.0,
    wiki_title TEXT,
    hours_json JSONB,
    fee_text TEXT,
    typical_duration_minutes INT DEFAULT 90,
    image_id UUID REFERENCES public.images(id) ON DELETE SET NULL,
    fetched_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5. HOTELS (Accommodations with TripWise Index signals)
CREATE TABLE IF NOT EXISTS public.hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
    external_id TEXT,
    source VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    address TEXT,
    stars INT DEFAULT 3,
    rating DOUBLE PRECISION DEFAULT 4.0,
    review_count INT DEFAULT 50,
    amenities TEXT[] DEFAULT '{}',
    image_id UUID REFERENCES public.images(id) ON DELETE SET NULL,
    last_price DOUBLE PRECISION,
    currency VARCHAR(3) DEFAULT 'INR',
    price_is_estimate BOOLEAN DEFAULT FALSE,
    fetched_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. RESTAURANTS (Food recommendations)
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
    external_id TEXT,
    source VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    cuisine TEXT[] DEFAULT '{}',
    price_level VARCHAR(10) DEFAULT 'moderate',
    rating DOUBLE PRECISION DEFAULT 4.0,
    review_count INT DEFAULT 20,
    hours_json JSONB,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    image_id UUID REFERENCES public.images(id) ON DELETE SET NULL,
    fetched_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 7. DISHES (Editorial culinary specialties)
CREATE TABLE IF NOT EXISTS public.dishes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    dietary_tags TEXT[] DEFAULT '{}',
    source_note TEXT,
    source_url TEXT
);

-- 8. EVENTS & FESTIVALS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    source VARCHAR(50) NOT NULL,
    source_url TEXT,
    impact_level VARCHAR(20) DEFAULT 'low'
);

-- 9. TRIPS (User trip plans)
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'booked', 'completed', 'cancelled')),
    origin_iata VARCHAR(3) NOT NULL,
    destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    trip_type VARCHAR(20) DEFAULT 'holiday' CHECK (trip_type IN ('holiday', 'vacation', 'honeymoon', 'trip')),
    travellers_json JSONB DEFAULT '{"adults": 1, "children": 0, "infants": 0}'::jsonb,
    cabin VARCHAR(20) DEFAULT 'economy' CHECK (cabin IN ('economy', 'premium_economy', 'business')),
    budget DOUBLE PRECISION,
    currency VARCHAR(3) DEFAULT 'INR',
    share_token VARCHAR(64) UNIQUE,
    is_public BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 10. TRIP ITEMS (Scheduled itinerary stops)
CREATE TABLE IF NOT EXISTS public.trip_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('place', 'hotel', 'restaurant', 'flight', 'cab', 'event', 'note')),
    day_index INT NOT NULL DEFAULT 0,
    order_index INT NOT NULL DEFAULT 0,
    ref_table VARCHAR(50),
    ref_id UUID,
    title TEXT NOT NULL,
    start_time VARCHAR(5) DEFAULT '09:00',
    end_time VARCHAR(5) DEFAULT '10:30',
    duration_minutes INT DEFAULT 90,
    travel_minutes_from_prev INT DEFAULT 15,
    travel_mode VARCHAR(20) DEFAULT 'cab' CHECK (travel_mode IN ('walk', 'cab', 'transit', 'drive')),
    travel_source VARCHAR(20) DEFAULT 'estimate' CHECK (travel_source IN ('live', 'estimate')),
    notes TEXT,
    cost_estimate DOUBLE PRECISION DEFAULT 0.0,
    cost_is_estimate BOOLEAN DEFAULT TRUE,
    locked BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 1 NOT NULL
);

-- 11. FLIGHT SELECTIONS
CREATE TABLE IF NOT EXISTS public.flight_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('outbound', 'return')),
    provider VARCHAR(50) NOT NULL,
    offer_snapshot_json JSONB NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    cabin VARCHAR(20) DEFAULT 'economy',
    selected_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 12. HOTEL SELECTIONS
CREATE TABLE IF NOT EXISTS public.hotel_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE RESTRICT,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    rooms INT DEFAULT 1,
    price_snapshot DOUBLE PRECISION NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR'
);

-- 13. BILLS (Unpaid snapshot & invoice)
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    bill_number VARCHAR(32) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid_sandbox', 'expired')),
    line_items_json JSONB NOT NULL,
    subtotal DOUBLE PRECISION NOT NULL,
    taxes DOUBLE PRECISION NOT NULL,
    total DOUBLE PRECISION NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    price_snapshot_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 14. BOOKINGS (Sandbox payment flow orchestrations)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed_sandbox', 'failed', 'partial')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    idempotency_key VARCHAR(64) UNIQUE NOT NULL,
    items_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 15. PAST TRIPS (Travel journal and personal memory records)
CREATE TABLE IF NOT EXISTS public.past_trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    destination_name TEXT NOT NULL,
    country TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    travel_type VARCHAR(20) DEFAULT 'holiday',
    rating INT CHECK (rating BETWEEN 1 AND 5),
    journal_text TEXT,
    highlights TEXT[] DEFAULT '{}',
    photo_ids UUID[] DEFAULT '{}',
    spend_total DOUBLE PRECISION DEFAULT 0.0,
    currency VARCHAR(3) DEFAULT 'INR',
    would_return BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 16. FARE WATCHES
CREATE TABLE IF NOT EXISTS public.fare_watches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    depart_date DATE NOT NULL,
    cabin VARCHAR(20) DEFAULT 'economy',
    target_price DOUBLE PRECISION NOT NULL,
    last_seen_price DOUBLE PRECISION,
    last_checked_at TIMESTAMPTZ,
    active BOOLEAN DEFAULT TRUE
);

-- 17. SEARCH HISTORY (Up to 50 entries per user)
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    params_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 18. API CACHE (Server response cache for rate limit protection)
CREATE TABLE IF NOT EXISTS public.api_cache (
    key VARCHAR(255) PRIMARY KEY,
    payload_json JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_places_destination ON public.places(destination_id);
CREATE INDEX IF NOT EXISTS idx_places_category ON public.places(destination_id, category);
CREATE INDEX IF NOT EXISTS idx_hotels_destination ON public.hotels(destination_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_destination ON public.restaurants(destination_id);
CREATE INDEX IF NOT EXISTS idx_trips_user ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_items_order ON public.trip_items(trip_id, day_index, order_index);
CREATE INDEX IF NOT EXISTS idx_past_trips_user ON public.past_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_fare_watches_user ON public.fare_watches(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON public.search_history(user_id, created_at DESC);

-- TRIGGERS: auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_trips_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TRIGGER: automatically create profile on Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Traveller'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fare_watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Catalog tables have public read access
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read destinations" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Public read places" ON public.places FOR SELECT USING (true);
CREATE POLICY "Public read hotels" ON public.hotels FOR SELECT USING (true);
CREATE POLICY "Public read restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Public read dishes" ON public.dishes FOR SELECT USING (true);
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public read images" ON public.images FOR SELECT USING (true);

-- User table policies: Users can only read, insert, update, delete their own data
CREATE POLICY "Users manage own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users manage own trips" ON public.trips
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own trip items" ON public.trip_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_items.trip_id AND trips.user_id = auth.uid())
    );

CREATE POLICY "Users manage own flight selections" ON public.flight_selections
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.trips WHERE trips.id = flight_selections.trip_id AND trips.user_id = auth.uid())
    );

CREATE POLICY "Users manage own hotel selections" ON public.hotel_selections
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.trips WHERE trips.id = hotel_selections.trip_id AND trips.user_id = auth.uid())
    );

CREATE POLICY "Users manage own bills" ON public.bills
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.trips WHERE trips.id = bills.trip_id AND trips.user_id = auth.uid())
    );

CREATE POLICY "Users manage own bookings" ON public.bookings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.trips WHERE trips.id = bookings.trip_id AND trips.user_id = auth.uid())
    );

CREATE POLICY "Users manage own past trips" ON public.past_trips
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own fare watches" ON public.fare_watches
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own search history" ON public.search_history
    FOR ALL USING (auth.uid() = user_id);
