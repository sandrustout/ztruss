import React, { useEffect, useState, useRef } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  decimals?: number;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  duration = 2000,
  delay = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  decimals = 0,
  className = ''
}) => {
  const [value, setValue] = useState(from);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setValue(to);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;

          const startTimer = setTimeout(() => {
            let startTime: number | null = null;

            const animate = (timestamp: number) => {
              if (!startTime) startTime = timestamp;
              const progress = Math.min((timestamp - startTime) / duration, 1);

              // Ease out quart formula: 1 - pow(1 - progress, 4)
              const easeOut = 1 - Math.pow(1 - progress, 4);
              const currentVal = from + (to - from) * easeOut;

              setValue(currentVal);

              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                setValue(to);
              }
            };

            requestAnimationFrame(animate);
          }, delay);

          return () => clearTimeout(startTimer);
        }
      },
      { threshold: 0.2 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [to, from, duration, delay]);

  const formatNumber = (val: number) => {
    const fixed = val.toFixed(decimals);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return parts.join('.');
  };

  return (
    <span ref={elementRef} className={`tabular-nums ${className}`}>
      {prefix}
      {formatNumber(value)}
      {suffix}
    </span>
  );
};
