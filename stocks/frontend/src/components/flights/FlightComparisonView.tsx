import React from 'react';
import { 
  TrendingDown, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  IndianRupee,
  Plane,
  ArrowRight
} from 'lucide-react';
import { FlightOffer } from '../../types';

interface FlightComparisonViewProps {
  offers: FlightOffer[];
  cheapestPrice: number;
  highestPrice: number;
  maxSavingsPct: number;
  providers: string[];
  onSelectOffer: (offer: FlightOffer) => void;
}

export const FlightComparisonView: React.FC<FlightComparisonViewProps> = ({
  offers,
  cheapestPrice,
  highestPrice,
  maxSavingsPct,
  providers,
  onSelectOffer,
}) => {
  const cheapestOffer = offers.find((o) => o.is_cheapest) || offers[0];
  const fastestOffer = offers.find((o) => o.is_fastest) || offers[0];
  const bestValueOffer = offers.find((o) => o.is_best_value) || offers[0];

  if (!offers || offers.length === 0) return null;

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-4">
      {/* 3 Core Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Cheapest Offer Card */}
        {cheapestOffer && (
          <div 
            onClick={() => onSelectOffer(cheapestOffer)}
            className="p-4 rounded-2xl bg-[var(--bg-elevated)] border-2 border-emerald-500/40 hover:border-emerald-600 transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 bg-emerald-600 text-[#FDFBD4] text-[10px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
              Cheapest
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                <TrendingDown className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-[var(--text)]">Lowest Fare</p>
                <p className="text-[11px] text-[var(--text-muted)]">{cheapestOffer.airline_name}</p>
              </div>
            </div>

            <div className="flex items-baseline gap-1 my-1">
              <IndianRupee className="w-5 h-5 text-emerald-600 self-center" />
              <span className="text-2xl font-black text-[var(--text)] tabular-nums">
                {cheapestOffer.price_inr.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
              <span>{formatDuration(cheapestOffer.duration_minutes)} • {cheapestOffer.stops === 0 ? 'Direct' : `${cheapestOffer.stops} stop`}</span>
              <span className="font-semibold text-[var(--primary)] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                View <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        )}

        {/* 2. Fastest Route Card */}
        {fastestOffer && (
          <div 
            onClick={() => onSelectOffer(fastestOffer)}
            className="p-4 rounded-2xl bg-[var(--bg-elevated)] border-2 border-sky-500/40 hover:border-sky-600 transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 bg-sky-600 text-[#FDFBD4] text-[10px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
              Fastest
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                <Zap className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-[var(--text)]">Quickest Transit</p>
                <p className="text-[11px] text-[var(--text-muted)]">{fastestOffer.airline_name}</p>
              </div>
            </div>

            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl font-black text-[var(--text)] tabular-nums">
                {formatDuration(fastestOffer.duration_minutes)}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
              <span>₹{fastestOffer.price_inr.toLocaleString('en-IN')} • {fastestOffer.stops === 0 ? 'Non-stop' : `${fastestOffer.stops} stop`}</span>
              <span className="font-semibold text-[var(--primary)] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                View <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        )}

        {/* 3. TripWise Best Value Card */}
        {bestValueOffer && (
          <div 
            onClick={() => onSelectOffer(bestValueOffer)}
            className="p-4 rounded-2xl bg-[var(--bg-elevated)] border-2 border-[var(--primary)] hover:border-[var(--primary-strong)] transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 bg-[var(--primary)] text-[#FDFBD4] text-[10px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
              Best Value
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-[var(--text)]">Optimal Balance</p>
                <p className="text-[11px] text-[var(--text-muted)]">{bestValueOffer.airline_name}</p>
              </div>
            </div>

            <div className="flex items-baseline gap-1 my-1">
              <IndianRupee className="w-5 h-5 text-[var(--primary)] self-center" />
              <span className="text-2xl font-black text-[var(--text)] tabular-nums">
                {bestValueOffer.price_inr.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
              <span>{formatDuration(bestValueOffer.duration_minutes)} • {bestValueOffer.stops === 0 ? 'Direct' : `${bestValueOffer.stops} stop`}</span>
              <span className="font-semibold text-[var(--primary)] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                View <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Transparent Savings & Multi-Provider Strip */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-[var(--text)]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Zero Markup Guarantee</span>
          </div>
          <span className="hidden sm:inline text-[var(--text-muted)]">•</span>
          <span className="text-[var(--text-muted)]">
            Direct airline fares aggregated simultaneously across{' '}
            <strong className="text-[var(--text)]">Duffel Sandbox GDS</strong> and{' '}
            <strong className="text-[var(--text)]">Amadeus Multi-Carrier</strong> engines.
          </span>
        </div>

        {maxSavingsPct > 0 && (
          <div className="flex items-center gap-2 bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-3 py-1.5 rounded-xl font-bold self-start md:self-auto shrink-0">
            <TrendingDown className="w-4 h-4 text-emerald-600" />
            <span>Save up to {maxSavingsPct}% on this route</span>
          </div>
        )}
      </div>
    </div>
  );
};
