import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  Trash2, 
  Clock, 
  MapPin, 
  Car, 
  Footprints, 
  Bus, 
  ShieldAlert, 
  Edit3, 
  Check, 
  X,
  IndianRupee,
  Utensils,
  Hotel,
  Calendar,
  Compass
} from 'lucide-react';
import { TripItem } from '../../types';
import { useTripStore } from '../../store/tripStore';

interface ItemCardProps {
  item: TripItem;
  isFirstInDay: boolean;
  currency: string;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, isFirstInDay, currency }) => {
  const { updateItem, deleteItem } = useTripStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editCost, setEditCost] = useState(item.cost_estimate.toString());
  const [editDuration, setEditDuration] = useState(item.duration_minutes.toString());
  const [editMode, setEditMode] = useState(item.travel_mode);
  const [editNotes, setEditNotes] = useState(item.notes || '');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const handleSaveEdit = async () => {
    await updateItem(item.id, {
      title: editTitle.trim() || item.title,
      cost_estimate: parseFloat(editCost) || 0,
      duration_minutes: parseInt(editDuration, 10) || item.duration_minutes,
      travel_mode: editMode,
      notes: editNotes.trim() || undefined
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(item.title);
    setEditCost(item.cost_estimate.toString());
    setEditDuration(item.duration_minutes.toString());
    setEditMode(item.travel_mode);
    setEditNotes(item.notes || '');
    setIsEditing(false);
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case 'place':
        return <Compass className="w-4 h-4 text-[var(--primary)]" />;
      case 'restaurant':
        return <Utensils className="w-4 h-4 text-[var(--primary)]" />;
      case 'hotel':
        return <Hotel className="w-4 h-4 text-[var(--primary)]" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-[var(--primary)]" />;
      default:
        return <MapPin className="w-4 h-4 text-[var(--primary)]" />;
    }
  };

  const getTravelModeIcon = () => {
    switch (item.travel_mode) {
      case 'walk':
        return <Footprints className="w-3.5 h-3.5" />;
      case 'transit':
        return <Bus className="w-3.5 h-3.5" />;
      case 'drive':
      case 'cab':
      default:
        return <Car className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col mb-3 transition-opacity ${
        isDragging ? 'opacity-30' : 'opacity-100'
      }`}
    >
      {/* Transit Connector before this item */}
      {!isFirstInDay && (
        <div className="flex items-center gap-2 pl-6 py-1.5 text-xs text-[var(--text-muted)] font-medium">
          <div className="w-0.5 h-4 bg-[var(--border)] -mt-1 ml-1" />
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xs">
            {getTravelModeIcon()}
            <span>{item.travel_minutes_from_prev} min</span>
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] opacity-70">
              ({item.travel_source})
            </span>
          </div>
        </div>
      )}

      {/* Item Body Card */}
      <div className="flex items-start gap-2.5 p-3.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)] transition-all shadow-xs hover:shadow-sm">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to rearrange stop"
          className="mt-1 p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] rounded-md cursor-grab active:cursor-grabbing focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex flex-col gap-2.5">
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Stop title"
                className="w-full px-2.5 py-1.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={editDuration}
                    onChange={e => setEditDuration(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Cost ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={editCost}
                    onChange={e => setEditCost(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Ticket details, booking ref, tips..."
                  className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={handleCancelEdit}
                  className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-[var(--primary)] text-[#FDFBD4] rounded-md hover:bg-[var(--primary-strong)] transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)]">
                  {getTypeIcon()}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                  {item.type}
                </span>
                <span className="text-xs text-[var(--text-muted)] tabular-nums ml-auto">
                  {item.start_time} - {item.end_time}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-[var(--text)] tracking-tight leading-snug line-clamp-1">
                {item.title}
              </h4>

              {item.notes && (
                <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2 italic bg-[var(--bg-elevated)] p-1.5 rounded-md border border-[var(--border)]">
                  {item.notes}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.duration_minutes} min</span>
                </span>
                {item.cost_estimate > 0 && (
                  <span className="flex items-center gap-0.5 font-medium text-[var(--text)]">
                    <IndianRupee className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>{item.cost_estimate.toLocaleString('en-IN')}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card quick actions */}
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              aria-label="Edit stop details"
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] rounded-md transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => deleteItem(item.id)}
              aria-label="Remove stop from itinerary"
              className="p-1.5 text-[var(--text-muted)] hover:text-red-600 hover:bg-[var(--bg-elevated)] rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
