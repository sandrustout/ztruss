import React, { useState } from 'react';
import { 
  X, 
  Plane, 
  ShieldCheck, 
  CheckCircle, 
  Clock, 
  IndianRupee, 
  AlertCircle, 
  Briefcase, 
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  ArrowRight,
  Download
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { FlightOffer, PassengerDetails, FlightBookingResponse } from '../../types';

interface FlightBookingModalProps {
  offer: FlightOffer | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToTrip?: (offer: FlightOffer, bookingResponse?: FlightBookingResponse) => void;
}

export const FlightBookingModal: React.FC<FlightBookingModalProps> = ({
  offer,
  isOpen,
  onClose,
  onAddToTrip,
}) => {
  const [passenger, setPassenger] = useState<PassengerDetails>({
    title: 'mr',
    given_name: 'Aditya',
    family_name: 'Sharma',
    born_on: '1995-06-15',
    gender: 'm',
    email: 'aditya.sharma@example.com',
    phone: '+919876543210'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<FlightBookingResponse | null>(null);

  if (!isOpen || !offer) return null;

  const handleInputChange = (field: keyof PassengerDetails, value: string) => {
    setPassenger(prev => ({ ...prev, [field]: value }));
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiClient.post<FlightBookingResponse>('/flights/book-sandbox', {
        offer_id: offer.id,
        passengers: [passenger]
      });

      setConfirmedBooking(response);
    } catch (err: any) {
      setError(err.message || 'Failed to complete sandbox booking.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmedBooking(null);
    setError(null);
    onClose();
  };

  const formatTime = (isoString: string) => {
    try {
      if (isoString.includes('T')) {
        return isoString.split('T')[1].substring(0, 5);
      }
      return isoString;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text)]">
                {confirmedBooking ? 'Confirmed Aviation E-Ticket' : 'Duffel Sandbox Aviation Checkout'}
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                {offer.airline_name} • {offer.flight_number} • {offer.origin_iata} → {offer.destination_iata}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* SUCCESS / CONFIRMED E-TICKET VIEW */}
          {confirmedBooking ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Confirmed Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Duffel Sandbox Booking Successfully Confirmed!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {confirmedBooking.confirmation_message}
                  </p>
                </div>
              </div>

              {/* Electronic Boarding Pass */}
              <div className="border-2 border-dashed border-[var(--border)] rounded-2xl p-5 bg-[var(--bg)] space-y-4">
                <div className="flex justify-between items-start pb-4 border-b border-[var(--border)]">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--primary)]">
                      Electronic Ticket
                    </span>
                    <h3 className="text-lg font-black text-[var(--text)]">
                      {confirmedBooking.airline_name} ({confirmedBooking.flight_number})
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Passenger: <strong className="text-[var(--text)]">{passenger.given_name} {passenger.family_name}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">
                      Booking Reference (PNR)
                    </span>
                    <div className="text-2xl font-black font-mono text-[var(--primary)] tracking-wider">
                      {confirmedBooking.booking_reference}
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      Order: {confirmedBooking.order_id}
                    </span>
                  </div>
                </div>

                {/* Flight Route Details */}
                <div className="grid grid-cols-3 gap-2 text-center py-2">
                  <div className="text-left">
                    <span className="text-[10px] uppercase text-[var(--text-muted)] font-semibold">Origin</span>
                    <p className="text-xl font-bold text-[var(--text)]">{offer.origin_iata}</p>
                    <p className="text-xs text-[var(--text-muted)]">{offer.origin_city}</p>
                    <p className="text-xs font-mono font-semibold text-[var(--text)]">{formatTime(offer.departure_time)}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {Math.floor(offer.duration_minutes / 60)}h {offer.duration_minutes % 60}m
                    </span>
                    <div className="w-full flex items-center justify-center my-1">
                      <div className="h-0.5 flex-1 bg-[var(--border)]" />
                      <Plane className="w-4 h-4 text-[var(--primary)] mx-1" />
                      <div className="h-0.5 flex-1 bg-[var(--border)]" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600">
                      {offer.stops === 0 ? 'Non-Stop' : `${offer.stops} Stop`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-[var(--text-muted)] font-semibold">Destination</span>
                    <p className="text-xl font-bold text-[var(--text)]">{offer.destination_iata}</p>
                    <p className="text-xs text-[var(--text-muted)]">{offer.destination_city}</p>
                    <p className="text-xs font-mono font-semibold text-[var(--text)]">{formatTime(offer.arrival_time)}</p>
                  </div>
                </div>

                {/* Documents & Fare Info */}
                <div className="pt-3 border-t border-[var(--border)] flex flex-wrap justify-between items-center text-xs text-[var(--text-muted)]">
                  <div>
                    {confirmedBooking.documents && confirmedBooking.documents.length > 0 ? (
                      <span className="font-mono">
                        E-Ticket: <strong className="text-[var(--text)]">{confirmedBooking.documents[0].number}</strong>
                      </span>
                    ) : (
                      <span>Class: <strong className="text-[var(--text)] uppercase">{offer.cabin_class}</strong></span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 font-bold text-[var(--text)]">
                    <span>Fare Settled:</span>
                    <IndianRupee className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span className="tabular-nums">₹{confirmedBooking.amount_paid_inr.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {onAddToTrip && (
                  <button
                    onClick={() => {
                      onAddToTrip(offer, confirmedBooking);
                      handleClose();
                    }}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-[var(--primary)] text-[#FDFBD4] hover:bg-[var(--primary-strong)] transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Add Confirmed Flight to Itinerary Day 1</span>
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="py-3 px-6 rounded-xl font-bold text-xs border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] hover:border-[var(--primary)] transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* BOOKING FORM VIEW */
            <form onSubmit={handleBooking} className="space-y-6">
              {/* Flight Summary Card */}
              <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: offer.airline_color || '#713600' }}
                    >
                      {offer.airline_code}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text)]">{offer.airline_name}</h4>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">{offer.flight_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[var(--text-muted)]">Total Guaranteed Price</span>
                    <div className="flex items-center justify-end text-lg font-bold text-[var(--text)] tabular-nums">
                      <IndianRupee className="w-4 h-4 text-[var(--primary)]" />
                      <span>{offer.price_inr.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs py-2 border-y border-[var(--border)]">
                  <div>
                    <span className="font-bold text-[var(--text)]">{formatTime(offer.departure_time)}</span>{' '}
                    <span className="text-[var(--text-muted)]">{offer.origin_iata}</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{Math.floor(offer.duration_minutes / 60)}h {offer.duration_minutes % 60}m</span>
                    <span>• {offer.stops === 0 ? 'Non-Stop' : `${offer.stops} Stop`}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[var(--text)]">{formatTime(offer.arrival_time)}</span>{' '}
                    <span className="text-[var(--text-muted)]">{offer.destination_iata}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>{offer.baggage_cabin_kg}kg cabin + {offer.baggage_checked_kg}kg check-in</span>
                  </span>
                  <span className="font-semibold text-emerald-600">Zero Convenience Fee Markup</span>
                </div>
              </div>

              {/* Sandbox Notice Banner */}
              <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--primary)]/30 flex items-start gap-2.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-[var(--primary)] mt-0.5 shrink-0" />
                <p className="text-[var(--text-muted)]">
                  <strong className="text-[var(--text)]">Duffel Sandbox Environment:</strong> This booking uses real Duffel API sandbox credentials. It creates a verified test order with instant PNR issuance without charging real payment methods.
                </p>
              </div>

              {/* Passenger Inputs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Passenger Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--text-muted)]">Title</label>
                    <select
                      value={passenger.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    >
                      <option value="mr">Mr.</option>
                      <option value="mrs">Mrs.</option>
                      <option value="ms">Ms.</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1.5 space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--text-muted)]">First Name</label>
                    <input
                      type="text"
                      required
                      value={passenger.given_name}
                      onChange={(e) => handleInputChange('given_name', e.target.value)}
                      className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div className="sm:col-span-1.5 space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--text-muted)]">Last Name</label>
                    <input
                      type="text"
                      required
                      value={passenger.family_name}
                      onChange={(e) => handleInputChange('family_name', e.target.value)}
                      className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--text-muted)]">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={passenger.born_on}
                      onChange={(e) => handleInputChange('born_on', e.target.value)}
                      className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--text-muted)]">Email (for E-Ticket)</label>
                    <input
                      type="email"
                      required
                      value={passenger.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--text-muted)]">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={passenger.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 border-t border-[var(--border)] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-[var(--primary)] text-[#FDFBD4] hover:bg-[var(--primary-strong)] disabled:opacity-50 transition-all shadow-xs"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#FDFBD4] border-t-transparent rounded-full animate-spin" />
                      <span>Generating Duffel PNR...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Duffel Sandbox Booking</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
