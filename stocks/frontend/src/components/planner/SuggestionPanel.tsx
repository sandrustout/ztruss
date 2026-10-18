import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Compass, 
  Utensils, 
  Calendar, 
  Plus, 
  Clock, 
  Star, 
  Check, 
  Sparkles,
  ChevronDown,
  Info,
  X
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { PlaceResponse, DishResponse, EventResponse } from '../../types';
import { useTripStore } from '../../store/tripStore';

interface SuggestionPanelProps {
  destinationId: string;
  totalDays: number;
  onClose?: () => void;
}

export const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
  destinationId,
  totalDays,
  onClose
}) => {
  const { addItem } = useTripStore();
  const [filter, setFilter] = useState<'all' | 'places' | 'food' | 'events'>('all');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [addedItemIds, setAddedItemIds] = useState<Set<string>>(new Set());

  // Fetch places
  const { data: places = [], isLoading: placesLoading } = useQuery({
    queryKey: ['dest-places', destinationId],
    queryFn: () => apiClient.get<PlaceResponse[]>(`/destinations/${destinationId}/places`),
    enabled: Boolean(destinationId),
    staleTime: 1000 * 60 * 30
  });

  // Fetch food
  const { data: dishes = [], isLoading: foodLoading } = useQuery({
    queryKey: ['dest-food', destinationId],
    queryFn: () => apiClient.get<DishResponse[]>(`/destinations/${destinationId}/food`),
    enabled: Boolean(destinationId),
    staleTime: 1000 * 60 * 30
  });

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['dest-events', destinationId],
    queryFn: () => apiClient.get<EventResponse[]>(`/destinations/${destinationId}/events`),
    enabled: Boolean(destinationId),
    staleTime: 1000 * 60 * 30
  });

  const handleAddPlace = async (place: PlaceResponse) => {
    await addItem({
      title: place.name,
      type: 'place',
      day_index: selectedDayIndex,
      duration_minutes: place.typical_duration_minutes || 90,
      ref_table: 'places',
      ref_id: place.id,
      cost_estimate: 0,
      notes: place.fee_text || undefined
    });
    setAddedItemIds(prev => new Set(prev).add(place.id));
  };

  const handleAddDish = async (dish: DishResponse) => {
    await addItem({
      title: `Taste ${dish.name}`,
      type: 'restaurant',
      day_index: selectedDayIndex,
      duration_minutes: 60,
      cost_estimate: 350,
      notes: dish.description || dish.source_note
    });
    setAddedItemIds(prev => new Set(prev).add(dish.id));
  };

  const handleAddEvent = async (event: EventResponse) => {
    await addItem({
      title: event.name,
      type: 'event',
      day_index: selectedDayIndex,
      duration_minutes: 120,
      cost_estimate: 500,
      notes: event.description || `Festival alert: ${event.type}`
    });
    setAddedItemIds(prev => new Set(prev).add(event.name));
  };

  const isLoading = placesLoading || foodLoading || eventsLoading;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-elevated)] border-l border-[var(--border)] w-88 shrink-0">
      {/* Panel Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold text-[var(--text)] tracking-tight">
              Curated Suggestions
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Target Day Selector */}
            <div className="flex items-center gap-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)]">
                Target:
              </label>
              <select
                value={selectedDayIndex}
                onChange={e => setSelectedDayIndex(parseInt(e.target.value, 10))}
                className="text-xs bg-[var(--bg)] border border-[var(--border)] rounded-md px-2 py-1 text-[var(--text)] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              >
                {Array.from({ length: totalDays }).map((_, idx) => (
                  <option key={idx} value={idx}>
                    Day {idx + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Close Panel Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close curated suggestions"
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] border border-[var(--border)] transition-colors"
                title="Close suggestions panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === 'all'
                ? 'bg-[var(--primary)] text-[#FDFBD4]'
                : 'bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('places')}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === 'places'
                ? 'bg-[var(--primary)] text-[#FDFBD4]'
                : 'bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)]'
            }`}
          >
            Places
          </button>
          <button
            onClick={() => setFilter('food')}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === 'food'
                ? 'bg-[var(--primary)] text-[#FDFBD4]'
                : 'bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)]'
            }`}
          >
            Food
          </button>
          <button
            onClick={() => setFilter('events')}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === 'events'
                ? 'bg-[var(--primary)] text-[#FDFBD4]'
                : 'bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)]'
            }`}
          >
            Events
          </button>
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-2">
            <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[var(--text-muted)]">Discovering destination gems...</p>
          </div>
        ) : (
          <>
            {/* Attractions */}
            {(filter === 'all' || filter === 'places') &&
              places.map((place: PlaceResponse) => {
                const isAdded = addedItemIds.has(place.id);
                return (
                  <div
                    key={place.id}
                    className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)] transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--primary)]">
                          {place.category || 'Attraction'}
                        </span>
                      </div>
                      {place.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-semibold text-[var(--text)]">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{place.rating}</span>
                        </span>
                      )}
                    </div>

                    <h4 className="mt-1 text-sm font-semibold text-[var(--text)] leading-snug">
                      {place.name}
                    </h4>

                    {place.description && (
                      <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                        {place.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border)]">
                      <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <Clock className="w-3 h-3" />
                        <span>{place.typical_duration_minutes}m</span>
                      </span>

                      <button
                        onClick={() => handleAddPlace(place)}
                        disabled={isAdded}
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                          isAdded
                            ? 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)] cursor-default'
                            : 'bg-[var(--primary)] text-[#FDFBD4] hover:bg-[var(--primary-strong)]'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* Local Food */}
            {(filter === 'all' || filter === 'food') &&
              dishes.map((dish: DishResponse) => {
                const isAdded = addedItemIds.has(dish.id);
                return (
                  <div
                    key={dish.id}
                    className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)] transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Utensils className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--primary)]">
                        Must-Try Dish
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-[var(--text)] leading-snug">
                      {dish.name}
                    </h4>

                    {dish.description && (
                      <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                        {dish.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border)]">
                      <div className="flex flex-wrap gap-1">
                        {dish.dietary_tags?.slice(0, 2).map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => handleAddDish(dish)}
                        disabled={isAdded}
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                          isAdded
                            ? 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)] cursor-default'
                            : 'bg-[var(--primary)] text-[#FDFBD4] hover:bg-[var(--primary-strong)]'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* Events */}
            {(filter === 'all' || filter === 'events') &&
              events.map((event: EventResponse, idx: number) => {
                const isAdded = addedItemIds.has(event.name);
                return (
                  <div
                    key={idx}
                    className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)] transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--primary)]">
                        {event.type || 'Event'}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-[var(--text)] leading-snug">
                      {event.name}
                    </h4>

                    {event.description && (
                      <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border)]">
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {event.start_date}
                      </span>

                      <button
                        onClick={() => handleAddEvent(event)}
                        disabled={isAdded}
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                          isAdded
                            ? 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)] cursor-default'
                            : 'bg-[var(--primary)] text-[#FDFBD4] hover:bg-[var(--primary-strong)]'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
          </>
        )}
      </div>
    </div>
  );
};
