import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Search, AlertCircle, Plane } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { AirportPicker } from './AirportPicker';
import { DestinationPicker } from './DestinationPicker';
import { DateRangePicker } from './DateRangePicker';
import { TravellerPicker, TravellerCounts } from './TravellerPicker';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { AirportInfo, DestinationResponse } from '../../types';

interface SearchBarProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialDepart?: string;
  initialReturn?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialOrigin,
  initialDestination,
  initialDepart,
  initialReturn,
}) => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const defaultDepart = initialDepart || format(addDays(new Date(), 7), 'yyyy-MM-dd');
  const defaultReturn = initialReturn || format(addDays(new Date(), 14), 'yyyy-MM-dd');

  const [fromAirport, setFromAirport] = useState<AirportInfo | null>(
    initialOrigin ? { iata: initialOrigin, city: initialOrigin, name: '', country: '', lat: 0, lng: 0 } :
    profile?.home_airport ? { iata: profile.home_airport, city: profile.home_airport, name: '', country: '', lat: 0, lng: 0 } :
    { iata: 'MAA', city: 'Chennai', name: 'Chennai International Airport', country: 'India', lat: 12.9941, lng: 80.1709 }
  );

  const [toDestination, setToDestination] = useState<DestinationResponse | null>(
    initialDestination ? { id: initialDestination, name: initialDestination, country: 'India', lat: 0, lng: 0, iata_codes: [] } :
    { id: 'd0000000-0000-0000-0000-000000000001', name: 'Goa', country: 'India', lat: 15.2993, lng: 74.1240, iata_codes: ['GOI', 'GOX'] }
  );

  const [departDate, setDepartDate] = useState<string>(defaultDepart);
  const [returnDate, setReturnDate] = useState<string>(defaultReturn);
  const [isOneWay, setIsOneWay] = useState<boolean>(false);
  const [travellers, setTravellers] = useState<TravellerCounts>({ adults: 1, children: 0, infants: 0 });
  const [cabin, setCabin] = useState<'economy' | 'premium_economy' | 'business'>('economy');
  const [tripType, setTripType] = useState<'holiday' | 'vacation' | 'honeymoon' | 'trip'>('holiday');
  const [searchMode, setSearchMode] = useState<'trip' | 'flights' | 'stays'>('trip');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSwap = () => {
    if (!fromAirport || !toDestination) return;
    // Swap cities
    const oldFrom = fromAirport;
    setFromAirport({
      iata: toDestination.iata_codes?.[0] || 'DEL',
      city: toDestination.name,
      name: toDestination.name,
      country: toDestination.country,
      lat: toDestination.lat,
      lng: toDestination.lng,
    });
    setToDestination({
      id: oldFrom.iata,
      name: oldFrom.city,
      country: oldFrom.country,
      lat: oldFrom.lat,
      lng: oldFrom.lng,
      iata_codes: [oldFrom.iata],
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!fromAirport) {
      setValidationError('Please select a departure airport or city.');
      return;
    }
    if (!toDestination) {
      setValidationError('Please select a travel destination.');
      return;
    }
    if (fromAirport.iata === toDestination.iata_codes?.[0] || fromAirport.city.toLowerCase() === toDestination.name.toLowerCase()) {
      setValidationError('Origin and destination cannot be identical.');
      return;
    }
    if (!departDate) {
      setValidationError('Departure date is required.');
      return;
    }
    if (!isOneWay && (!returnDate || returnDate < departDate)) {
      setValidationError('Return date must be on or after the departure date.');
      return;
    }
    const totalCount = travellers.adults + travellers.children + travellers.infants;
    if (totalCount > 9) {
      setValidationError('Maximum permitted group size is 9 travellers.');
      return;
    }

    const queryParams = new URLSearchParams({
      from: fromAirport.iata,
      to: toDestination.id,
      destName: toDestination.name,
      depart: departDate,
      return: isOneWay ? '' : returnDate,
      adults: travellers.adults.toString(),
      children: travellers.children.toString(),
      infants: travellers.infants.toString(),
      cabin,
      type: tripType,
      tab: searchMode === 'flights' ? 'flights' : searchMode === 'stays' ? 'stays' : 'places',
    });

    navigate(`/search?${queryParams.toString()}`);
  };

  const tripTypes = [
    { key: 'holiday', label: 'Holiday' },
    { key: 'vacation', label: 'Vacation' },
    { key: 'honeymoon', label: 'Honeymoon' },
    { key: 'trip', label: 'Road Trip' },
  ] as const;

  return (
    <form
      onSubmit={handleSearch}
      className="p-5 sm:p-6 rounded-card bg-surface border border-border shadow-warm-lg space-y-4"
    >
      {/* Search Mode Tabs: Itinerary vs Flights vs Stays */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg border border-border">
          <button
            type="button"
            onClick={() => setSearchMode('trip')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              searchMode === 'trip'
                ? 'bg-primary text-[#FDFBD4] shadow-xs'
                : 'text-text-muted hover:text-text'
            }`}
          >
            All-in-One Trip
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('flights')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              searchMode === 'flights'
                ? 'bg-primary text-[#FDFBD4] shadow-xs'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <span>Flights Comparison</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-bold">LIVE</span>
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('stays')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              searchMode === 'stays'
                ? 'bg-primary text-[#FDFBD4] shadow-xs'
                : 'text-text-muted hover:text-text'
            }`}
          >
            Stays & Hotels
          </button>
        </div>

        {/* Trip Type Selector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-text uppercase tracking-wider mr-1">
            Pace:
          </span>
          {tripTypes.map(({ key, label }) => (
            <Chip
              key={key}
              active={tripType === key}
              onClick={() => setTripType(key)}
            >
              {label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Main Grid Fields */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* From Airport Picker */}
        <div className="md:col-span-3">
          <AirportPicker
            label="From"
            value={fromAirport ? `${fromAirport.city} (${fromAirport.iata})` : ''}
            onChange={setFromAirport}
          />
        </div>

        {/* Swap Button per Section 6.6.3 */}
        <div className="flex justify-center md:pb-1.5 md:col-span-1">
          <button
            type="button"
            onClick={handleSwap}
            className="w-9 h-9 rounded-full bg-bg-elevated hover:bg-bg-subtle border border-border flex items-center justify-center text-text hover:text-primary transition-colors focus-visible:ring-1 focus-visible:ring-ring"
            title="Swap departure and arrival"
            aria-label="Swap origin and destination"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* To Destination Picker */}
        <div className="md:col-span-3">
          <DestinationPicker
            label="To"
            value={toDestination ? `${toDestination.name}, ${toDestination.country}` : ''}
            onChange={setToDestination}
          />
        </div>

        {/* Date Picker */}
        <div className="md:col-span-3">
          <DateRangePicker
            departDate={departDate}
            returnDate={returnDate}
            isOneWay={isOneWay}
            onDepartChange={setDepartDate}
            onReturnChange={setReturnDate}
            onOneWayToggle={setIsOneWay}
          />
        </div>

        {/* Travellers & Cabin Picker */}
        <div className="md:col-span-2">
          <TravellerPicker
            travellers={travellers}
            cabin={cabin}
            onChange={(t, c) => {
              setTravellers(t);
              setCabin(c);
            }}
          />
        </div>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div className="p-3 rounded-input bg-bg border border-primary/40 flex items-center gap-2 text-xs text-primary font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Action Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border">
        <p className="text-[11px] text-text-muted">
          Compares fares concurrently across Duffel, OpenTripMap, and Geoapify.
        </p>
        <Button type="submit" size="lg" className="w-full sm:w-auto gap-2 px-8">
          {searchMode === 'flights' ? (
            <>
              <Plane className="w-4 h-4" />
              <span>Compare Multi-Carrier Flights</span>
            </>
          ) : searchMode === 'stays' ? (
            <>
              <Search className="w-4 h-4" />
              <span>Discover Stays</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Search Trip Itinerary</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
