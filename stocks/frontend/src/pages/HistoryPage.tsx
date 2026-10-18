import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  History, 
  Compass, 
  Calendar, 
  ArrowRight, 
  Receipt, 
  IndianRupee, 
  CheckCircle2, 
  MapPin,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { Trip } from '../types';
import { Button } from '../components/ui/Button';
import { InvoicePreviewModal } from '../components/billing/InvoicePreviewModal';

export const HistoryPage: React.FC = () => {
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['my-trips'],
    queryFn: () => apiClient.get<Trip[]>('/trips')
  });

  const [selectedTripForInvoice, setSelectedTripForInvoice] = useState<Trip | null>(null);

  const completedOrBookedTrips = trips.filter(
    t => t.status === 'booked' || t.status === 'completed'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Past Travels & Confirmed Bookings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Settled itineraries, electronic ticket receipts, and travel expenditure records.
          </p>
        </div>

        <Link to="/trips">
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Compass className="w-4 h-4" />
            <span>Active Itineraries ({trips.length})</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[var(--text-muted)]">Loading travel history and billing records...</p>
        </div>
      ) : completedOrBookedTrips.length === 0 ? (
        /* Empty State */
        <div className="p-12 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border)] text-center space-y-4 max-w-lg mx-auto shadow-warm">
          <div className="w-16 h-16 rounded-full bg-[var(--bg)] mx-auto flex items-center justify-center border border-[var(--border)]">
            <History className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[var(--text)]">No confirmed travel records yet</h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              When you confirm and settle a trip bill, your electronic receipts, tickets, and travel history will be archived here.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link to="/trips">
              <Button size="md" className="gap-1.5">
                <span>View My Planned Trips</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Confirmed Bookings & Invoices Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedOrBookedTrips.map((trip) => {
            const totalBill = (trip.items || []).reduce((sum, it) => sum + (it.cost_estimate || 0), 0);
            const gst = Math.round(totalBill * 0.05);
            const grandTotal = totalBill + gst;

            return (
              <div
                key={trip.id}
                className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--primary)] transition-all shadow-xs flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 uppercase tracking-wide">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{trip.status === 'booked' ? 'Confirmed Booking' : 'Completed Trip'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      TW-{trip.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--text)] tracking-tight group-hover:text-[var(--primary)] transition-colors">
                      {trip.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>{trip.start_date} to {trip.end_date}</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Settled Amount:</span>
                    <span className="flex items-center font-bold text-[var(--text)] font-mono text-sm">
                      <IndianRupee className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTripForInvoice(trip)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-[var(--primary)] text-[#FDFBD4] hover:bg-[var(--primary-strong)] transition-all shadow-xs"
                    title="View and download official TripWise tax invoice"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Official Receipt</span>
                  </button>

                  <Link
                    to={`/trip/${trip.id}/bill`}
                    className="p-2 rounded-xl text-xs font-semibold border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-all"
                    title="Open Detailed Breakdown"
                  >
                    <FileText className="w-4 h-4 text-[var(--primary)]" />
                  </Link>

                  <Link
                    to={`/trip/${trip.id}`}
                    className="p-2 rounded-xl text-xs font-semibold border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text)] transition-all"
                    title="Open Itinerary Board"
                  >
                    <Compass className="w-4 h-4 text-[var(--primary)]" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Corporate Tax Invoice Modal */}
      {selectedTripForInvoice && (
        <InvoicePreviewModal
          isOpen={Boolean(selectedTripForInvoice)}
          onClose={() => setSelectedTripForInvoice(null)}
          trip={selectedTripForInvoice}
          userName="Demo Traveller"
          userEmail="demo.traveller@tripwise.local"
        />
      )}
    </div>
  );
};
