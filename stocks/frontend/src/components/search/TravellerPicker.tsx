import React, { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, Plus, Minus } from 'lucide-react';

export interface TravellerCounts {
  adults: number;
  children: number;
  infants: number;
}

interface TravellerPickerProps {
  travellers: TravellerCounts;
  cabin: 'economy' | 'premium_economy' | 'business';
  onChange: (counts: TravellerCounts, cabin: 'economy' | 'premium_economy' | 'business') => void;
}

export const TravellerPicker: React.FC<TravellerPickerProps> = ({
  travellers,
  cabin,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const total = travellers.adults + travellers.children + travellers.infants;

  const updateCount = (type: keyof TravellerCounts, delta: number) => {
    const nextTotal = total + delta;
    if (delta > 0 && nextTotal > 9) return; // Max 9 travellers rule 6.6

    const current = travellers[type];
    const next = Math.max(type === 'adults' ? 1 : 0, current + delta);
    onChange({ ...travellers, [type]: next }, cabin);
  };

  const cabinLabels = {
    economy: 'Economy',
    premium_economy: 'Prem. Economy',
    business: 'Business',
  };

  return (
    <div className="relative w-full space-y-1.5" ref={wrapperRef}>
      <label className="block text-xs font-semibold text-text uppercase tracking-wider">
        Travellers & Class
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-3 bg-bg border border-border hover:border-brand-brown focus:border-primary rounded-input flex items-center justify-between text-xs text-text transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-text-muted" />
          <span className="font-semibold">
            {total} {total === 1 ? 'Traveller' : 'Travellers'}, {cabinLabels[cabin]}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 p-4 rounded-card bg-surface border border-border shadow-warm-lg z-50 text-text space-y-4 animate-in fade-in slide-in-from-top-1 w-72">
          {/* Steppers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-text">Adults</p>
                <p className="text-[10px] text-text-muted">Age 12 and above</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={travellers.adults <= 1}
                  onClick={() => updateCount('adults', -1)}
                  className="w-7 h-7 rounded-full bg-bg-elevated border border-border flex items-center justify-center disabled:opacity-30 hover:bg-bg-subtle"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-4 text-center font-bold tabular-nums">{travellers.adults}</span>
                <button
                  type="button"
                  disabled={total >= 9}
                  onClick={() => updateCount('adults', 1)}
                  className="w-7 h-7 rounded-full bg-bg-elevated border border-border flex items-center justify-center disabled:opacity-30 hover:bg-bg-subtle"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-text">Children</p>
                <p className="text-[10px] text-text-muted">Ages 2 to 11</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={travellers.children <= 0}
                  onClick={() => updateCount('children', -1)}
                  className="w-7 h-7 rounded-full bg-bg-elevated border border-border flex items-center justify-center disabled:opacity-30 hover:bg-bg-subtle"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-4 text-center font-bold tabular-nums">{travellers.children}</span>
                <button
                  type="button"
                  disabled={total >= 9}
                  onClick={() => updateCount('children', 1)}
                  className="w-7 h-7 rounded-full bg-bg-elevated border border-border flex items-center justify-center disabled:opacity-30 hover:bg-bg-subtle"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-text">Infants</p>
                <p className="text-[10px] text-text-muted">Under 2 years (lap)</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={travellers.infants <= 0}
                  onClick={() => updateCount('infants', -1)}
                  className="w-7 h-7 rounded-full bg-bg-elevated border border-border flex items-center justify-center disabled:opacity-30 hover:bg-bg-subtle"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-4 text-center font-bold tabular-nums">{travellers.infants}</span>
                <button
                  type="button"
                  disabled={total >= 9}
                  onClick={() => updateCount('infants', 1)}
                  className="w-7 h-7 rounded-full bg-bg-elevated border border-border flex items-center justify-center disabled:opacity-30 hover:bg-bg-subtle"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Cabin Selection */}
          <div className="pt-2 border-t border-border space-y-1.5">
            <p className="text-xs font-semibold text-text">Cabin Class</p>
            <div className="grid grid-cols-3 gap-1">
              {(['economy', 'premium_economy', 'business'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange(travellers, c)}
                  className={`py-1.5 px-2 rounded-input text-[11px] font-medium border text-center transition-colors ${
                    cabin === c
                      ? 'bg-primary text-brand-cream border-primary font-bold shadow-sm'
                      : 'bg-bg text-text border-border hover:bg-bg-elevated'
                  }`}
                >
                  {cabinLabels[c]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
