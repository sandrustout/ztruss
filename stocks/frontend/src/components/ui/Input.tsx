import React, { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-text uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-desc` : undefined}
          className={twMerge(
            clsx(
              'w-full h-10 px-3 text-sm bg-bg border rounded-input transition-colors',
              'text-text placeholder:text-text-muted',
              'border-border hover:border-brand-brown focus:border-primary',
              'focus:outline-none focus:ring-1 focus:ring-ring',
              error && 'border-primary-strong ring-1 ring-primary-strong',
              className
            )
          )}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-primary font-medium">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-desc`} className="text-xs text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
