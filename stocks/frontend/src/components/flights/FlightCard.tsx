import React, { useState } from 'react';
import { 
  Plane, 
  Clock, 
  Briefcase, 
  Leaf, 
  IndianRupee, 
  ShieldCheck, 
  ArrowRight,
  TrendingDown,
  Sparkles,
  Info,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { FlightOffer } from '../../types';

interface FlightCardProps {
  offer: FlightOffer;
  onBookSandbox: (offer: FlightOffer) => void;
  onAddToTrip?: (offer: FlightOffer) => void;
}

export const FlightCard: React.FC<FlightCardProps> = ({
  offer,
  onBookSandbox,
  onAddToTrip
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [addedToTrip, setAddedToTrip] = useState(false);

  // Format departure & arrival times (HH:MM)
  const formatTime = (isoString: string) => {
    try {
      if (isoString.includes('T')) {
        const timePart = isoString.split('T')[1];
        return timePart.substring(0, 5);
      }
      return isoString;
    } catch {
      return isoString;
    }
  };

  const hours = Math.floor(offer.duration_minutes / 60);
  const mins = offer.duration_minutes % 60;
  const durationText = `${hours}h ${mins}m`;

  const handleAdd = () => {
    if (onAddToTrip) {
      onAddToTrip(offer);
      setAddedToTrip(true);
      setTimeout(() => setAddedToTrip(false), 2500);
    }
  };

  return (
    <div className="flex flex-col p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl hover:border-[var(--primary)] transition-all shadow-xs hover:shadow-md space-y-4">
      {/* Top Badges & Provider Info */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Airline Monogram Avatar */}
          <div 
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white font-bold text-xs shadow-xs"
            style={{ backgroundColor: offer.airline_color || '#713600' }}
          >
            {offer.airline_code}
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--text)] tracking-tight">
              {offer.airline_name}
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              {offer.flight_number} • {offer.cabin_class}
            </p>
          </div>
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {offer.is_cheapest && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Cheapest
            </span>
          )}
          {offer.is_fastest && (
            <span className="px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 text-[10px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
              Fastest
            </span>
          )}
          {offer.is_best_value && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--primary)] text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">
              Best Value
            </span>
          )}
          {offer.savings_pct_vs_highest > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/60 dark:bg-emerald-900/40 text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
              <TrendingDown className="w-3 h-3" />
              <span>Save {offer.savings_pct_vs_highest}%</span>
            </span>
          )}
          <span className="text-[10px] font-semibold text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--bg)] border border-[var(--border)] uppercase">
            {offer.provider}
          </span>
        </div>
      </div>

      {/* Flight Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 py-2 border-y border-[var(--border)]">
        {/* Departure */}
        <div className="space-y-0.5">
          <p className="text-xl font-bold text-[var(--text)] tabular-nums">
            {formatTime(offer.departure_time)}
          </p>
          <p className="text-xs font-semibold text-[var(--text)]">
            {offer.origin_iata}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] truncate">
            {offer.origin_city}
          </p>
        </div>

        {/* Flight Path Indicator */}
        <div className="md:col-span-2 flex flex-col items-center justify-center space-y-1">
          <span className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{durationText}</span>
          </span>

          <div className="relative w-full max-w-[200px] flex items-center">
            <div className="w-2 h-2 rounded-full border-2 border-[var(--primary)] bg-[var(--bg)] shrink-0" />
            <div className="flex-1 h-0.5 bg-[var(--border)] relative">
              <Plane className="w-3.5 h-3.5 text-[var(--primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="w-2 h-2 rounded-full border-2 border-[var(--primary)] bg-[var(--primary)] shrink-0" />
          </div>

          <span className={`text-[11px] font-semibold ${offer.stops === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {offer.stops === 0 ? 'Non-stop' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''} (${offer.stopover_airports.join(', ') || 'Connected'})`}
          </span>
        </div>

        {/* Arrival */}
        <div className="text-left md:text-right space-y-0.5">
          <p className="text-xl font-bold text-[var(--text)] tabular-nums">
            {formatTime(offer.arrival_time)}
          </p>
          <p className="text-xs font-semibold text-[var(--text)]">
            {offer.destination_iata}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] truncate">
            {offer.destination_city}
          </p>
        </div>
      </div>

      {/* Baggage, Carbon & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Baggage & Carbon */}
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1" title="Cabin and Checked Baggage included">
            <Briefcase className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>{offer.baggage_cabin_kg}kg cabin + {offer.baggage_checked_kg}kg check-in</span>
          </span>
          <span className="flex items-center gap-1 text-[11px]" title="Estimated flight carbon footprint">
            <Leaf className="w-3 h-3 text-emerald-600" />
            <span>{offer.carbon_kg} kg CO2</span>
          </span>
        </div>

        {/* Price & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="flex items-center justify-end font-bold text-lg text-[var(--text)] tabular-nums">
              <IndianRupee className="w-4 h-4 text-[var(--primary)]" />
              <span>{offer.price_inr.toLocaleString('en-IN')}</span>
            </div>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-0.5 text-[10px] text-[var(--primary)] hover:underline ml-auto"
            >
              <span>Fare details</span>
              {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {onAddToTrip && (
            <button
              onClick={handleAdd}
              className={`px-3 py-2 text-xs font-semibold border rounded-xl transition-all ${
                addedToTrip
                  ? 'bg-[var(--bg)] text-emerald-600 border-emerald-400'
                  : 'bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:border-[var(--primary)]'
              }`}
            >
              {addedToTrip ? 'Added!' : 'Add to Trip'}
            </button>
          )}

          <button
            onClick={() => onBookSandbox(offer)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[var(--primary)] text-[#FDFBD4] rounded-xl hover:bg-[var(--primary-strong)] transition-all shadow-xs"
          >
            <span>Sandbox Book</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Fare Breakdown */}
      {showBreakdown && (
        <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs space-y-1.5 animate-fadeIn">
          <div className="flex justify-between text-[var(--text-muted)]">
            <span>Base Airline Fare:</span>
            <span className="font-semibold text-[var(--text)] tabular-nums">₹{offer.base_fare_inr.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-[var(--text-muted)]">
            <span>Aviation Taxes, UDF & Surcharges:</span>
            <span className="font-semibold text-[var(--text)] tabular-nums">₹{offer.taxes_inr.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-[var(--text-muted)]">
            <span>TripWise Platform Fee:</span>
            <span className="font-bold text-emerald-600">₹0 (Zero Markup)</span>
          </div>
          <div className="pt-1.5 border-t border-[var(--border)] flex justify-between font-bold text-[var(--text)]">
            <span>Guaranteed Total:</span>
            <span className="tabular-nums">₹{offer.price_inr.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
