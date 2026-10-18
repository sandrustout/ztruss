import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  CheckCircle2, 
  FileText, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { Trip, DestinationResponse } from '../../types';
import { TripWiseInvoiceReceipt } from './TripWiseInvoiceReceipt';
import { downloadElementAsPDF } from '../../lib/pdfGenerator';
import { useToastStore } from '../ui/Toast';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  destination?: DestinationResponse | null;
  userName?: string;
  userEmail?: string;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  trip,
  destination,
  userName = 'Demo Traveller',
  userEmail = 'demo.traveller@tripwise.local'
}) => {
  const receiptContainerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { addToast } = useToastStore();

  if (!isOpen) return null;

  const invoiceNumber = `TW-INV-2026-${trip.id.substring(0, 8).toUpperCase()}`;

  const handleDownloadPDF = async () => {
    const el = document.getElementById('tripwise-modal-invoice-paper');
    if (!el) return;

    try {
      setIsDownloading(true);
      const filename = `TripWise_Tax_Invoice_${invoiceNumber}.pdf`;
      await downloadElementAsPDF(el, filename);
      addToast({
        type: 'success',
        message: `Tax Invoice downloaded successfully: ${filename}`
      });
    } catch (err: any) {
      console.error('PDF Generation failed:', err);
      addToast({
        type: 'error',
        message: 'Could not generate PDF. Please try the Print option to Save as PDF.'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:px-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg)] shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--text)] tracking-tight">
                Official Company Bill & Tax Receipt Preview
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">
                {invoiceNumber} • TripWise Technologies Pvt. Ltd.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] rounded-xl hover:border-[var(--primary)] transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span className="hidden sm:inline">Print / Save as PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-[var(--primary)] text-[#FDFBD4] rounded-xl hover:bg-[var(--primary-strong)] transition-all shadow-xs disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors border border-[var(--border)] ml-1"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Body */}
        <div 
          ref={receiptContainerRef} 
          className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-stone-900/50 flex justify-center"
        >
          <div className="w-full shadow-2xl rounded-xl overflow-hidden">
            <TripWiseInvoiceReceipt
              id="tripwise-modal-invoice-paper"
              trip={trip}
              destination={destination}
              invoiceRef={invoiceNumber}
              userName={userName}
              userEmail={userEmail}
            />
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="px-6 py-2.5 border-t border-[var(--border)] bg-[var(--bg)] flex items-center justify-between text-[11px] text-[var(--text-muted)] print:hidden">
          <span>Official GST Tax Invoice format compliant with Rule 46 of CGST Rules, 2017.</span>
          <span className="font-mono text-[var(--primary)] font-semibold">100% Verified Receipt</span>
        </div>
      </div>
    </div>
  );
};
