import React from 'react';
import { Filter, ArrowUpDown, ShieldCheck, RotateCcw, Building } from 'lucide-react';

export interface HotelFilterState {
  sortBy: 'index' | 'price_asc' | 'price_desc' | 'rating';
  minIndex: number;
  maxPrice: number;
  category: string;
}

interface HotelFiltersProps {
  filters: HotelFilterState;
  onFilterChange: (filters: HotelFilterState) => void;
  minPrice: number;
  maxPrice: number;
  totalCount: number;
  filteredCount: number;
  onReset: () => void;
}

export const HotelFilters: React.FC<HotelFiltersProps> = ({
  filters,
  onFilterChange,
  minPrice,
  maxPrice,
  totalCount,
  filteredCount,
  onReset,
}) => {
  const update = (patch: Partial<HotelFilterState>) => {
    onFilterChange({ ...filters, ...patch });
  };

  const isFiltered =
    filters.sortBy !== 'index' ||
    filters.minIndex > 0 ||
    filters.category !== 'all' ||
    filters.maxPrice < maxPrice;

  return (
    <div className="p-4 sm:p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-xs space-y-4">
      {/* Top Header & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-sm font-bold text-[var(--text)]">
            Hotel Index Filters
          </h3>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            ({filteredCount} of {totalCount} properties)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)] font-medium">Sort by:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => update({ sortBy: e.target.value as HotelFilterState['sortBy'] })}
            className="h-8 px-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          >
            <option value="index">TripWise Bayesian Index (Highest)</option>
            <option value="price_asc">Price: Lowest First</option>
            <option value="price_desc">Price: Highest First</option>
            <option value="rating">Star Rating (High to Low)</option>
          </select>

          {isFiltered && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[var(--primary)] hover:underline ml-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {/* 1. Min TripWise Index Chips */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Min TripWise Index</span>
          </label>
          <div className="flex rounded-xl bg-[var(--bg)] p-0.5 border border-[var(--border)]">
            {[
              { id: 0, label: 'All' },
              { id: 85, label: '85+ Good' },
              { id: 90, label: '90+ Top' },
              { id: 93, label: '93+ Elite' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => update({ minIndex: opt.id })}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filters.minIndex === opt.id
                    ? 'bg-[var(--primary)] text-[#FDFBD4] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Category Filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[var(--text)] uppercase tracking-wider">
            Property Style
          </label>
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'all', label: 'All Styles' },
              { id: 'heritage_resort', label: 'Heritage' },
              { id: 'boutique_hotel', label: 'Boutique' },
              { id: 'modern_boutique', label: 'Urban Loft' },
              { id: 'eco_resort', label: 'Eco Retreat' }
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => update({ category: c.id })}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                  filters.category === c.id
                    ? 'bg-[var(--primary)] text-[#FDFBD4] border-[var(--primary)]'
                    : 'bg-[var(--bg)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--text)]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Max Nightly Budget */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-bold text-[var(--text)] uppercase tracking-wider">Max Rate / Night</span>
            <span className="font-mono font-bold text-[var(--primary)]">
              ₹{filters.maxPrice.toLocaleString('en-IN')}
            </span>
          </div>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            step={500}
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
    </div>
  );
};
