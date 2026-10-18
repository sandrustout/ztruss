import React from 'react';
import { 
  Filter, 
  ArrowUpDown, 
  Clock, 
  Plane, 
  RotateCcw, 
  Check, 
  IndianRupee,
  Layers
} from 'lucide-react';
import { FlightOffer } from '../../types';

export interface FlightFilterState {
  sortBy: 'price_asc' | 'duration_asc' | 'best_value' | 'departure_asc';
  stops: 'all' | '0' | '1';
  selectedAirlines: string[];
  timeWindow: 'all' | 'early' | 'morning' | 'afternoon' | 'evening';
  provider: 'all' | 'duffel' | 'amadeus';
  maxPrice: number;
}

interface FlightFiltersProps {
  filters: FlightFilterState;
  onFilterChange: (filters: FlightFilterState) => void;
  availableAirlines: Array<{ code: string; name: string; count: number; color?: string }>;
  minPrice: number;
  maxPrice: number;
  totalResultsCount: number;
  filteredResultsCount: number;
  onReset: () => void;
}

export const FlightFilters: React.FC<FlightFiltersProps> = ({
  filters,
  onFilterChange,
  availableAirlines,
  minPrice,
  maxPrice,
  totalResultsCount,
  filteredResultsCount,
  onReset,
}) => {
  const update = (patch: Partial<FlightFilterState>) => {
    onFilterChange({ ...filters, ...patch });
  };

  const toggleAirline = (code: string) => {
    const current = [...filters.selectedAirlines];
    const index = current.indexOf(code);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(code);
    }
    update({ selectedAirlines: current });
  };

  const isFiltered = 
    filters.sortBy !== 'best_value' ||
    filters.stops !== 'all' ||
    filters.selectedAirlines.length > 0 ||
    filters.timeWindow !== 'all' ||
    filters.provider !== 'all' ||
    filters.maxPrice < maxPrice;

  return (
    <div className="p-4 sm:p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-xs space-y-4">
      {/* Top Header & Sort Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-sm font-bold text-[var(--text)]">
            Flight Filters & Controls
          </h3>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            ({filteredResultsCount} of {totalResultsCount} offers)
          </span>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)] font-medium">Sort by:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => update({ sortBy: e.target.value as FlightFilterState['sortBy'] })}
            className="h-8 px-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          >
            <option value="best_value">TripWise Best Value</option>
            <option value="price_asc">Price: Lowest First</option>
            <option value="duration_asc">Duration: Fastest First</option>
            <option value="departure_asc">Departure: Earliest</option>
          </select>

          {isFiltered && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[var(--primary)] hover:underline ml-2"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
        {/* 1. Stops Filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[var(--text)] uppercase tracking-wider">
            Stops
          </label>
          <div className="flex rounded-xl bg-[var(--bg)] p-0.5 border border-[var(--border)]">
            {[
              { id: 'all', label: 'All' },
              { id: '0', label: 'Direct' },
              { id: '1', label: '1 Stop' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => update({ stops: opt.id as FlightFilterState['stops'] })}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filters.stops === opt.id
                    ? 'bg-[var(--primary)] text-[#FDFBD4] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Departure Time Window */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-[var(--primary)]" />
            <span>Departure Time</span>
          </label>
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'all', label: 'Anytime' },
              { id: 'early', label: '00-06' },
              { id: 'morning', label: '06-12' },
              { id: 'afternoon', label: '12-18' },
              { id: 'evening', label: '18-24' },
            ].map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => update({ timeWindow: w.id as FlightFilterState['timeWindow'] })}
                className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                  filters.timeWindow === w.id
                    ? 'bg-[var(--primary)] text-[#FDFBD4] border-[var(--primary)]'
                    : 'bg-[var(--bg)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--text)]'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Provider Engine */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-[var(--primary)]" />
            <span>Inventory Source</span>
          </label>
          <div className="flex rounded-xl bg-[var(--bg)] p-0.5 border border-[var(--border)]">
            {[
              { id: 'all', label: 'Both' },
              { id: 'duffel', label: 'Duffel' },
              { id: 'amadeus', label: 'Amadeus' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => update({ provider: p.id as FlightFilterState['provider'] })}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filters.provider === p.id
                    ? 'bg-[var(--primary)] text-[#FDFBD4] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Maximum Price Range */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-bold text-[var(--text)] uppercase tracking-wider">Max Budget</span>
            <span className="font-mono font-bold text-[var(--primary)]">
              ₹{filters.maxPrice.toLocaleString('en-IN')}
            </span>
          </div>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            step={250}
            value={filters.maxPrice}
            onChange={(e) => update({ maxPrice: Number(e.target.value) })}
            className="w-full accent-[var(--primary)] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
            <span>₹{minPrice.toLocaleString('en-IN')}</span>
            <span>₹{maxPrice.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* 5. Airline Chips Row */}
      {availableAirlines.length > 0 && (
        <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-[var(--text)] uppercase tracking-wider mr-1">
            Airlines:
          </span>
          {availableAirlines.map((airline) => {
            const isSelected = filters.selectedAirlines.includes(airline.code);
            return (
              <button
                key={airline.code}
                type="button"
                onClick={() => toggleAirline(airline.code)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-[var(--primary)] text-[#FDFBD4] border-[var(--primary)] shadow-xs'
                    : 'bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:border-[var(--primary)]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: airline.color || '#C05800' }}
                />
                <span>{airline.name}</span>
                <span className="text-[10px] opacity-75">({airline.count})</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
