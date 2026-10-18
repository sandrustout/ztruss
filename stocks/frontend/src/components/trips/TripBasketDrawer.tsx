import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingBag, 
  X, 
  MapPin, 
  Plane, 
  Building, 
  Calendar, 
  IndianRupee, 
  ArrowRight, 
  Receipt, 
  Compass, 
  Sparkles,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Trip, TripItem } from '../../types';
import { useAuthStore } from '../../store/authStore';

export const TripBasketDrawer: React.FC = () => {
  const location = useLocation();
  const { isGuest } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTripId, setActiveTripId] = useState<string>('');

  // Fetch all user trips
  const { data: trips = [] } = useQuery({
    queryKey: ['my-trips'],
    queryFn: () => apiClient.get<Trip[]>('/trips'),
    staleTime: 10000,
    enabled: !isGuest
  });

  // Default active trip to the most recently updated trip
  useEffect(() => {
    if (trips.length > 0 && (!activeTripId || !trips.some(t => t.id === activeTripId))) {
      setActiveTripId(trips[0].id);
    }
  }, [trips, activeTripId]);

  // Don't show floating trigger on the Day Board or Bill page itself to avoid overlap
  const isTripPlannerOrBill = location.pathname.startsWith('/trip/');

  const activeTrip = trips.find(t => t.id === activeTripId) || trips[0];
  const items = activeTrip?.items || [];
  const totalItemCount = items.length;
  const totalCost = items.reduce((acc, it) => acc + (it.cost_estimate || 0), 0);

  // Check staged items in localStorage
  const hasStagedFlight = Boolean(localStorage.getItem('tripwise_selected_flight'));
  const hasStagedHotel = Boolean(localStorage.getItem('tripwise_selected_hotel'));
  const totalStagedBadge = totalItemCount + (hasStagedFlight ? 1 : 0) + (hasStagedHotel ? 1 : 0);

  if (isGuest || trips.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Trip Basket Pill */}
      {!isTripPlannerOrBill && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open trip basket"
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[var(--primary)] text-[#FDFBD4] shadow-warm-lg hover:bg-[var(--primary-strong)] hover:scale-105 active:scale-95 transition-all border border-[#FDFBD4]/20 group"
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4 text-[#FDFBD4]" />
            {totalStagedBadge > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[#38240D] text-[#FDFBD4] text-[9px] font-black flex items-center justify-center border border-[#FDFBD4]/40">
                {totalStagedBadge}
              </span>
            )}
          </div>
          <span className="text-xs font-bold tracking-tight">Trip Basket</span>
          <span className="text-[11px] opacity-80 font-mono hidden sm:inline">
            • ₹{totalCost.toLocaleString('en-IN')}
          </span>
        </button>
      )}

      {/* Slide-over Drawer Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed top-0 bottom-0 right-0 z-50 w-full max-w-md bg-[var(--bg-elevated)] border-l border-[var(--border)] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
                Trip Planning Basket
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Live cart of booked flights, stays, and scheduled places
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close basket"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-colors border border-[var(--border)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Trip Selector Strip */}
        {trips.length > 1 && (
          <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-between gap-3 text-xs">
            <span className="text-[var(--text-muted)] font-semibold shrink-0">Active Trip:</span>
            <select
              value={activeTrip?.id}
              onChange={(e) => setActiveTripId(e.target.value)}
              className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2.5 py-1 text-xs text-[var(--text)] font-bold focus:ring-1 focus:ring-[var(--primary)]"
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.items?.length || 0} stops)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTrip && (
            <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                  {activeTrip.status}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  {activeTrip.start_date} to {activeTrip.end_date}
                </span>
              </div>
              <h3 className="text-sm font-bold text-[var(--text)]">{activeTrip.title}</h3>
              <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                <span>{items.length} items scheduled</span>
                <span>•</span>
                <span className="font-bold text-[var(--primary)]">₹{totalCost.toLocaleString('en-IN')} total</span>
              </div>
            </div>
          )}

          {/* Staged Items Alert (Items stored in browser basket pending sync) */}
          {(hasStagedFlight || hasStagedHotel) && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
              <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Staged in Session Basket:</span>
              </span>
              {hasStagedFlight && (
                <p className="text-[11px] text-[var(--text-muted)]">
                  • 1 selected flight offer staged for trip checkout
                </p>
              )}
              {hasStagedHotel && (
                <p className="text-[11px] text-[var(--text-muted)]">
                  • 1 selected stay reservation staged for trip checkout
                </p>
              )}
            </div>
          )}

          {/* Items List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Scheduled Stops & Bookings
            </h4>

            {items.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[var(--bg)] border border-dashed border-[var(--border)] space-y-2">
                <Compass className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
                <p className="text-xs font-semibold text-[var(--text)]">Basket is currently empty</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Browse attractions, multi-provider flights, and verified stays and click "Add to Trip".
                </p>
              </div>
            ) : (
              items.map((item, idx) => {
                const isFlight = item.type === 'flight';
                const isHotel = item.type === 'hotel';
                const isPlace = item.type === 'place';

                return (
                  <div
                    key={item.id || idx}
                    className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-start gap-3 hover:border-[var(--primary)] transition-colors text-xs"
                  >
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--primary)] shrink-0 mt-0.5">
                      {isFlight ? (
                        <Plane className="w-3.5 h-3.5" />
                      ) : isHotel ? (
                        <Building className="w-3.5 h-3.5" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] uppercase font-bold text-[var(--primary)]">
                          Day {item.day_index + 1} • {item.type}
                        </span>
                        {item.cost_estimate > 0 && (
                          <span className="font-bold text-[var(--text)]">
                            ₹{item.cost_estimate.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-[var(--text)] truncate">{item.title}</p>
                      {item.notes && (
                        <p className="text-[10px] text-[var(--text-muted)] truncate">{item.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-5 border-t border-[var(--border)] bg-[var(--bg)] space-y-2.5">
          <div className="flex items-center justify-between text-xs pb-1">
            <span className="text-[var(--text-muted)]">Subtotal ({items.length} items):</span>
            <span className="text-base font-black text-[var(--text)]">
              ₹{totalCost.toLocaleString('en-IN')}
            </span>
          </div>

          {activeTrip && (
            <div className="grid grid-cols-2 gap-2">
              <Link
                to={`/trip/${activeTrip.id}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text)] hover:border-[var(--primary)] transition-all shadow-xs"
              >
                <Compass className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>Day Board</span>
              </Link>

              <Link
                to={`/trip/${activeTrip.id}/bill`}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold bg-[var(--primary)] text-[#FDFBD4] rounded-xl hover:bg-[var(--primary-strong)] transition-all shadow-xs"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Estimate Bill</span>
              </Link>
            </div>
          )}

          <Link
            to="/trips"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors pt-1"
          >
            <span>View all planned trips</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </>
  );
};
