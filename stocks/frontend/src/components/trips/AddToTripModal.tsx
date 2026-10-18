import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Plus, 
  Check, 
  MapPin, 
  Calendar, 
  Plane, 
  Building, 
  Sparkles, 
  ArrowRight,
  Compass
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Trip, TripItem, DestinationResponse } from '../../types';
import { useToastStore } from '../ui/Toast';

export interface StagedItemToAdd {
  type: 'place' | 'hotel' | 'flight' | 'restaurant' | 'event';
  title: string;
  cost_estimate: number;
  duration_minutes: number;
  ref_table?: string;
  ref_id?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  destination_id?: string;
  destination_name?: string;
}

interface AddToTripModalProps {
  item: StagedItemToAdd | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToTripModal: React.FC<AddToTripModalProps> = ({
  item,
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState('');

  // Fetch user's existing trips
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['my-trips'],
    queryFn: () => apiClient.get<Trip[]>('/trips'),
    enabled: isOpen
  });

  // Set default selected trip
  React.useEffect(() => {
    if (trips.length > 0 && !selectedTripId) {
      setSelectedTripId(trips[0].id);
    }
    if (item && !newTripTitle) {
      setNewTripTitle(`${item.destination_name || 'My Travel'} Trip`);
    }
  }, [trips, item]);

  // Mutation to add item to existing trip
  const addItemMutation = useMutation({
    mutationFn: async ({ tripId, itemData }: { tripId: string; itemData: any }) => {
      return await apiClient.post<TripItem>(`/trips/${tripId}/items`, itemData);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['my-trips'] });
      addToast({
        type: 'success',
        message: `Added "${item?.title}" to Day ${selectedDayIndex + 1} of your trip!`
      });
      onClose();
    }
  });

  // Mutation to create a new trip and add the item
  const createTripAndAddMutation = useMutation({
    mutationFn: async (tripPayload: any) => {
      const createdTrip = await apiClient.post<Trip>('/trips', tripPayload);
      if (item) {
        await apiClient.post<TripItem>(`/trips/${createdTrip.id}/items`, {
          type: item.type,
          title: item.title,
          day_index: 0,
          start_time: item.type === 'hotel' ? '14:00' : '10:00',
          duration_minutes: item.duration_minutes,
          cost_estimate: item.cost_estimate,
          ref_table: item.ref_table,
          ref_id: item.ref_id,
          lat: item.lat,
          lng: item.lng,
          notes: item.notes
        });
      }
      return createdTrip;
    },
    onSuccess: (createdTrip: Trip) => {
      queryClient.invalidateQueries({ queryKey: ['my-trips'] });
      addToast({
        type: 'success',
        message: `Created "${createdTrip.title}" and added "${item?.title}"!`
      });
      onClose();
      navigate(`/trip/${createdTrip.id}`);
    }
  });

  if (!isOpen || !item) return null;

  const selectedTrip = trips.find(t => t.id === selectedTripId);
  const selectedTripDays = selectedTrip ? 5 : 3;

  const handleConfirm = () => {
    if (isCreatingNew) {
      createTripAndAddMutation.mutate({
        title: newTripTitle.trim() || 'New Vacation Plan',
        destination_id: item.destination_id || 'd0000000-0000-0000-0000-000000000001',
        origin_iata: 'MAA',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        trip_type: 'holiday',
        budget: 35000,
        currency: 'INR'
      });
    } else {
      if (!selectedTripId) return;
      addItemMutation.mutate({
        tripId: selectedTripId,
        itemData: {
          type: item.type,
          title: item.title,
          day_index: selectedDayIndex,
          start_time: item.type === 'hotel' ? '14:00' : '10:00',
          duration_minutes: item.duration_minutes,
          cost_estimate: item.cost_estimate,
          ref_table: item.ref_table,
          ref_id: item.ref_id,
          lat: item.lat,
          lng: item.lng,
          notes: item.notes
        }
      });
    }
  };

  const getItemIcon = () => {
    if (item.type === 'flight') return <Plane className="w-5 h-5 text-[var(--primary)]" />;
    if (item.type === 'hotel') return <Building className="w-5 h-5 text-[var(--primary)]" />;
    return <MapPin className="w-5 h-5 text-[var(--primary)]" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--primary)]/10">
              {getItemIcon()}
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text)]">
                Add to Trip Basket
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Select which planned itinerary should include this {item.type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Staged Item Summary Preview */}
          <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[var(--primary)] tracking-wider">
                {item.type}
              </span>
              <h4 className="text-sm font-bold text-[var(--text)]">{item.title}</h4>
              {item.notes && (
                <p className="text-xs text-[var(--text-muted)] line-clamp-1">{item.notes}</p>
              )}
            </div>
            {item.cost_estimate > 0 && (
              <span className="text-sm font-bold text-[var(--text)] font-mono shrink-0">
                ₹{item.cost_estimate.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Mode Switcher: Existing Trip vs New Trip */}
          <div className="flex rounded-xl bg-[var(--bg)] p-1 border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                !isCreatingNew
                  ? 'bg-[var(--primary)] text-[#FDFBD4] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Add to Existing Trip ({trips.length})
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                isCreatingNew
                  ? 'bg-[var(--primary)] text-[#FDFBD4] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              + Create New Trip
            </button>
          </div>

          {/* Mode 1: Select Existing Trip */}
          {!isCreatingNew ? (
            <div className="space-y-3">
              {isLoading ? (
                <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                  Loading your planned trips...
                </div>
              ) : trips.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] text-center space-y-2">
                  <p className="text-xs text-[var(--text-muted)]">You don't have any planned trips yet.</p>
                  <button
                    onClick={() => setIsCreatingNew(true)}
                    className="text-xs font-bold text-[var(--primary)] hover:underline"
                  >
                    Click here to create your first trip!
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {trips.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTripId(t.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedTripId === t.id
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-xs'
                          : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-[var(--text)]">{t.title}</p>
                        <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{t.start_date} to {t.end_date}</span>
                          <span>• {t.items?.length || 0} stops</span>
                        </p>
                      </div>
                      {selectedTripId === t.id && (
                        <Check className="w-4 h-4 text-[var(--primary)]" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Day Selector */}
              {selectedTripId && (
                <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                  <label className="text-[11px] font-bold text-[var(--text)] uppercase tracking-wider">
                    Select Itinerary Day:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: selectedTripDays }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDayIndex(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedDayIndex === idx
                            ? 'bg-[var(--primary)] text-[#FDFBD4] border-[var(--primary)]'
                            : 'bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:border-[var(--primary)]'
                        }`}
                      >
                        Day {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Mode 2: Create New Trip Input */
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-muted)]">
                  Trip Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5 Days in Goa"
                  value={newTripTitle}
                  onChange={e => setNewTripTitle(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                A new 5-day trip itinerary will be initialized and "{item.title}" will be added to Day 1.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg)] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={addItemMutation.isPending || createTripAndAddMutation.isPending || (!isCreatingNew && !selectedTripId)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[var(--primary)] text-[#FDFBD4] hover:bg-[var(--primary-strong)] disabled:opacity-50 transition-all shadow-xs"
          >
            {addItemMutation.isPending || createTripAndAddMutation.isPending ? (
              <span>Adding to Itinerary...</span>
            ) : (
              <>
                <span>Confirm & Add to Trip</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
