import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      aria-hidden="true"
      className={twMerge(
        clsx(
          'animate-pulse rounded-card bg-bg-elevated/80 border border-border/40',
          className
        )
      )}
      {...props}
    />
  );
};
