import React, { useState } from 'react';
import { Folder as FolderIcon, FolderOpen, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

interface FolderProps {
  title?: string;
  reasons: string[];
  className?: string;
}

export const Folder: React.FC<FolderProps> = ({
  title = 'Why we recommended this',
  reasons,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!reasons || reasons.length === 0) return null;

  return (
    <div className={`rounded-input border border-border/80 bg-bg transition-all ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-text hover:text-primary transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <FolderOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          ) : (
            <FolderIcon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          )}
          <span>{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-text-muted" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
        )}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-1 border-t border-border/40 text-xs text-text space-y-1.5 animate-in fade-in slide-in-from-top-1">
          {reasons.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px] text-text-muted">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
