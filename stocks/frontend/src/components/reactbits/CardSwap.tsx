import React, { useState, useEffect } from 'react';
import { 
  Plane, 
  Hotel, 
  Compass, 
  Receipt, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  IndianRupee,
  ChevronRight,
  TrendingDown,
  Layers
} from 'lucide-react';

interface PreviewCard {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const CardSwap: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const cards: PreviewCard[] = [
    {
      id: 'flight',
      tag: 'Multi-Provider Flights',
      title: 'Delhi to Jaipur',
      subtitle: 'Real-time Duffel Sandbox API comparison',
      icon: <Plane className="w-4 h-4 text-[var(--primary)]" />,
      content: (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div>
                <p className="text-xs font-bold text-[var(--text)]">IndiGo 6E-241</p>
                <p className="text-[10px] text-[var(--text-muted)]">06:15 - 07:15 (Non-stop)</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-600 tabular-nums">₹2,840</span>
              <p className="text-[9px] uppercase tracking-wider text-emerald-600 font-semibold">-42% Cheapest</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl opacity-80">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <div>
                <p className="text-xs font-medium text-[var(--text)]">Air India AI-492</p>
                <p className="text-[10px] text-[var(--text-muted)]">08:00 - 09:10 (Non-stop)</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-[var(--text)] tabular-nums">₹4,890</span>
              <p className="text-[9px] text-[var(--text-muted)]">Standard Fare</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-emerald-600">Saved ₹2,050</span> on this route
            </span>
            <span className="text-[10px] uppercase font-bold text-[var(--primary)]">Provider: Duffel</span>
          </div>
        </div>
      )
    },
    {
      id: 'hotel',
      tag: 'TripWise Index 0-100',
      title: 'Heritage Haveli & Palace',
      subtitle: 'Transparent weighted scoring, no sponsored slots',
      icon: <Hotel className="w-4 h-4 text-[var(--primary)]" />,
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[var(--text)]">Overall Rating: 94 / 100</p>
              <p className="text-[11px] text-[var(--text-muted)]">Ranked #1 for Cultural Heritage</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--primary)] text-[#FDFBD4]">
              Top 2%
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-muted)]">Location & Walkability (30%)</span>
              <span className="font-bold text-[var(--text)] tabular-nums">9.8 / 10</span>
            </div>
            <div className="w-full h-1.5 bg-[var(--bg)] rounded-full overflow-hidden border border-[var(--border)]">
              <div className="h-full bg-[var(--primary)] w-[98%]" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-muted)]">Cleanliness & Verified Reviews (25%)</span>
              <span className="font-bold text-[var(--text)] tabular-nums">9.5 / 10</span>
            </div>
            <div className="w-full h-1.5 bg-[var(--bg)] rounded-full overflow-hidden border border-[var(--border)]">
              <div className="h-full bg-[var(--primary)] w-[95%]" />
            </div>
          </div>

          <p className="text-[10px] text-[var(--text-muted)] italic pt-1 border-t border-[var(--border)]">
            TripWise Index algorithm is open-source and weighted against hidden resort fees.
          </p>
        </div>
      )
    },
    {
      id: 'itinerary',
      tag: 'Smart Scheduling',
      title: 'Day 1: Royal Forts & Bazaars',
      subtitle: 'Traffic-aware travel buffers & 2-opt optimisation',
      icon: <Compass className="w-4 h-4 text-[var(--primary)]" />,
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
            <span className="px-1.5 py-0.5 text-[10px] font-bold text-[var(--primary)] bg-[var(--bg-elevated)] rounded">
              09:30
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[var(--text)] truncate">Amber Palace & Fort</p>
              <p className="text-[10px] text-[var(--text-muted)]">120 min exploration • Guided audio</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-3 py-0.5 text-[10px] text-[var(--text-muted)]">
            <div className="w-0.5 h-3 bg-[var(--border)] ml-1" />
            <span className="px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)]">
              Cab transit • 18 min (+25% peak traffic buffer)
            </span>
          </div>

          <div className="flex items-center gap-2 p-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
            <span className="px-1.5 py-0.5 text-[10px] font-bold text-[var(--primary)] bg-[var(--bg-elevated)] rounded">
              12:15
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[var(--text)] truncate">Hawa Mahal & City View</p>
              <p className="text-[10px] text-[var(--text-muted)]">60 min stop • Verified photo spot</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'bill',
      tag: 'Transparent Total Cost',
      title: 'Guaranteed Bill & Sandbox Pay',
      subtitle: 'Razorpay sandbox checkout with zero hidden surcharges',
      icon: <Receipt className="w-4 h-4 text-[var(--primary)]" />,
      content: (
        <div className="space-y-2.5">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[var(--text-muted)]">
              <span>Return Flights (2 adults, Duffel)</span>
              <span className="font-semibold text-[var(--text)] tabular-nums">₹5,680</span>
            </div>
            <div className="flex justify-between text-[var(--text-muted)]">
              <span>Heritage Haveli (3 nights)</span>
              <span className="font-semibold text-[var(--text)] tabular-nums">₹8,400</span>
            </div>
            <div className="flex justify-between text-[var(--text-muted)]">
              <span>Monument Passes & Activities</span>
              <span className="font-semibold text-[var(--text)] tabular-nums">₹1,600</span>
            </div>
            <div className="flex justify-between text-[var(--text-muted)]">
              <span>TripWise Convenience Fee</span>
              <span className="font-bold text-emerald-600">₹0 (Free)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text)]">Total Payable:</span>
            <span className="text-base font-bold text-[var(--text)] tabular-nums">₹15,680</span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Sandbox Test Ready • Powered by Razorpay test keys</span>
          </div>
        </div>
      )
    }
  ];

  // Auto-cycle every 4 seconds unless hovered
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, cards.length]);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full max-w-lg mx-auto py-6"
    >
      {/* Visual Header / Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[var(--primary)]" />
          <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
            Live Preview Stack
          </span>
        </div>

        {/* Tab pills to switch card */}
        <div className="flex items-center gap-1">
          {cards.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === activeIndex
                  ? 'w-6 bg-[var(--primary)]'
                  : 'bg-[var(--border)] hover:bg-[var(--text-muted)]'
              }`}
              title={`Switch to ${c.tag}`}
            />
          ))}
        </div>
      </div>

      {/* Stacked Cards Area */}
      <div className="relative h-72 w-full">
        {cards.map((card, index) => {
          // Calculate offset position relative to active card
          const position = (index - activeIndex + cards.length) % cards.length;
          const isTop = position === 0;

          // Compute 3D stacked transformation
          const scale = 1 - position * 0.05;
          const translateY = position * 14;
          const opacity = position > 2 ? 0 : 1 - position * 0.25;
          const zIndex = cards.length - position;

          return (
            <div
              key={card.id}
              onClick={() => setActiveIndex((prev) => (prev + 1) % cards.length)}
              style={{
                transform: `translateY(${translateY}px) scale(${scale})`,
                opacity,
                zIndex
              }}
              className={`absolute inset-x-0 top-0 p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-md transition-all duration-500 ease-out cursor-pointer select-none ${
                isTop ? 'hover:border-[var(--primary)] hover:shadow-lg' : 'pointer-events-none'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                    {card.icon}
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
                      {card.tag}
                    </span>
                    <h4 className="text-sm font-bold text-[var(--text)] tracking-tight">
                      {card.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-semibold text-[var(--text-muted)]">
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card Body */}
              <div>{card.content}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
