import React from 'react';
import { Calendar, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { EventResponse } from '../../types';

interface FestivalBannerProps {
  events: EventResponse[];
}

export const FestivalBanner: React.FC<FestivalBannerProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="p-4 rounded-card bg-surface border border-border text-xs text-text-muted flex items-center gap-2">
        <Info className="w-4 h-4 text-primary flex-shrink-0" />
        <span>No official festival or public holiday data found for these selected dates.</span>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-card bg-surface border border-border shadow-warm space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary" />
            <span>During Your Stay: Festivals & Events</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Public holidays and cultural gatherings sourced from Nager.Date, Calendarific, and Ticketmaster.
          </p>
        </div>
        <span className="text-[10px] text-text-muted font-mono">
          {events.length} {events.length === 1 ? 'event' : 'events'} recorded
        </span>
      </div>

      <div className="space-y-2.5">
        {events.map((ev, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-input bg-bg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-text">{ev.name}</span>
                <span className="px-2 py-0.5 rounded-pill bg-bg-elevated text-[10px] font-semibold uppercase tracking-wider text-primary border border-border">
                  {ev.type.replace('_', ' ')}
                </span>
                {ev.closure_risk && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Closure risk</span>
                  </span>
                )}
              </div>
              {ev.description && (
                <p className="text-[11px] text-text-muted max-w-xl">{ev.description}</p>
              )}
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 flex-shrink-0">
              <span className="text-xs font-mono font-semibold text-text tabular-nums">
                {ev.start_date}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-muted capitalize">Via {ev.source}</span>
                {ev.source_url && (
                  <a
                    href={ev.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-text-muted hover:text-primary"
                    title="View official event source"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
