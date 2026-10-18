import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Receipt, 
  IndianRupee, 
  Plane, 
  Building, 
  MapPin, 
  Utensils, 
  Car, 
  Calendar, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Printer, 
  Download, 
  AlertCircle, 
  Sparkles, 
  CreditCard,
  Check,
  Compass,
  FileCheck2,
  Loader2
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { Trip, TripItem, DestinationResponse } from '../types';
import { useToastStore } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { TripWiseInvoiceReceipt } from '../components/billing/TripWiseInvoiceReceipt';
import { InvoicePreviewModal } from '../components/billing/InvoicePreviewModal';
import { downloadElementAsPDF } from '../lib/pdfGenerator';

export const TripBillPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // 1. Fetch Trip details
  const { 
    data: trip, 
    isLoading: tripLoading, 
    error: tripError 
  } = useQuery({
    queryKey: ['trip-bill', tripId],
    queryFn: () => apiClient.get<Trip>(`/trips/${tripId}`),
    enabled: Boolean(tripId && tripId !== 'new'),
  });

  // 2. Fetch Destination details with resilient fallback
  const { 
    data: destination 
  } = useQuery({
    queryKey: ['destination-bill', trip?.destination_id, trip?.title],
    queryFn: async () => {
      if (!trip?.destination_id) return null;
      try {
        return await apiClient.get<DestinationResponse>(`/destinations/${trip.destination_id}`);
      } catch {
        const queryTerm = trip.title.replace(' Trip', '').replace(' Vacation', '').replace(' Exploration', '').trim();
        const searchRes = await apiClient.get<DestinationResponse[]>(`/destinations/search?q=${encodeURIComponent(queryTerm)}`);
        if (searchRes && searchRes.length > 0) {
          return searchRes[0];
        }
        return null;
      }
    },
    enabled: Boolean(trip?.destination_id),
  });

  // Mutation to mark trip as booked/paid
  const bookTripMutation = useMutation({
    mutationFn: async () => {
      if (!trip) return;
      return await apiClient.patch<Trip>(`/trips/${trip.id}`, {
        status: 'booked'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-bill', tripId] });
      queryClient.invalidateQueries({ queryKey: ['my-trips'] });
      setPaymentSuccess(true);
      addToast({
        type: 'success',
        message: 'Payment confirmed! Electronic tickets and receipts generated.'
      });
    }
  });

  const handleConfirmPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      bookTripMutation.mutate();
    }, 1200);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDirectDownloadPDF = async () => {
    if (!trip) return;
    const el = document.getElementById('tripwise-modal-invoice-paper') || document.getElementById('tripwise-bill-download-target');
    if (!el) {
      setShowInvoiceModal(true);
      return;
    }

    try {
      setIsDownloadingPdf(true);
      const invoiceNumber = `TW-INV-2026-${trip.id.substring(0, 8).toUpperCase()}`;
      const filename = `TripWise_Tax_Invoice_${invoiceNumber}.pdf`;
      await downloadElementAsPDF(el, filename);
      addToast({
        type: 'success',
        message: `Official Tax Invoice downloaded: ${filename}`
      });
    } catch (err) {
      console.error('PDF download error:', err);
      addToast({
        type: 'error',
        message: 'Could not generate PDF directly. Opening document preview...'
      });
      setShowInvoiceModal(true);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (tripLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        <h3 className="text-base font-bold text-[var(--text)]">Loading Estimated Bill</h3>
        <p className="text-xs text-[var(--text-muted)]">
          Aggregating flight fares, hotel stays, activity passes, and tax breakdowns...
        </p>
      </div>
    );
  }

  if (tripError || !trip) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-[var(--bg-elevated)] border border-red-300 dark:border-red-900 rounded-3xl text-center space-y-4 shadow-warm">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
        <h3 className="text-lg font-bold text-[var(--text)]">Trip Not Found</h3>
        <p className="text-xs text-[var(--text-muted)]">
          Unable to locate the requested itinerary. It may have been deleted or created in another session.
        </p>
        <div className="pt-2">
          <Link to="/trips">
            <Button size="sm">Back to My Trips</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Categorise items
  const items = trip.items || [];
  const flightItems = items.filter(it => it.type === 'flight');
  const hotelItems = items.filter(it => it.type === 'hotel');
  const activityItems = items.filter(it => it.type === 'place' || it.type === 'event');
  const diningItems = items.filter(it => it.type === 'restaurant');
  const transitItems = items.filter(it => it.type === 'cab');

  // Compute category totals
  const flightsCost = flightItems.reduce((acc, it) => acc + (it.cost_estimate || 0), 0);
  const hotelsCost = hotelItems.reduce((acc, it) => acc + (it.cost_estimate || 0), 0);
  const activitiesCost = activityItems.reduce((acc, it) => acc + (it.cost_estimate || 0), 0);
  const diningCost = diningItems.reduce((acc, it) => acc + (it.cost_estimate || 0), 0);
  const transitCost = transitItems.reduce((acc, it) => acc + (it.cost_estimate || 0), 0);

  const subtotal = flightsCost + hotelsCost + activitiesCost + diningCost + transitCost;
  const platformFee = 0; // TripWise transparent promise
  const gstTax = Math.round(subtotal * 0.05); // 5% GST estimate
  const grandTotal = subtotal + platformFee + gstTax;

  const budget = trip.budget || 0;
  const isOverBudget = budget > 0 && grandTotal > budget;
  const budgetDiff = Math.abs(grandTotal - budget);

  const destinationName = destination?.name || trip.title.replace(' Trip', '').replace(' Vacation', '') || 'Your Destination';
  const destinationCountry = destination?.country || 'India';
  const heroImage = destination?.hero_image_url || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80';
  const heroAttribution = destination?.hero_image_attribution || 'Authentic travel photography';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Action Strip (Hidden when printing) */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <button
          type="button"
          onClick={() => navigate(`/trip/${trip.id}`)}
          className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-1.5 rounded-xl hover:bg-[var(--bg-elevated)]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Day Board</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowInvoiceModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] rounded-xl hover:border-[var(--primary)] transition-all shadow-xs"
            title="Preview official TripWise tax invoice"
          >
            <Receipt className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span className="hidden sm:inline">Preview</span> Tax Invoice
          </button>

          <button
            type="button"
            onClick={handleDirectDownloadPDF}
            disabled={isDownloadingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] rounded-xl hover:border-[var(--primary)] transition-all shadow-xs disabled:opacity-50"
            title="Download PDF Tax Invoice"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] rounded-xl hover:border-[var(--primary)] transition-all shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Print</span>
          </button>

          {trip.status !== 'booked' && (
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isProcessingPayment}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-[var(--primary)] text-[#FDFBD4] rounded-xl hover:bg-[var(--primary-strong)] transition-all shadow-xs disabled:opacity-50"
            >
              {isProcessingPayment ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#FDFBD4] border-t-transparent rounded-full animate-spin" />
                  <span>Processing Checkout...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Confirm & Settle Bill</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="p-6 sm:p-10 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-warm-lg space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* Banner with Destination Photography & Invoice Meta */}
        <div className="relative rounded-2xl overflow-hidden bg-[var(--bg)] border border-[var(--border)]">
          <div className="h-44 sm:h-56 w-full relative">
            <img
              src={heroImage}
              alt={destinationName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#FDFBD4] bg-[var(--primary)]/90 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Destination Itinerary Bill
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
                  {destinationName}, {destinationCountry}
                </h1>
                <p className="text-xs text-white/80 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FDFBD4]" />
                  <span>{trip.title}</span>
                </p>
              </div>

              <div className="flex flex-col sm:items-end">
                <span className="text-[10px] text-white/70 uppercase tracking-wider font-mono">Invoice Reference</span>
                <span className="text-xs font-mono font-bold text-[#FDFBD4]">
                  TW-{trip.id.substring(0, 8).toUpperCase()}-2026
                </span>
                <span className="text-[9px] text-white/60 mt-0.5">{heroAttribution}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[var(--bg-elevated)] border-t border-[var(--border)] text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block uppercase font-semibold">Travel Dates</span>
                <span className="font-bold text-[var(--text)]">{trip.start_date} to {trip.end_date}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block uppercase font-semibold">Travellers</span>
                <span className="font-bold text-[var(--text)]">{trip.travellers_json?.adults || 1} Adult(s)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block uppercase font-semibold">Route & Class</span>
                <span className="font-bold text-[var(--text)] uppercase">{trip.origin_iata} → {destination?.iata_codes?.[0] || 'DEST'} ({trip.cabin})</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block uppercase font-semibold">Status</span>
                <span className={`font-bold capitalize ${trip.status === 'booked' ? 'text-emerald-600' : 'text-[var(--primary)]'}`}>
                  {trip.status === 'booked' ? 'Confirmed & Paid' : 'Draft Estimate'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Confirmation Banner */}
        {trip.status === 'booked' && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Booking Confirmed & Guaranteed</h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Electronic tickets and itinerary receipts are secured. No unexpected price increments.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-[11px] font-bold shrink-0">
              PAID IN FULL
            </span>
          </div>
        )}

        {/* Detailed Itemised Breakdown */}
        <div className="space-y-6">
          <div className="border-b border-[var(--border)] pb-2 flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[var(--primary)]" />
              <span>Itemised Travel Breakdown</span>
            </h2>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              {items.length} billable stops & bookings
            </span>
          </div>

          {/* Section 1: Flights */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
              <span className="flex items-center gap-1.5 text-[var(--primary)] uppercase tracking-wider text-[11px]">
                <Plane className="w-3.5 h-3.5" />
                <span>1. Aviation & Flights</span>
              </span>
              <span className="font-mono">₹{flightsCost.toLocaleString('en-IN')}</span>
            </div>

            {flightItems.length === 0 ? (
              <div className="p-3.5 rounded-xl border border-dashed border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>No flight added yet for this destination.</span>
                <Link
                  to={`/search?from=${trip.origin_iata}&to=${trip.destination_id}&tab=flights`}
                  className="text-xs font-semibold text-[var(--primary)] hover:underline"
                >
                  Find flights
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {flightItems.map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-[var(--text)]">{item.title}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Timing: {item.start_time} - {item.end_time} • {item.notes || 'Carrier Sandbox Order'}
                      </p>
                    </div>
                    <div className="text-right font-mono font-bold text-[var(--text)]">
                      ₹{(item.cost_estimate || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Accommodations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
              <span className="flex items-center gap-1.5 text-[var(--primary)] uppercase tracking-wider text-[11px]">
                <Building className="w-3.5 h-3.5" />
                <span>2. Accommodations & Stays</span>
              </span>
              <span className="font-mono">₹{hotelsCost.toLocaleString('en-IN')}</span>
            </div>

            {hotelItems.length === 0 ? (
              <div className="p-3.5 rounded-xl border border-dashed border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>No hotel stay added yet for this destination.</span>
                <Link
                  to={`/search?to=${trip.destination_id}&tab=stays`}
                  className="text-xs font-semibold text-[var(--primary)] hover:underline"
                >
                  Discover verified stays
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {hotelItems.map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-[var(--text)]">{item.title}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {item.notes || 'Verified Stay with TripWise Bayesian Quality Index'}
                      </p>
                    </div>
                    <div className="text-right font-mono font-bold text-[var(--text)]">
                      ₹{(item.cost_estimate || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Sightseeing & Monuments */}
          {activityItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
                <span className="flex items-center gap-1.5 text-[var(--primary)] uppercase tracking-wider text-[11px]">
                  <Compass className="w-3.5 h-3.5" />
                  <span>3. Sightseeing, Sights & Monuments</span>
                </span>
                <span className="font-mono">₹{activitiesCost.toLocaleString('en-IN')}</span>
              </div>

              <div className="space-y-2">
                {activityItems.map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-[var(--text)]">{item.title}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Day {item.day_index + 1} • {item.start_time} - {item.end_time} ({item.duration_minutes} mins)
                      </p>
                    </div>
                    <div className="text-right font-mono font-bold text-[var(--text)]">
                      {item.cost_estimate > 0 ? `₹${item.cost_estimate.toLocaleString('en-IN')}` : 'Included / Free'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Dining & Food */}
          {diningItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
                <span className="flex items-center gap-1.5 text-[var(--primary)] uppercase tracking-wider text-[11px]">
                  <Utensils className="w-3.5 h-3.5" />
                  <span>4. Dining & Culinary Experiences</span>
                </span>
                <span className="font-mono">₹{diningCost.toLocaleString('en-IN')}</span>
              </div>

              <div className="space-y-2">
                {diningItems.map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-[var(--text)]">{item.title}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Day {item.day_index + 1} • {item.notes || 'Local culinary budget'}
                      </p>
                    </div>
                    <div className="text-right font-mono font-bold text-[var(--text)]">
                      ₹{(item.cost_estimate || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Calculation Summary Table */}
        <div className="p-6 rounded-2xl bg-[var(--bg)] border border-[var(--border)] space-y-3">
          <div className="flex justify-between items-center text-xs text-[var(--text-muted)]">
            <span>Net Travel Subtotal</span>
            <span className="font-mono font-medium text-[var(--text)]">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <span>TripWise Service Fee</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                100% FREE
              </span>
            </span>
            <span className="font-mono font-medium text-emerald-600">₹0</span>
          </div>

          <div className="flex justify-between items-center text-xs text-[var(--text-muted)]">
            <span>Estimated Aviation Taxes & GST (5%)</span>
            <span className="font-mono font-medium text-[var(--text)]">₹{gstTax.toLocaleString('en-IN')}</span>
          </div>

          <div className="pt-3 border-t border-[var(--border)] flex justify-between items-center text-base sm:text-lg font-black text-[var(--text)]">
            <div className="space-y-0.5">
              <span>Total Estimated Bill</span>
              <p className="text-[11px] font-normal text-[var(--text-muted)]">
                Transparent price guarantee. All taxes and sandbox PNR reservations included.
              </p>
            </div>
            <div className="flex items-center text-[var(--primary)] text-xl sm:text-2xl font-black">
              <IndianRupee className="w-5 h-5" />
              <span className="tabular-nums">{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Budget Comparison Alert */}
          {budget > 0 && (
            <div className={`mt-3 p-3 rounded-xl border text-xs flex items-center justify-between ${
              isOverBudget
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            }`}>
              <span className="font-medium">
                Target Budget: ₹{budget.toLocaleString('en-IN')}
              </span>
              <span className="font-bold">
                {isOverBudget ? `Over budget by ₹${budgetDiff.toLocaleString('en-IN')}` : `Within budget by ₹${budgetDiff.toLocaleString('en-IN')}`}
              </span>
            </div>
          )}
        </div>

        {/* Official Corporate Tax Invoice Card */}
        <div className="p-5 rounded-2xl bg-[#FDFBD4]/60 dark:bg-amber-950/20 border border-[#C05800]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-xs print:hidden">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0 mt-0.5 sm:mt-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[var(--text)]">Official Corporate Tax Invoice & Receipt</h4>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#713600] bg-[#FDFBD4] px-2 py-0.2 rounded border border-[#C05800]/30">
                  SAC 998555
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Compliant with Rule 46 of CGST Rules, 2017. Includes CIN, GSTIN, tax breakdown, and digital signatory seal for corporate reimbursement.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowInvoiceModal(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-[var(--primary)] bg-[var(--bg-elevated)] border border-[var(--primary)]/40 rounded-xl hover:bg-[var(--primary)] hover:text-[#FDFBD4] transition-all flex items-center justify-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Preview Bill</span>
            </button>
            <button
              type="button"
              onClick={handleDirectDownloadPDF}
              disabled={isDownloadingPdf}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold bg-[var(--primary)] text-[#FDFBD4] rounded-xl hover:bg-[var(--primary-strong)] transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FDFBD4]" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--border)] print:hidden">
          <Link
            to={`/trip/${trip.id}`}
            className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Itinerary Board</span>
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowInvoiceModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--primary)] text-[var(--text)] rounded-xl transition-all shadow-xs"
            >
              <Receipt className="w-4 h-4 text-[var(--primary)]" />
              <span>Preview Official Bill</span>
            </button>

            <button
              type="button"
              onClick={handleDirectDownloadPDF}
              disabled={isDownloadingPdf}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--primary)] text-[var(--text)] rounded-xl transition-all shadow-xs disabled:opacity-50"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[var(--primary)]" />
                  <span>Download Receipt (PDF)</span>
                </>
              )}
            </button>

            {trip.status !== 'booked' && (
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isProcessingPayment}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold bg-[var(--primary)] text-[#FDFBD4] hover:bg-[var(--primary-strong)] rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <span>Authorizing Checkout...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Settle Bill</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Off-screen Pre-rendered Target for Crisp Direct PDF Downloads */}
      <div 
        className="fixed left-[-9999px] top-0 pointer-events-none opacity-0 select-none" 
        aria-hidden="true"
      >
        <TripWiseInvoiceReceipt
          id="tripwise-bill-download-target"
          trip={trip}
          destination={destination}
          userName="Demo Traveller"
          userEmail="demo.traveller@tripwise.local"
        />
      </div>

      {/* Interactive Corporate Bill & Tax Invoice Preview Modal */}
      <InvoicePreviewModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        trip={trip}
        destination={destination}
        userName="Demo Traveller"
        userEmail="demo.traveller@tripwise.local"
      />
    </div>
  );
};
