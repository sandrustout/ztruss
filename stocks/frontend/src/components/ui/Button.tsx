import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none select-none';

    const variants = {
      primary: 'bg-primary text-brand-cream hover:bg-brand-brown active:bg-brand-brown shadow-sm',
      secondary: 'bg-bg-elevated text-text hover:bg-bg-subtle border border-border',
      outline: 'border border-border bg-transparent text-text hover:bg-bg-elevated',
      ghost: 'bg-transparent text-text hover:bg-bg-elevated',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-input',
      md: 'h-10 px-4 text-sm rounded-input',
      lg: 'h-12 px-6 text-base rounded-input',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
