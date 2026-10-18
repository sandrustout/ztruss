import React, { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const Chip: React.FC<ChipProps> = ({ className, active = false, children, ...props }) => {
  return (
    <button
      type="button"
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-medium border transition-colors select-none',
          active
            ? 'bg-primary text-brand-cream border-primary shadow-sm'
            : 'bg-bg-elevated text-text border-border hover:border-primary/50 hover:bg-bg-subtle',
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  );
};
