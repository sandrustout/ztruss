import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border bg-bg-elevated/40 text-text mt-auto py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <span className="text-xl font-bold tracking-tight text-brand-brown dark:text-brand-cream">
              Trip<span className="text-primary">Wise</span>
            </span>
            <p className="text-xs text-text-muted leading-relaxed max-w-md">
              Multi-provider smart travel planner comparing verified flight fares, transparent accommodation indexes, and intelligent traffic-aware daily itineraries.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-bg border border-border text-[11px] text-text-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>Sandbox environment: no actual payments or live reservations are charged.</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-text uppercase tracking-wider">Navigation</p>
            <ul className="space-y-1.5 text-xs text-text-muted">
              <li><Link to="/" className="hover:text-primary transition-colors">Explore Destinations</Link></li>
              <li><Link to="/trips" className="hover:text-primary transition-colors">My Itineraries</Link></li>
              <li><Link to="/history" className="hover:text-primary transition-colors">Travel Memories</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">About & Sources</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-text uppercase tracking-wider">Data & Attributions</p>
            <ul className="space-y-1.5 text-xs text-text-muted">
              <li>
                <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
                  OpenStreetMap <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://opentripmap.io" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
                  OpenTripMap <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
                  Open-Meteo <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://wikimedia.org" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
                  Wikimedia Commons <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <p>
            TripWise. Built for AWS Student Builder Group, VIT Chennai (Web Development, Track 3).
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/sandrustout/ztruss"
              target="_blank"
              rel="noreferrer"
              className="hover:text-text transition-colors"
            >
              GitHub Repository
            </a>
            <Link to="/about" className="hover:text-text transition-colors">
              Privacy & Legal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
