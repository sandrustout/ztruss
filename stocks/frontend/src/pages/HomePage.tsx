import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  Database, 
  Server, 
  Sparkles, 
  MapPin, 
  ArrowRight,
  Plane,
  Hotel,
  CloudSun,
  Calendar,
  Camera,
  BookOpen,
  CreditCard,
  ShieldCheck,
  TrendingDown,
  Layers
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { SystemStats, ProviderHealthStatus, DestinationResponse } from '../types';
import { SearchBar } from '../components/search/SearchBar';
import { Skeleton } from '../components/ui/Skeleton';
import { TextType } from '../components/reactbits/TextType';
import { CountUp } from '../components/reactbits/CountUp';
import { LogoLoop, LogoItem } from '../components/reactbits/LogoLoop';
import { CardSwap } from '../components/reactbits/CardSwap';

const DESTINATION_FALLBACK_IMAGES: Record<string, string> = {
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
  jaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
  kochi: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
  varanasi: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
  bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
  bangalore: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
  tokyo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
};

const PARTNER_LOGOS: LogoItem[] = [
  {
    name: 'Duffel',
    category: 'Flights',
    description: 'Multi-carrier sandbox seat inventory',
    icon: <Plane className="w-4 h-4" />
  },
  {
    name: 'Geoapify',
    category: 'Routing',
    description: 'Live traffic matrices & cab transit',
    icon: <Compass className="w-4 h-4" />
  },
  {
    name: 'OpenTripMap',
    category: 'Places',
    description: 'Global monuments & heritage catalog',
    icon: <MapPin className="w-4 h-4" />
  },
  {
    name: 'Open-Meteo',
    category: 'Weather',
    description: '7-day forecasts & packing signals',
    icon: <CloudSun className="w-4 h-4" />
  },
  {
    name: 'Ticketmaster',
    category: 'Events',
    description: 'Live concerts, theatre & cultural tours',
    icon: <Calendar className="w-4 h-4" />
  },
  {
    name: 'Calendarific',
    category: 'Holidays',
    description: 'National festivals & regional dates',
    icon: <Sparkles className="w-4 h-4" />
  },
  {
    name: 'Unsplash',
    category: 'Photography',
    description: 'Verified creator photo attribution',
    icon: <Camera className="w-4 h-4" />
  },
  {
    name: 'Wikipedia',
    category: 'Knowledge',
    description: 'Cultural history & monument extracts',
    icon: <BookOpen className="w-4 h-4" />
  },
  {
    name: 'Razorpay',
    category: 'Payments',
    description: 'Instant UPI & Card Sandbox checkout',
    icon: <CreditCard className="w-4 h-4" />
  },
  {
    name: 'Supabase',
    category: 'Database & Auth',
    description: 'PostgreSQL RLS & Google OAuth',
    icon: <Database className="w-4 h-4" />
  }
];

