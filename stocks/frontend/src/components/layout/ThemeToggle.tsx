import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { ThemeMode } from '../../types';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useThemeStore();

  const options: { mode: ThemeMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { mode: 'light', label: 'Light theme', icon: Sun },
    { mode: 'dark', label: 'Dark theme', icon: Moon },
    { mode: 'system', label: 'System theme', icon: Monitor },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme selection"
      className="inline-flex items-center p-1 rounded-pill bg-bg-elevated border border-border"
    >
      {options.map(({ mode, label, icon: Icon }) => {
        const isActive = theme === mode;
        return (
          <button
            key={mode}
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => setTheme(mode)}
            className={`p-1.5 rounded-pill transition-colors ${
              isActive
                ? 'bg-primary text-brand-cream shadow-sm'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
};
