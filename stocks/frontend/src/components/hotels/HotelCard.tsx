import React, { useState } from 'react';
import { 
  Building, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  IndianRupee,
  Plane,
  Wifi,
  Coffee,
  Waves,
  Car
} from 'lucide-react';
import { HotelResponse } from '../../types';

interface HotelCardProps {
  hotel: HotelResponse;
  onAddToTrip?: (hotel: HotelResponse) => void;
}

export const HotelCard: React.FC<HotelCardProps> = ({ hotel, onAddToTrip }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (onAddToTrip) {
      onAddToTrip(hotel);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    }
  };

  const formatCategory = (cat: string) => {
    return cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800';
    if (score >= 80) return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800';
    return 'text-[var(--primary)] bg-[var(--bg)] border-[var(--primary)]';
  };

  return (
    <div className="flex flex-col md:flex-row bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all group hover:border-[var(--primary)]">
      {/* Hotel Image & Attribution */}
      <div className="md:w-72 h-56 md:h-auto relative overflow-hidden bg-[var(--bg-subtle)] shrink-0">
        <img
          src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
          alt={hotel.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold tracking-wide uppercase">
            {formatCategory(hotel.category)}
          </span>
        </div>

        {hotel.image_author && (
          <div className="absolute bottom-2 left-2 right-2 text-[9px] text-white/80 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs truncate">
            {hotel.image_attribution || `Photo by ${hotel.image_author} on Unsplash`}
          </div>
        )}
      </div>

      {/* Main Content Info */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Header Row: Title & TripWise Index Badge */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="flex items-center text-amber-500 text-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span className="ml-1 font-bold">{hotel.star_rating.toFixed(1)}</span>
                </div>
                <span className="text-[var(--text-muted)] text-xs">•</span>
                <span className="text-xs text-[var(--text-muted)] font-mono">{hotel.review_count} verified reviews</span>
              </div>
              <h3 className="text-base font-bold text-[var(--text)] tracking-tight">
                {hotel.name}
              </h3>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                <span className="truncate">{hotel.address}</span>
              </p>
            </div>

            {/* TripWise Bayesian Index Badge */}
            <div className="flex flex-col items-end shrink-0">
              <div className={`px-2.5 py-1 rounded-xl border text-center font-black ${getScoreColor(hotel.tripwise_index)} shadow-xs`}>
                <span className="text-xs uppercase block font-semibold text-[9px] tracking-wider opacity-80">TripWise Index</span>
                <span className="text-base font-black tabular-nums">{hotel.tripwise_index.toFixed(1)}</span>
                <span className="text-[10px] opacity-75 font-normal"> / 100</span>
              </div>
              <span className="text-[9px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Zero Ads Rank</span>
              </span>
            </div>
          </div>

          {/* Distances & Nearest Attraction */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)] pt-1">
            <span className="flex items-center gap-1">
              <Plane className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>{hotel.distance_to_airport_km} km to airport</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>{hotel.distance_to_center_km} km to center</span>
            </span>
            {hotel.nearest_attraction_name && (
              <>
                <span>•</span>
                <span className="text-[var(--text)] font-medium">Near {hotel.nearest_attraction_name}</span>
              </>
            )}
          </div>

          {/* Amenities Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {hotel.amenities.slice(0, 4).map((amenity, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[11px] font-medium text-[var(--text-muted)]"
              >
                {amenity}
              </span>
            ))}
            {hotel.amenities.length > 4 && (
              <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-semibold text-[var(--primary)]">
                +{hotel.amenities.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Actions Row */}
        <div className="pt-3 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Transparent Rate Breakdown */}
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1 font-bold text-lg text-[var(--text)] tabular-nums">
              <IndianRupee className="w-4 h-4 text-[var(--primary)] self-center" />
              <span>{hotel.total_price_inr.toLocaleString('en-IN')}</span>
              <span className="text-xs text-[var(--text-muted)] font-normal"> / night total</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              ₹{hotel.price_per_night_inr.toLocaleString('en-IN')} room + ₹{hotel.taxes_and_fees_inr.toLocaleString('en-IN')} taxes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Index Math</span>
              {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {onAddToTrip && (
              <button
                onClick={handleAdd}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs ${
                  added
                    ? 'bg-emerald-600 text-[#FDFBD4]'
                    : 'bg-[var(--primary)] text-[#FDFBD4] hover:bg-[var(--primary-strong)]'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added to Trip!</span>
                  </>
                ) : (
                  <>
                    <Building className="w-3.5 h-3.5" />
                    <span>Add to Trip</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Expandable Mathematical Breakdown */}
        {showBreakdown && (
          <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs space-y-3 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <span className="font-bold text-[var(--text)] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>TripWise Bayesian Index Proof (0-100)</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-600">
                100% Organic Rank
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">Location (30%)</span>
                <span className="font-bold text-[var(--text)] text-sm">{hotel.location_score.toFixed(1)}</span>
                <span className="text-[9px] text-[var(--text-muted)] block">/ 10</span>
              </div>
              <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">Cleanliness (25%)</span>
                <span className="font-bold text-[var(--text)] text-sm">{hotel.cleanliness_score.toFixed(1)}</span>
                <span className="text-[9px] text-[var(--text-muted)] block">/ 10</span>
              </div>
              <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">Value (20%)</span>
                <span className="font-bold text-[var(--text)] text-sm">{hotel.value_score.toFixed(1)}</span>
                <span className="text-[9px] text-[var(--text-muted)] block">/ 10</span>
              </div>
              <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">Amenities (15%)</span>
                <span className="font-bold text-[var(--text)] text-sm">{hotel.amenities_score.toFixed(1)}</span>
                <span className="text-[9px] text-[var(--text-muted)] block">/ 10</span>
              </div>
              <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">Quietness (10%)</span>
                <span className="font-bold text-[var(--text)] text-sm">{hotel.quietness_score.toFixed(1)}</span>
                <span className="text-[9px] text-[var(--text-muted)] block">/ 10</span>
              </div>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Calculated using Bayesian shrinkage with prior mean <strong className="text-[var(--text)]">8.0</strong> across {hotel.review_count} verified guest stays. Anti-sponsored guarantee: this property cannot pay to rank higher.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
