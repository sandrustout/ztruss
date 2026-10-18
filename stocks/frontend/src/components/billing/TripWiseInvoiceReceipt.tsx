import React from 'react';
import { 
  Plane, 
  Building, 
  MapPin, 
  Utensils, 
  Car, 
  ShieldCheck, 
  CheckCircle2, 
  Compass,
  FileCheck2
} from 'lucide-react';
import { Trip, TripItem, DestinationResponse } from '../../types';
import { numberToWordsINR } from '../../utils/numberToWords';

interface TripWiseInvoiceReceiptProps {
  trip: Trip;
  destination?: DestinationResponse | null;
  invoiceRef?: string;
  invoiceDate?: string;
  userName?: string;
  userEmail?: string;
  id?: string;
}

export const TripWiseInvoiceReceipt: React.FC<TripWiseInvoiceReceiptProps> = ({
  trip,
  destination,
  invoiceRef,
  invoiceDate,
  userName = 'Demo Traveller',
  userEmail = 'demo.traveller@tripwise.local',
  id = 'tripwise-official-invoice'
}) => {
  const items = trip.items || [];
  const flightItems = items.filter(it => it.type === 'flight');
  const hotelItems = items.filter(it => it.type === 'hotel');
  const activityItems = items.filter(it => it.type === 'place' || it.type === 'event');
  const diningItems = items.filter(it => it.type === 'restaurant');
  const transitItems = items.filter(it => it.type === 'cab');

  const flightsCost = flightItems.reduce((acc, it) => acc + (it.cost_estimate || 0), 0);
  const hotelsCost = hotelItems.reduce((acc, it) => acc + (it.cost_estimate || 0), 0);
  const activitiesCost = activityItems.reduce((acc, it) => acc + (it.cost_estimate || 0), 0);
  const diningCost = diningItems.reduce((acc, it) => acc + (it.cost_estimate || 0), 0);
  const transitCost = transitItems.reduce((acc, it) => acc + (it.cost_estimate || 0), 0);

  const subtotal = flightsCost + hotelsCost + activitiesCost + diningCost + transitCost;
  const platformFee = 0.00;
  const cgst = Math.round(subtotal * 0.025);
  const sgst = Math.round(subtotal * 0.025);
  const totalTax = cgst + sgst;
  const grandTotal = subtotal + platformFee + totalTax;

  const invNumber = invoiceRef || `TW-INV-2026-${trip.id.substring(0, 8).toUpperCase()}`;
  const invDateFormatted = invoiceDate || new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const destName = destination?.name || trip.title.replace(' Trip', '').replace(' Vacation', '').replace(' Exploration', '') || 'Destination';
  const destCountry = destination?.country || 'India';
  const destIata = destination?.iata_codes?.[0] || 'DEST';
  const originIata = trip.origin_iata || 'MAA';

  const amountInWords = numberToWordsINR(grandTotal);
  const pnrReference = `TW-${trip.id.substring(0, 6).toUpperCase()}-PNR`;
  const txnReference = `TXN-TW-${trip.id.substring(0, 10).toUpperCase()}-982`;

  const isConfirmed = trip.status === 'booked' || trip.status === 'completed';

  return (
    <div 
      id={id}
      className="w-full max-w-[800px] mx-auto bg-white text-slate-900 p-8 sm:p-10 font-sans shadow-sm border border-slate-200 rounded-xl print:border-none print:shadow-none print:p-0 print:m-0"
      style={{ minHeight: '1050px', backgroundColor: '#ffffff' }}
    >
      {/* 1. Official Corporate Header */}
      <div className="border-b-2 border-[#713600] pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-[#713600]">
              Trip<span className="text-[#C05800]">Wise</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#713600] bg-[#FDFBD4] px-2 py-0.5 rounded border border-[#C05800]/30">
              Verified E-Invoice
            </span>
          </div>
          <h1 className="text-xs font-bold uppercase tracking-wider text-slate-700 mt-1">
            TripWise Technologies Private Limited
          </h1>
          <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm mt-0.5">
            Registered Office: Tower B, 4th Floor, Global Tech Village, Outer Ring Road, Bengaluru, Karnataka - 560103, India
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-600 font-mono mt-1.5">
            <span><b>CIN:</b> U74999KA2026PTC184920</span>
            <span>•</span>
            <span><b>GSTIN:</b> 29AAACT9821M1Z5</span>
            <span>•</span>
            <span><b>SAC:</b> 998555</span>
          </div>
        </div>

        {/* Invoice Metadata Box */}
        <div className="text-left sm:text-right space-y-1 sm:min-w-[210px] border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
          <div className="text-sm font-black text-slate-800 tracking-tight uppercase">
            Tax Invoice & Receipt
          </div>
          <div className="text-xs font-mono font-bold text-[#713600]">
            {invNumber}
          </div>
          <p className="text-[10px] text-slate-500">
            Issue Date: <strong className="text-slate-700">{invDateFormatted}</strong>
          </p>
          <p className="text-[10px] text-slate-500 font-mono">
            Booking Ref: <strong className="text-slate-700">{pnrReference}</strong>
          </p>
          <div className="pt-1">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isConfirmed 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              <CheckCircle2 className="w-3 h-3" />
              <span>{isConfirmed ? 'Confirmed & Paid' : 'Draft Estimate'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Customer & Journey Meta Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs">
        {/* Customer Information */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Billed To (Passenger Details)
          </span>
          <p className="font-bold text-slate-900 text-sm">{userName}</p>
          <p className="text-slate-600 text-[11px] font-mono">{userEmail}</p>
          <p className="text-slate-500 text-[11px]">Contact: +91 98765 43210</p>
          <p className="text-slate-500 text-[10px]">Place of Supply: <b>Karnataka (29) / Destination ({destCountry})</b></p>
        </div>

        {/* Journey Details */}
        <div className="space-y-1 sm:text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Travel Route & Schedule
          </span>
          <p className="font-bold text-slate-900 text-sm">
            {originIata} <span className="text-[#C05800]">→</span> {destName} ({destIata})
          </p>
          <p className="text-slate-700 text-[11px]">
            {trip.title}
          </p>
          <p className="text-slate-500 text-[11px]">
            Travel Dates: <b>{trip.start_date}</b> to <b>{trip.end_date}</b>
          </p>
          <p className="text-slate-500 text-[10px]">
            Pax: <b>{trip.travellers_json?.adults || 1} Adult(s)</b> • Cabin: <b className="uppercase">{trip.cabin}</b>
          </p>
        </div>
      </div>

      {/* 3. Official Itemized Breakdown Table */}
      <div className="py-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center justify-between">
          <span>Itemized Travel Schedule & Services</span>
          <span className="text-[10px] font-normal text-slate-400">Currency: Indian Rupee (INR)</span>
        </h2>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-y border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Service Description</th>
              <th className="py-2.5 px-2 text-center w-16">SAC</th>
              <th className="py-2.5 px-2 text-center w-20">Category</th>
              <th className="py-2.5 px-2 text-center w-12">Qty</th>
              <th className="py-2.5 px-3 text-right w-24">Rate (₹)</th>
              <th className="py-2.5 px-3 text-right w-24">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400 text-xs italic">
                  No scheduled stops or reservations recorded for this itinerary.
                </td>
              </tr>
            ) : (
              items.map((item: TripItem, idx: number) => {
                const isFlight = item.type === 'flight';
                const isHotel = item.type === 'hotel';
                const isActivity = item.type === 'place' || item.type === 'event';
                const isDining = item.type === 'restaurant';

                const sacCode = isFlight ? '998552' : isHotel ? '996311' : isActivity ? '998555' : '996412';
                const cost = item.cost_estimate || 0;

                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center text-[11px] font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800 text-[11px]">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Day {item.day_index + 1} {item.start_time ? `• ${item.start_time}` : ''} {item.notes ? `• ${item.notes}` : ''}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-[10px] text-slate-500">
                      {sacCode}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="capitalize text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-600">
                      1
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-700">
                      {cost > 0 ? cost.toLocaleString('en-IN') : '0.00'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 text-[11px]">
                      {cost > 0 ? cost.toLocaleString('en-IN') : '0.00'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Tax & Totals Calculation Box */}
      <div className="border-t border-slate-300 pt-4 flex flex-col sm:flex-row justify-between gap-6 text-xs">
        {/* Payment & Amount in Words */}
        <div className="flex-1 space-y-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Amount Chargeable (in words)
            </span>
            <p className="font-bold text-slate-800 text-xs italic">
              {amountInWords}
            </p>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200 text-emerald-900 space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Payment Settlement Record</span>
              </span>
              <span className="font-mono font-bold text-[10px] text-emerald-700">
                {isConfirmed ? 'PAID & CLEARED' : 'PENDING PAYMENT'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-emerald-800 pt-1 font-mono">
              <div>Mode: <b>Online / Card / UPI</b></div>
              <div>Txn Ref: <b>{txnReference}</b></div>
              <div>Balance Due: <b>₹0.00 (Nil)</b></div>
              <div>Status: <b>Settled in Full</b></div>
            </div>
          </div>
        </div>

        {/* Calculation Summary Table */}
        <div className="w-full sm:w-72 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-600">Net Taxable Value</span>
            <span className="font-mono font-semibold text-slate-800">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-600">Central GST (CGST @ 2.5%)</span>
            <span className="font-mono font-semibold text-slate-800">₹{cgst.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-600">State GST (SGST @ 2.5%)</span>
            <span className="font-mono font-semibold text-slate-800">₹{sgst.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-600 flex items-center gap-1">
              <span>TripWise Service Fee</span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded">0% FREE</span>
            </span>
            <span className="font-mono font-semibold text-emerald-700">₹0.00</span>
          </div>

          <div className="flex justify-between items-center py-2 border-t-2 border-[#713600] text-sm">
            <span className="font-black text-slate-900">Total Invoice Value</span>
            <span className="font-black text-base text-[#713600] font-mono">
              ₹{grandTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Terms, Support & Official Company Seal */}
      <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-start justify-between gap-6 text-[10px] text-slate-500">
        <div className="space-y-1.5 max-w-md">
          <p className="font-bold uppercase tracking-wider text-slate-700">
            Terms & Conditions & Important Passenger Notes:
          </p>
          <ul className="space-y-0.5 list-disc pl-3.5 leading-relaxed">
            <li>This document serves as an authentic Tax Invoice under Rule 46 of CGST Rules, 2017.</li>
            <li>For airport security and airline check-in, present your official Duffel/Amadeus PNR and a valid government photo ID.</li>
            <li>Accommodations require primary guest identification upon check-in per local hotel hospitality regulations.</li>
            <li>For support, ticket reissuance, or cancellations, contact <b>billing@tripwise.travel</b> quoting Invoice <b>{invNumber}</b>.</li>
          </ul>
        </div>

        {/* Digital Signature & Certification Stamp */}
        <div className="text-center sm:text-right w-full sm:w-auto shrink-0 space-y-1">
          <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/70 inline-block text-center">
            <div className="w-24 h-7 mx-auto flex items-center justify-center font-serif italic text-slate-700 font-bold border-b border-slate-300 pb-1">
              TripWise Auth
            </div>
            <p className="text-[9px] font-bold uppercase text-slate-700 mt-1">
              Authorized Signatory
            </p>
            <p className="text-[8px] text-slate-400">
              TripWise Technologies Pvt. Ltd.
            </p>
          </div>
          <p className="text-[8px] text-slate-400 italic">
            Computer-generated electronic invoice. No physical signature required.
          </p>
        </div>
      </div>
    </div>
  );
};
