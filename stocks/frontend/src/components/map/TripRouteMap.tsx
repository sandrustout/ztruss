import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Compass, 
  MapPin, 
  Clock, 
  Navigation, 
  IndianRupee, 
  Calendar, 
  Layers,
  Plane,
  Building,
  Car,
  ChevronRight,
  ChevronLeft,
  Utensils,
  Sparkles
} from 'lucide-react';
import { TripItem, DestinationResponse } from '../../types';

interface TripRouteMapProps {
  items: TripItem[];
  destination?: DestinationResponse | null;
  selectedDayIndex?: number;
  onSelectDay?: (day: number) => void;
}

const DAY_COLORS = [
  '#C05800', // Burnt Orange (Day 1)
  '#713600', // Deep Brown (Day 2)
  '#D97706', // Amber (Day 3)
  '#059669', // Emerald (Day 4)
  '#2563EB', // Royal Blue (Day 5)
  '#7C3AED', // Purple (Day 6)
  '#DB2777', // Pink (Day 7)
];

export const TripRouteMap: React.FC<TripRouteMapProps> = ({
  items,
  destination,
  selectedDayIndex = -1,
  onSelectDay
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, { marker: L.Marker; latLng: [number, number] }>>(new Map());

  const [activeDay, setActiveDay] = useState<number>(selectedDayIndex);
  const [showStopsList, setShowStopsList] = useState(true);

  // Derive all unique day indices
  const daysInTrip = Array.from(new Set(items.map(it => it.day_index))).sort((a, b) => a - b);
  const maxDay = daysInTrip.length > 0 ? Math.max(...daysInTrip) : 0;
  const dayTabs = [-1, ...Array.from({ length: Math.max(1, maxDay + 1) }, (_, i) => i)];

  // Filter items for map view
  const displayItems = activeDay === -1 
    ? items 
    : items.filter(it => it.day_index === activeDay);

  // Group items by day for the interactive journey guide
  const itemsByDay = new Map<number, TripItem[]>();
  items.forEach(it => {
    const arr = itemsByDay.get(it.day_index) || [];
    arr.push(it);
    itemsByDay.set(it.day_index, arr);
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const centerLat = destination?.lat || 15.2993;
    const centerLng = destination?.lng || 74.1240;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 12,
      zoomControl: true,
      attributionControl: false
    });

    // Clean OpenStreetMap standard tiles (100% free, zero API key required)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    layersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Recalculate size if container dimensions shift
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [showStopsList, activeDay]);

  // Update Markers & Polylines when display items change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layersGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();
    markersMapRef.current.clear();

    const destLat = destination?.lat || 15.2993;
    const destLng = destination?.lng || 74.1240;

    const activeDisplayMap = new Map<number, TripItem[]>();
    displayItems.forEach(it => {
      const arr = activeDisplayMap.get(it.day_index) || [];
      arr.push(it);
      activeDisplayMap.set(it.day_index, arr);
    });

    const allLatLngs: L.LatLngExpression[] = [];

    activeDisplayMap.forEach((dayItems, dayIdx) => {
      dayItems.sort((a, b) => a.order_index - b.order_index);
      const color = DAY_COLORS[dayIdx % DAY_COLORS.length];
      const dayLatLngs: L.LatLngExpression[] = [];

      dayItems.forEach((item, stopIdx) => {
        let lat = item.lat;
        let lng = item.lng;

        if (!lat || !lng) {
          const angle = (dayIdx * 2.1) + (stopIdx * 1.3);
          const radius = 0.015 + (stopIdx * 0.012);
          lat = destLat + (radius * Math.sin(angle));
          lng = destLng + (radius * Math.cos(angle));
        }

        const point: [number, number] = [lat, lng];
        dayLatLngs.push(point);
        allLatLngs.push(point);

        const iconHtml = `
          <div style="
            background-color: ${color};
            color: #FDFBD4;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 800;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">
            ${stopIdx + 1}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'tripwise-map-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14]
        });

        const popupContent = `
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #38240D; min-width: 190px;">
            <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: ${color}; letter-spacing: 0.5px;">
              Day ${item.day_index + 1} • Stop ${stopIdx + 1} (${item.type})
            </div>
            <div style="font-size: 13px; font-weight: 700; margin: 2px 0 4px 0; color: #1e1e1e;">
              ${item.title}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #666; border-top: 1px solid #eee; padding-top: 4px;">
              <span>Time: <b>${item.start_time || 'Flexible'} - ${item.end_time || ''}</b></span>
              <span><b>${item.duration_minutes}m</b></span>
            </div>
            ${item.notes ? `<div style="font-size: 10px; color: #888; margin-top: 4px; font-style: italic;">${item.notes}</div>` : ''}
          </div>
        `;

        const marker = L.marker(point, { icon: customIcon });
        marker.bindPopup(popupContent);
        layers.addLayer(marker);

        if (item.id) {
          markersMapRef.current.set(item.id, { marker, latLng: point });
        }
      });

      if (dayLatLngs.length > 1) {
        const polyline = L.polyline(dayLatLngs, {
          color: color,
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
          lineCap: 'round'
        });
        layers.addLayer(polyline);
      }
    });

    if (allLatLngs.length > 0) {
      const bounds = L.latLngBounds(allLatLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [displayItems, destination]);

  const handleTabClick = (d: number) => {
    setActiveDay(d);
    if (onSelectDay) onSelectDay(d);
  };

  const handleFlyToStop = (itemId: string) => {
    const entry = markersMapRef.current.get(itemId);
    if (entry && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(entry.latLng, 14, { duration: 1.2 });
      setTimeout(() => {
        entry.marker.openPopup();
      }, 1200);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden border border-[var(--border)] shadow-md bg-[var(--bg-elevated)] flex">
      {/* Map Main Canvas */}
      <div className="relative flex-1 h-full min-h-[520px]">
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-elevated)]/90 backdrop-blur-md p-2.5 rounded-2xl border border-[var(--border)] shadow-lg">
          {/* Day Selector Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1 ml-1 mr-1">
              <Navigation className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Route:</span>
            </span>
            {dayTabs.map((d) => {
              const isSelected = activeDay === d;
              const label = d === -1 ? 'All Days' : `Day ${d + 1}`;
              const dotColor = d === -1 ? 'var(--primary)' : DAY_COLORS[d % DAY_COLORS.length];

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleTabClick(d)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-[var(--primary)] text-[#FDFBD4] shadow-xs'
                      : 'bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Toggle Stops Panel & Legend */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] font-mono hidden sm:inline">
              {displayItems.length} Stops Active
            </span>
            <button
              type="button"
              onClick={() => setShowStopsList(!showStopsList)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] rounded-xl hover:border-[var(--primary)] transition-all"
            >
              <span>{showStopsList ? 'Hide Stops' : 'View Itinerary'}</span>
              {showStopsList ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div ref={mapContainerRef} className="w-full h-full min-h-[520px]" />

        {/* Bottom Floating Stats Pill */}
        <div className="absolute bottom-4 left-4 z-[400] bg-[var(--bg-elevated)]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[var(--border)] shadow-lg flex items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">
              {activeDay === -1 ? 'Full Journey Overview' : `Day ${activeDay + 1} Travel Route`}
            </span>
            <span className="font-bold text-[var(--text)]">
              {destination ? `${destination.name}, ${destination.country}` : 'Trip Destination'}
            </span>
          </div>
          <div className="h-6 w-px bg-[var(--border)]" />
          <div className="flex items-center gap-1 text-[var(--text-muted)]">
            <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>
              {displayItems.reduce((acc, it) => acc + (it.duration_minutes || 0) + (it.travel_minutes_from_prev || 0), 0)} mins total
            </span>
          </div>
        </div>
      </div>

      {/* Side Itinerary Panel ("Where we're travelling each day") */}
      {showStopsList && (
        <div className="w-80 border-l border-[var(--border)] bg-[var(--bg-elevated)] flex flex-col h-full z-10 overflow-hidden shadow-warm">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--bg)]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>Day-by-Day Journey</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] font-bold">
                {items.length} total
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Click any stop to locate & zoom on map
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {Array.from(itemsByDay.entries())
              .sort(([a], [b]) => a - b)
              .map(([dayIdx, dayStops]) => {
                const isCurrentActiveDay = activeDay === -1 || activeDay === dayIdx;
                const dayColor = DAY_COLORS[dayIdx % DAY_COLORS.length];

                if (!isCurrentActiveDay && activeDay !== -1) return null;

                return (
                  <div key={dayIdx} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span 
                        className="text-xs font-bold flex items-center gap-1.5"
                        style={{ color: dayColor }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dayColor }} />
                        <span>Day {dayIdx + 1} Itinerary</span>
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {dayStops.length} stops
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {dayStops
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((stop, sIdx) => {
                          const isFlight = stop.type === 'flight';
                          const isHotel = stop.type === 'hotel';
                          const isFood = stop.type === 'restaurant';

                          return (
                            <div
                              key={stop.id || sIdx}
                              onClick={() => handleFlyToStop(stop.id)}
                              className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--primary)] cursor-pointer transition-all flex items-start gap-2.5 group"
                            >
                              <div 
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-[#FDFBD4] shrink-0 mt-0.5"
                                style={{ backgroundColor: dayColor }}
                              >
                                {sIdx + 1}
                              </div>

                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[9px] uppercase font-bold text-[var(--text-muted)]">
                                    {stop.type}
                                  </span>
                                  {stop.start_time && (
                                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                                      {stop.start_time}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--primary)] truncate transition-colors">
                                  {stop.title}
                                </p>
                                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                                  <span>{stop.duration_minutes}m duration</span>
                                  {stop.cost_estimate > 0 && (
                                    <span className="font-semibold text-[var(--text)]">
                                      ₹{stop.cost_estimate.toLocaleString('en-IN')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
