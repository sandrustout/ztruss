import React, { useState } from 'react';
import { Clock, Star, MapPin, Plus, Check } from 'lucide-react';
import { PlaceResponse } from '../../types';
import { Folder } from '../reactbits/Folder';
import { Button } from '../ui/Button';
import { useToastStore } from '../ui/Toast';

interface PlaceCardProps {
  place: PlaceResponse;
  onAddToTrip?: (place: PlaceResponse) => void;
}

const CATEGORY_FALLBACKS: Record<string, string[]> = {
  monument: [
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80',
  ],
  temple: [
    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1621847468516-1ed5d0df56fe?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=600&q=80',
  ],
  museum: [
    'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=600&q=80',
  ],
  nature: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=600&q=80',
  ],
  restaurant: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80',
  ]
};

function getPlaceImage(place: PlaceResponse): string {
  if (place.image_url) return place.image_url;
  const cat = (place.category || 'monument').toLowerCase();
  const pool = CATEGORY_FALLBACKS[cat] || CATEGORY_FALLBACKS.monument;
  let hash = 0;
  for (let i = 0; i < place.name.length; i++) {
    hash = (hash << 5) - hash + place.name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, onAddToTrip }) => {
  const [isAdded, setIsAdded] = useState(false);
  const { addToast } = useToastStore();

  const handleAdd = () => {
    setIsAdded(true);
    if (onAddToTrip) {
      onAddToTrip(place);
    }
    addToast({
      type: 'success',
      message: `${place.name} added to your itinerary schedule.`,
      undoAction: () => setIsAdded(false),
    });
  };

  const imageSrc = getPlaceImage(place);

  return (
    <div className="rounded-card bg-surface border border-border shadow-warm hover:border-brand-brown/40 transition-all flex flex-col overflow-hidden group">
      {/* Photography Banner with Attribution */}
      <div className="relative h-44 w-full bg-bg-elevated overflow-hidden">
        <img
          src={imageSrc}
          alt={place.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2.5 py-1 rounded-pill bg-bg/90 backdrop-blur-md text-[11px] font-bold text-primary capitalize border border-border">
            {place.category}
          </span>
        </div>
        {place.rating > 0 && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-pill bg-bg/90 backdrop-blur-md text-xs font-bold text-text border border-border">
            <Star className="w-3 h-3 fill-primary text-primary" />
            <span className="tabular-nums">{place.rating.toFixed(1)}</span>
          </div>
        )}
        {place.image_attribution && (
          <div className="absolute bottom-1 right-2 text-[9px] text-brand-cream/80 bg-brand-espresso/60 px-1.5 py-0.5 rounded backdrop-blur-sm truncate max-w-[200px]">
            {place.image_attribution}
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-text group-hover:text-primary transition-colors leading-snug">
            {place.name}
          </h3>
          <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
            {place.description || `Historic attraction and cultural sight in the destination.`}
          </p>
        </div>

        {/* Facts Row: Duration & Source */}
        <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border/40">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>Typical time: {place.typical_duration_minutes} mins</span>
          </div>
          <span className="capitalize text-[10px] font-mono text-text-muted">
            Via {place.source}
          </span>
        </div>

        {/* Why We Recommended This (Folder Component) */}
        {place.why_recommended && place.why_recommended.length > 0 && (
          <Folder
            title="Why recommended"
            reasons={place.why_recommended}
          />
        )}

        {/* Add to Trip Action Button */}
        <div className="pt-1">
          <Button
            type="button"
            variant={isAdded ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleAdd}
            className="w-full gap-1.5 text-xs"
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-primary" />
                <span>Added to Trip</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Trip</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
