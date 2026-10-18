import React from 'react';
import { ShieldCheck, Database, Award, Info, BookOpen } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-bg-elevated border border-border text-xs font-semibold text-primary">
          <Award className="w-3.5 h-3.5" />
          <span>AWS Student Builder Group • VIT Chennai Submission</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
          About TripWise
        </h1>
        <p className="text-sm text-text-muted leading-relaxed">
          TripWise is an intelligent, multi-provider travel planning engine designed to eliminate opaque pricing, bloated itineraries, and unrealistic transit assumptions.
        </p>
      </div>

      {/* Track & Submission Specifications */}
      <section className="p-6 rounded-card bg-surface border border-border shadow-warm space-y-4">
        <h2 className="text-base font-bold text-text flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span>Recruitment Specifications (Track 3: Full-Stack)</span>
        </h2>
        <ul className="text-xs text-text-muted space-y-2 leading-relaxed">
          <li><strong>Architecture:</strong> React 18, TypeScript, Tailwind CSS, Python 3.11/FastAPI, and Supabase PostgreSQL.</li>
          <li><strong>Data Integrity:</strong> Real multi-provider external APIs behind typed backend adapters with rate-limit caching.</li>
          <li><strong>Security:</strong> Cryptographic JWT verification on all protected endpoints, Row Level Security (RLS) on all user tables, and zero secrets exposed in frontend bundles.</li>
          <li><strong>Reliability:</strong> Offline resilience, graceful degradation, and comprehensive error boundaries.</li>
        </ul>
      </section>

      {/* The TripWise Index Formula */}
      <section className="p-6 rounded-card bg-surface border border-border shadow-warm space-y-4">
        <h2 className="text-base font-bold text-text flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          <span>Transparent Hotel Ranking: The TripWise Index</span>
        </h2>
        <p className="text-xs text-text-muted leading-relaxed">
          Rather than relying on unverified affiliate placement, hotels are scored from 0 to 100 based on five deterministic signals:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-input bg-bg border border-border">
            <p className="font-semibold text-text">Price Percentile (30%)</p>
            <p className="text-[11px] text-text-muted">Normalized cost relative to all available options for chosen dates.</p>
          </div>
          <div className="p-3 rounded-input bg-bg border border-border">
            <p className="font-semibold text-text">Bayesian Rating (30%)</p>
            <p className="text-[11px] text-text-muted">Review count weighted rating preventing 1-review hotels from artificially leading.</p>
          </div>
          <div className="p-3 rounded-input bg-bg border border-border">
            <p className="font-semibold text-text">Attraction Proximity (15%)</p>
            <p className="text-[11px] text-text-muted">Mean route distance to your top scheduled places of interest.</p>
          </div>
          <div className="p-3 rounded-input bg-bg border border-border">
            <p className="font-semibold text-text">Airport Route Distance (15%)</p>
            <p className="text-[11px] text-text-muted">Transit distance from the arrival terminal to your accommodation.</p>
          </div>
          <div className="p-3 rounded-input bg-bg border border-border sm:col-span-2">
            <p className="font-semibold text-text">Verified Amenities (10%)</p>
            <p className="text-[11px] text-text-muted">Presence of essential amenities: Wi-Fi, breakfast, pool, and accessibility.</p>
          </div>
        </div>
      </section>

      {/* Sandbox Disclosure */}
      <section className="p-6 rounded-card bg-surface border border-border shadow-warm space-y-3">
        <h2 className="text-base font-bold text-text flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Payment & Booking Sandbox Disclosure</span>
        </h2>
        <p className="text-xs text-text-muted leading-relaxed">
          In adherence to ethical recruitment standards, live financial charges and commercial reservations are disabled. All checkout experiences utilize Razorpay and Duffel sandbox test environments. No actual financial transactions take place, and this is clearly notified across all invoice and checkout screens.
        </p>
      </section>
    </div>
  );
};
