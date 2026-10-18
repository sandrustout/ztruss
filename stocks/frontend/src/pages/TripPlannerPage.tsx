import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  RotateCcw, 
  RotateCw, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  Share2, 
  Edit2, 
  CheckCircle2, 
  Calendar, 
  Users,
  Compass,
  Map,
  LayoutGrid,
  Columns
} from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import { Board } from '../components/planner/Board';
import { SuggestionPanel } from '../components/planner/SuggestionPanel';
import { CostPanel } from '../components/planner/CostPanel';
import { TripRouteMap } from '../components/map/TripRouteMap';
import { apiClient } from '../lib/api';
import { Trip, DestinationResponse } from '../types';

export const TripPlannerPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    trip,
    isLoading,
    isSaving,
    saveStatus,
    errorMessage,
    history,
    future,
    loadTrip,
    updateTripMeta,
    undo,
    redo
  } = useTripStore();

  const [activeView, setActiveView] = useState<'board' | 'split' | 'map'>('board');
  const [destination, setDestination] = useState<DestinationResponse | null>(null);
  const [isInitializingNew, setIsInitializingNew] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    if (tripId === 'new') {
      setIsInitializingNew(true);
      setCreateError(null);

      const destParam = searchParams.get('dest') || 'd0000000-0000-0000-0000-000000000001';
      const titleParam = searchParams.get('title') || 'New Planned Itinerary';
      const fromParam = (searchParams.get('from') || 'MAA').toUpperCase();
      const startParam = searchParams.get('start') || new Date().toISOString().split('T')[0];
      const startDateObj = new Date(startParam);
      const endDateObj = new Date(startDateObj);
      endDateObj.setDate(startDateObj.getDate() + 4);
      const endParam = searchParams.get('end') || endDateObj.toISOString().split('T')[0];

      apiClient.post<Trip>('/trips', {
        title: titleParam,
        destination_id: destParam,
        origin_iata: fromParam.slice(0, 3),
        start_date: startParam,
        end_date: endParam,
        trip_type: 'holiday',
        status: 'draft',
        travellers_json: { adults: 1, children: 0, infants: 0 },
        cabin: 'economy',
        currency: 'INR',
        budget: 35000,
        is_public: false
      })
      .then(async (newTrip) => {
        // Attach staged flight or hotel if present in localStorage
        try {
          const stagedFlightStr = localStorage.getItem('tripwise_selected_flight');
          if (stagedFlightStr) {
            const parsed = JSON.parse(stagedFlightStr);
            const flight = parsed.offer || parsed;
            await apiClient.post(`/trips/${newTrip.id}/items`, {
              type: 'flight',
              day_index: 0,
              order_index: 0,
              title: `Flight: ${flight.airline_name || flight.airline || 'Carrier'} (${flight.flight_number || 'Direct'}) ${flight.origin_iata || 'DEP'} → ${flight.destination_iata || 'ARR'}`,
              start_time: flight.departure_time?.includes('T') ? flight.departure_time.split('T')[1].substring(0, 5) : '09:00',
              end_time: flight.arrival_time?.includes('T') ? flight.arrival_time.split('T')[1].substring(0, 5) : '12:00',
              duration_minutes: flight.duration_minutes || 180,
              travel_minutes_from_prev: 0,
              travel_mode: 'transit',
              cost_estimate: flight.price_inr || flight.price || 0,
              cost_is_estimate: false,
              notes: parsed.booking ? `PNR: ${parsed.booking.booking_reference}` : `Carrier: ${flight.provider || 'Aviation'}`
            });
            localStorage.removeItem('tripwise_selected_flight');
          }

          const stagedHotelStr = localStorage.getItem('tripwise_selected_hotel');
          if (stagedHotelStr) {
            const parsed = JSON.parse(stagedHotelStr);
            const hotel = parsed.hotel || parsed;
            await apiClient.post(`/trips/${newTrip.id}/items`, {
              type: 'hotel',
              day_index: 0,
              order_index: 1,
              title: `Stay: ${hotel.name || 'Hotel Check-In'}`,
              start_time: '14:00',
              end_time: '15:00',
              duration_minutes: 60,
              travel_minutes_from_prev: 30,
              travel_mode: 'cab',
              cost_estimate: hotel.total_price_inr || hotel.price_per_night_inr || 0,
              cost_is_estimate: false,
              notes: hotel.address ? `Address: ${hotel.address}` : undefined
            });
            localStorage.removeItem('tripwise_selected_hotel');
          }
        } catch (e) {
          console.warn('Error attaching staged items:', e);
        }

        navigate(`/trip/${newTrip.id}`, { replace: true });
      })
      .catch((err) => {
        console.error('Failed to create trip from new:', err);
        setCreateError(err.message || 'Could not initialise trip.');
        setIsInitializingNew(false);
      });
    } else if (tripId) {
      loadTrip(tripId);
    }
  }, [tripId, searchParams, navigate, loadTrip]);

  useEffect(() => {
    if (trip?.destination_id) {
      apiClient.get<DestinationResponse>(`/destinations/${trip.destination_id}`)
        .then(setDestination)
        .catch(err => console.warn('Could not fetch destination details for map:', err));
    }
  }, [trip?.destination_id]);

  useEffect(() => {
    if (trip) {
      setTitleInput(trip.title);
    }
  }, [trip]);

  // Keyboard shortcuts for Undo (Ctrl+Z) and Redo (Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleTitleSubmit = async () => {
    if (titleInput.trim() && titleInput !== trip?.title) {
      await updateTripMeta({ title: titleInput.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  if (isInitializingNew || (tripId === 'new' && !createError)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        <h3 className="text-base font-bold text-[var(--text)]">Initialising Your Itinerary</h3>
        <p className="text-xs font-medium text-[var(--text-muted)]">
          Preparing day columns, routing map, and travel details...
        </p>
      </div>
    );
  }

  if (createError) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-[var(--bg-elevated)] border border-red-300 dark:border-red-900 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
        <h3 className="text-base font-bold text-[var(--text)]">Could not initialise trip</h3>
        <p className="text-xs text-[var(--text-muted)]">{createError}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-xs font-semibold bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] rounded-xl hover:border-[var(--primary)]"
          >
            Explore Cities
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-xs font-semibold bg-[var(--primary)] text-[#FDFBD4] rounded-xl hover:bg-[var(--primary-strong)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-[var(--text-muted)]">
          Loading itinerary board...
        </p>
      </div>
    );
  }

  if (errorMessage && !trip) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-[var(--bg-elevated)] border border-red-300 dark:border-red-900 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
        <h3 className="text-base font-bold text-[var(--text)]">Failed to load trip</h3>
        <p className="text-xs text-[var(--text-muted)]">{errorMessage}</p>
        <button
          onClick={() => tripId && loadTrip(tripId)}
          className="px-4 py-2 text-xs font-semibold bg-[var(--primary)] text-[#FDFBD4] rounded-xl hover:bg-[var(--primary-strong)]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[var(--bg)]">
      {/* Top Planner Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border)] shrink-0 gap-4">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/trips')}
            aria-label="Back to all trips"
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={e => e.key === 'Enter' && handleTitleSubmit()}
                className="px-2 py-1 text-base font-bold bg-[var(--bg)] border border-[var(--primary)] rounded-lg text-[var(--text)] focus:outline-none"
              />
              <button
                onClick={handleTitleSubmit}
                className="p-1 text-xs text-[var(--primary)] hover:bg-[var(--bg)] rounded"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-2 cursor-pointer group"
              title="Click to rename trip"
            >
              <h1 className="text-base font-bold text-[var(--text)] tracking-tight truncate max-w-xs md:max-w-md">
                {trip.title}
              </h1>
              <Edit2 className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}

          {/* Quick Info Chips */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-[var(--border)] text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--border)] font-medium">
              <Calendar className="w-3 h-3 text-[var(--primary)]" />
              <span>{trip.start_date} to {trip.end_date}</span>
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--border)] font-medium">
              <Users className="w-3 h-3 text-[var(--primary)]" />
              <span>{trip.travellers_json?.adults || 1} travellers</span>
            </span>
          </div>
        </div>

        {/* Right: Actions, Autosave & Undo/Redo */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Autosave Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium px-2 py-1 rounded-full bg-[var(--bg)] border border-[var(--border)]">
            {saveStatus === 'saving' && (
              <>
                <RefreshCw className="w-3 h-3 text-[var(--primary)] animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Saved</span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Unsaved changes</span>
              </>
            )}
            {saveStatus === 'conflict' && (
              <>
                <AlertCircle className="w-3 h-3 text-red-600" />
                <span className="text-red-600">Sync conflict</span>
              </>
            )}
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1 border-l border-[var(--border)] pl-2">
            <button
              onClick={undo}
              disabled={history.length === 0}
              title="Undo last change (Ctrl+Z)"
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={future.length === 0}
              title="Redo change (Ctrl+Y)"
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Switcher: Board View vs Split View vs Route Map View */}
          <div className="flex items-center bg-[var(--bg)] border border-[var(--border)] rounded-xl p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeView === 'board'
                  ? 'bg-[var(--primary)] text-[#FDFBD4] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Day Board</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeView === 'split'
                  ? 'bg-[var(--primary)] text-[#FDFBD4] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeView === 'map'
                  ? 'bg-[var(--primary)] text-[#FDFBD4] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Route Map</span>
            </button>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShareClick}
            title="Copy trip link"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)] transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedShare ? 'Copied link!' : 'Share'}</span>
          </button>

          {/* Toggle Suggestions Drawer (Only relevant in Board view) */}
          {activeView === 'board' && (
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                showSuggestions
                  ? 'bg-[var(--primary)] text-[#FDFBD4] border-[var(--primary)]'
                  : 'bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:border-[var(--primary)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated Gems</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Board, Split View, or Route Map */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeView === 'board' ? (
          <>
            {/* Drag and Drop Day Board */}
            <Board trip={trip} />

            {/* Suggestion Drawer */}
            {showSuggestions && (
              <SuggestionPanel
                destinationId={trip.destination_id}
                totalDays={Math.max(1, trip.items.reduce((max, it) => Math.max(max, it.day_index + 1), 3))}
                onClose={() => setShowSuggestions(false)}
              />
            )}
          </>
        ) : activeView === 'split' ? (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full h-full">
            <div className="w-full lg:w-1/2 h-1/2 lg:h-full overflow-hidden border-b lg:border-b-0 lg:border-r border-[var(--border)]">
              <Board trip={trip} />
            </div>
            <div className="w-full lg:w-1/2 h-1/2 lg:h-full overflow-hidden p-2">
              <TripRouteMap
                items={trip.items}
                destination={destination}
              />
            </div>
          </div>
        ) : (
          /* Interactive Day-by-Day Travel Route Map */
          <div className="flex-1 h-full w-full overflow-hidden p-2 sm:p-4">
            <TripRouteMap
              items={trip.items}
              destination={destination}
            />
          </div>
        )}
      </div>

      {/* Running Cost Breakdown Footer */}
      <CostPanel
        tripId={trip.id}
        items={trip.items}
        budget={trip.budget}
        currency={trip.currency}
      />
    </div>
  );
};