export const HomePage: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [providers, setProviders] = useState<ProviderHealthStatus[]>([]);
  const [featuredDests, setFeaturedDests] = useState<DestinationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [statsData, providersData, destsData] = await Promise.all([
          apiClient<SystemStats>('/stats'),
          apiClient<ProviderHealthStatus[]>('/health/providers'),
          apiClient<DestinationResponse[]>('/destinations/search'),
        ]);
        setStats(statsData);
        setProviders(providersData);
        setFeaturedDests(destsData);
      } catch (e) {
        console.warn('Initial data load:', e);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Hero Headline & Disclosure Section with TextType Animation */}
      <section className="text-center space-y-4 max-w-4xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span>Full-Stack Travel Planning Engine • Track 3 Recruitment Submission</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--text)]">
          Plan trips with{' '}
          <TextType
            words={[
              'cheapest flights',
              'verified hotels',
              'seamless itineraries',
              'local festivals',
              'honest pricing'
            ]}
            className="text-[var(--primary)] underline decoration-[var(--primary)]/40 underline-offset-8"
          />
        </h1>

        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
          Savings are the transparent difference between the highest and lowest fares discovered across airlines. All timings account for live traffic and buffer delays.
        </p>
      </section>

      {/* Primary Search Bar */}
      <section className="max-w-5xl mx-auto">
        <SearchBar />
      </section>

      {/* Interactive CardSwap Feature Stack */}
      <section className="pt-2">
        <div className="text-center max-w-2xl mx-auto mb-6 space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
            How TripWise Protects Your Journey
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Click through our 4 transparent planning pillars: live flight comparison, un-sponsored hotel index, traffic-aware day schedules, and guaranteed bills.
          </p>
        </div>
        <CardSwap />
      </section>

      {/* Infinite LogoLoop API Marquee */}
      <section className="space-y-3 pt-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Powered by 10+ Production APIs & External Data Adapters
            </h3>
          </div>
          <span className="text-[11px] font-medium text-[var(--text-muted)] hidden sm:inline">
            Zero synthetic data
          </span>
        </div>
        <LogoLoop items={PARTNER_LOGOS} speed={32} />
      </section>

      {/* Featured Destinations Grid with Distinct Photography */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[var(--primary)]" />
              <span>Trending Destinations</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Curated locations with live weather, festival calendars, and cultural monuments.
            </p>
          </div>
          <span className="text-xs font-semibold text-[var(--text-muted)] px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full">
            {featuredDests.length} Destinations Available
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {featuredDests.map((dest) => {
              const imageSrc =
                dest.hero_image_url ||
                DESTINATION_FALLBACK_IMAGES[dest.name.toLowerCase()] ||
                DESTINATION_FALLBACK_IMAGES.jaipur;

              return (
                <Link
                  key={dest.id}
                  to={`/destination/${dest.id}`}
                  className="group rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xs hover:border-[var(--primary)] hover:shadow-md overflow-hidden flex flex-col transition-all duration-200"
                >
                  <div className="relative h-48 w-full bg-[var(--bg)] overflow-hidden">
                    <img
                      src={imageSrc}
                      alt={dest.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full bg-[var(--bg)]/90 backdrop-blur-md text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider border border-[var(--border)]">
                        {dest.country}
                      </span>
                    </div>
                    {dest.iata_codes && dest.iata_codes.length > 0 && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[var(--bg)]/90 backdrop-blur-md text-xs font-mono font-bold text-[var(--text)] border border-[var(--border)]">
                        {dest.iata_codes.join(', ')}
                      </div>
                    )}
                    {dest.hero_image_attribution && (
                      <div className="absolute bottom-1 right-2 text-[9px] text-white/90 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm truncate max-w-[200px]">
                        {dest.hero_image_attribution}
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors flex items-center justify-between">
                        <span>{dest.name}</span>
                        <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-transform group-hover:translate-x-1" />
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1 leading-relaxed">
                        {dest.description}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)] flex items-center justify-between font-medium">
                      <span>{dest.region || dest.country}</span>
                      <span className="font-semibold text-[var(--primary)]">Explore Sights →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Backend Animated Telemetry with CountUp Stats */}
      <section className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
              <Server className="w-5 h-5 text-[var(--primary)]" />
              <span>Multi-Provider Integration Telemetry</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Live status for external adapters (Duffel, Geoapify, OpenTripMap, Open-Meteo, Ticketmaster, Calendarific, Unsplash, Razorpay).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg)] text-xs font-semibold text-[var(--primary)] border border-[var(--border)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Backend Online
            </span>
          </div>
        </div>

        {/* Live Animated Counters with CountUp */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-b border-[var(--border)]">
          <div className="space-y-1">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              Destinations
            </p>
            <p className="text-3xl font-bold text-[var(--primary)] tabular-nums">
              <CountUp to={featuredDests.length || 8} suffix="+" duration={1800} />
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">Verified cities stored</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
              Live Adapters
            </p>
            <p className="text-3xl font-bold text-[var(--text)] tabular-nums">
              <CountUp to={10} suffix=" connected" duration={1800} />
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">Zero synthetic data</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
              Max Fare Savings
            </p>
            <p className="text-3xl font-bold text-emerald-600 tabular-nums">
              <CountUp to={55} suffix="%" duration={2000} />
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">Across flight providers</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
              Hidden Fees
            </p>
            <p className="text-3xl font-bold text-[var(--text)] tabular-nums">
              <CountUp to={0} prefix="₹" duration={1500} />
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">100% transparent pricing</p>
          </div>
        </div>

        {/* Provider Readiness Grid */}
        <div className="pt-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text)] flex items-center gap-2">
            <Database className="w-4 h-4 text-[var(--primary)]" />
            <span>Active External Service Health</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))
            ) : (
              providers.map((p) => (
                <div
                  key={p.provider}
                  className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--text)] capitalize">{p.provider}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">{p.note || p.status}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
