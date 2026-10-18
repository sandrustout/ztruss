import React from 'react';

export interface LogoItem {
  name: string;
  category: string;
  description: string;
  icon?: React.ReactNode;
}

interface LogoLoopProps {
  items: LogoItem[];
  speed?: number; // duration in seconds
  pauseOnHover?: boolean;
  className?: string;
}

export const LogoLoop: React.FC<LogoLoopProps> = ({
  items,
  speed = 28,
  pauseOnHover = true,
  className = ''
}) => {
  // Duplicate array 3 times to ensure seamless infinite looping marquee
  const loopedItems = [...items, ...items, ...items];

  return (
    <div
      className={`relative w-full overflow-hidden mask-gradient-x ${className}`}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
      }}
    >
      <div
        className={`flex items-center gap-4 py-2 w-max animate-logo-loop ${
          pauseOnHover ? 'hover:[animation-play-state:paused]' : ''
        }`}
        style={{
          animationDuration: `${speed}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite'
        }}
      >
        {loopedItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)] transition-all shrink-0 shadow-xs cursor-default"
          >
            {item.icon && (
              <div className="p-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--primary)] shrink-0">
                {item.icon}
              </div>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text)] tracking-tight">
                  {item.name}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-[var(--bg)] text-[var(--primary)] border border-[var(--border)]">
                  {item.category}
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[180px]">
                {item.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
