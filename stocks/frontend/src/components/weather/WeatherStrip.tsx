import React from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, ShieldCheck, Luggage } from 'lucide-react';
import { WeatherResponse, WeatherForecastDay } from '../../types';

interface WeatherStripProps {
  weather: WeatherResponse;
}

export const WeatherStrip: React.FC<WeatherStripProps> = ({ weather }) => {
  const getIcon = (iconKey: string) => {
    switch (iconKey) {
      case 'clear':
        return <Sun className="w-5 h-5 text-primary" />;
      case 'rain':
      case 'showers':
      case 'drizzle':
        return <CloudRain className="w-5 h-5 text-primary" />;
      case 'thunderstorm':
        return <CloudLightning className="w-5 h-5 text-primary" />;
      default:
        return <Cloud className="w-5 h-5 text-text-muted" />;
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-card bg-surface border border-border shadow-warm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-primary" />
            <span>Climate & 7-Day Forecast</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5">{weather.summary}</p>
        </div>
        <span className="text-[10px] text-text-muted">Grounded in Open-Meteo API</span>
      </div>

      {/* Horizontal Daily Forecast Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {weather.days.map((day: WeatherForecastDay) => {
          const dateObj = new Date(day.date);
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          return (
            <div
              key={day.date}
              className="p-2.5 rounded-input bg-bg border border-border/80 text-center flex flex-col items-center justify-between space-y-1.5"
            >
              <div>
                <p className="text-xs font-bold text-text">{dayName}</p>
                <p className="text-[10px] text-text-muted">{monthDay}</p>
              </div>

              <div className="py-1">{getIcon(day.icon)}</div>

              <div className="text-xs tabular-nums font-semibold text-text">
                <span>{day.temp_max_c}°</span>{' '}
                <span className="text-text-muted text-[10px]">{day.temp_min_c}°</span>
              </div>

              {day.precipitation_prob > 0 && (
                <span className="text-[10px] text-primary font-medium">
                  {day.precipitation_prob}% rain
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Automated Packing Checklist per Section 24.7 */}
      {weather.packing_suggestions && weather.packing_suggestions.length > 0 && (
        <div className="pt-2 border-t border-border/60 space-y-1.5">
          <p className="text-xs font-semibold text-text flex items-center gap-1.5">
            <Luggage className="w-3.5 h-3.5 text-primary" />
            <span>Weather-based Packing Suggestions</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {weather.packing_suggestions.map((item: string, idx: number) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-pill bg-bg-elevated border border-border text-[11px] font-medium text-text flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3 h-3 text-primary" />
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
