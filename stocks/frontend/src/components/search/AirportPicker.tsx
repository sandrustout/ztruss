import React, { useState, useEffect, useRef } from 'react';
import { Plane, Search, X } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { AirportInfo } from '../../types';

interface AirportPickerProps {
  label: string;
  value: string;
  onChange: (airport: AirportInfo) => void;
  placeholder?: string;
  error?: string;
}

export const AirportPicker: React.FC<AirportPickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Origin airport or city',
  error,
}) => {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<AirportInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await apiClient<AirportInfo[]>(`/airports/search?q=${encodeURIComponent(query)}`);
        setResults(data);
      } catch (e) {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleSelect = (airport: AirportInfo) => {
    setQuery(`${airport.city} (${airport.iata})`);
    onChange(airport);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full space-y-1.5" ref={wrapperRef}>
      <label className="block text-xs font-semibold text-text uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
          <Plane className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full h-11 pl-9 pr-8 text-sm bg-bg border rounded-input transition-colors text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-ring ${
            error ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-brand-brown focus:border-primary'
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(true);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {error && <p className="text-xs text-primary font-medium">{error}</p>}

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-card bg-surface border border-border shadow-warm-lg z-50 text-text animate-in fade-in slide-in-from-top-1">
          {isLoading ? (
            <div className="p-3 text-xs text-text-muted text-center">Searching airports...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-xs text-text-muted text-center">No matching airports found</div>
          ) : (
            <ul className="py-1">
              {results.map((airport) => (
                <li key={airport.iata}>
                  <button
                    type="button"
                    onClick={() => handleSelect(airport)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-bg-elevated transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-bold text-text group-hover:text-primary">
                        {airport.city}, {airport.country}
                      </p>
                      <p className="text-[11px] text-text-muted truncate max-w-[200px]">
                        {airport.name}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-pill bg-bg border border-border text-xs font-mono font-bold text-primary">
                      {airport.iata}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
