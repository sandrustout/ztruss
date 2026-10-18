import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Compass, 
  Plus, 
  Calendar, 
  MapPin, 
  Trash2, 
  IndianRupee, 
  ArrowRight, 
  Sparkles, 
  Users, 
  X,
  Receipt
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { Trip, DestinationResponse } from '../types';
import { Button } from '../components/ui/Button';

export const TripsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDestId, setNewDestId] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newBudget, setNewBudget] = useState('');

  // Fetch user's trips
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['my-trips'],
    queryFn: () => apiClient.get<Trip[]>('/trips')
  });

  // Fetch destinations list for the modal dropdown
  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations-dropdown'],
    queryFn: () => apiClient.get<DestinationResponse[]>('/destinations/search?q=')
  });

  // Create Trip mutation
  const createTripMutation = useMutation<Trip, Error, any>({
    mutationFn: (newTripData: any) => apiClient.post<Trip>('/trips', newTripData),
    onSuccess: (createdTrip: Trip) => {
      queryClient.invalidateQueries({ queryKey: ['my-trips'] });
      setShowCreateModal(false);
      navigate(`/trip/${createdTrip.id}`);
    }
  });

  // Delete Trip mutation
  const deleteTripMutation = useMutation({
    mutationFn: (tripId: string) => apiClient.delete(`/trips/${tripId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trips'] });
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDestId || !newStartDate || !newEndDate) return;

    createTripMutation.mutate({
      title: newTitle.trim(),
      destination_id: newDestId,
      start_date: newStartDate,
      end_date: newEndDate,
      budget: parseFloat(newBudget) || 25000,
      currency: 'INR',
      trip_type: 'holiday',
      travellers_json: { adults: 2, children: 0, infants: 0 }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            My Planned Trips
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Review your active itineraries, autosaved drafts, and verified travel bookings.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold bg-[var(--primary)] text-[#FDFBD4] rounded-xl hover:bg-[var(--primary-strong)] transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Plan New Trip</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[var(--text-muted)]">Loading your itineraries...</p>
        </div>
      ) : trips.length === 0 ? (
        /* Empty State Illustration per rule 4.13 */
        <div className="p-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-center space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[var(--bg)] mx-auto flex items-center justify-center border border-[var(--border)]">
            <Compass className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[var(--text)]">No trips planned yet</h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Choose your destination, travel dates, and companion count on the explore page or create a custom itinerary board directly.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 text-xs font-semibold bg-[var(--primary)] text-[#FDFBD4] rounded-xl hover:bg-[var(--primary-strong)] transition-all"
            >
              Create Itinerary
            </button>
          </div>
        </div>
      ) : (
        /* Trips Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip: Trip) => {
            const itemCount = trip.items?.length || 0;
            const totalCost = trip.items?.reduce((sum: number, it: any) => sum + (it.cost_estimate || 0), 0) || 0;

            return (
              <div
                key={trip.id}
                className="group relative flex flex-col justify-between p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl hover:border-[var(--primary)] transition-all shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--primary)]">
                      {trip.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${trip.title}"?`)) {
                          deleteTripMutation.mutate(trip.id);
                        }
                      }}
                      title="Delete trip"
                      className="p-1 text-[var(--text-muted)] hover:text-red-600 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-[var(--text)] tracking-tight group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                    {trip.title}
                  </h3>

                  <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--text-muted)]">
                    <Calendar className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                    <span>{trip.start_date} to {trip.end_date}</span>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5" />
                      <span>{itemCount} stops</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span className="font-semibold text-[var(--text)]">₹{totalCost.toLocaleString('en-IN')}</span>
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[var(--border)] flex items-center gap-2">
                  <Link
                    to={`/trip/${trip.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[var(--text)] hover:bg-[var(--primary)] hover:text-[#FDFBD4] hover:border-[var(--primary)] transition-all"
                  >
                    <span>Planner Board</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    to={`/trip/${trip.id}/bill`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 rounded-xl hover:bg-[var(--primary)] hover:text-[#FDFBD4] transition-all"
                    title="Estimate That Bill & View Itemised Invoice"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>View Bill</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Create Trip Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text)]">Create New Trip</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)]">
                  Trip Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4 Days in Jaipur"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-muted)]">
                  Destination
                </label>
                <select
                  required
                  value={newDestId}
                  onChange={e => setNewDestId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                >
                  <option value="">Select Destination</option>
                  {destinations.map((d: DestinationResponse) => (
                    <option key={d.id} value={d.id}>
                      {d.name}, {d.country}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)]">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={e => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)]">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={e => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-muted)]">
                  Budget (INR)
                </label>
                <input
                  type="number"
                  placeholder="25000"
                  value={newBudget}
                  onChange={e => setNewBudget(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTripMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold bg-[var(--primary)] text-[#FDFBD4] rounded-xl hover:bg-[var(--primary-strong)] disabled:opacity-50"
                >
                  {createTripMutation.isPending ? 'Creating...' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
