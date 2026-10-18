import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface DateRangePickerProps {
  departDate: string;
  returnDate: string;
  isOneWay: boolean;
  onDepartChange: (date: string) => void;
  onReturnChange: (date: string) => void;
  onOneWayToggle: (oneWay: boolean) => void;
  error?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  departDate,
  returnDate,
  isOneWay,
  onDepartChange,
  onReturnChange,
  onOneWayToggle,
  error,
}) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const handleDepartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onDepartChange(val);
    if (!isOneWay && val > returnDate) {
      // Auto-adjust return date to 5 days after departure
      const nextDate = format(addDays(new Date(val), 5), 'yyyy-MM-dd');
      onReturnChange(nextDate);
    }
  };

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-text uppercase tracking-wider">
          Travel Dates
        </label>
        <button
          type="button"
          onClick={() => onOneWayToggle(!isOneWay)}
          className="text-xs font-semibold text-primary hover:underline focus:outline-none"
        >
          {isOneWay ? 'Switch to Round-trip' : 'One-way only'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Departure Date */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-muted">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <input
            type="date"
            min={todayStr}
            value={departDate}
            onChange={handleDepartChange}
            className="w-full h-11 pl-8 pr-2 text-xs font-medium bg-bg border border-border rounded-input text-text focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Departure date"
          />
        </div>

        {/* Return Date */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-muted">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <input
            type="date"
            min={departDate || todayStr}
            value={returnDate}
            disabled={isOneWay}
            onChange={(e) => onReturnChange(e.target.value)}
            className={`w-full h-11 pl-8 pr-2 text-xs font-medium bg-bg border border-border rounded-input text-text focus:outline-none focus:ring-1 focus:ring-ring ${
              isOneWay ? 'opacity-40 cursor-not-allowed bg-bg-elevated' : ''
            }`}
            aria-label="Return date"
          />
        </div>
      </div>

      {error && <p className="text-xs text-primary font-medium">{error}</p>}
    </div>
  );
};
