import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { 
  Sparkles, 
  Clock, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar as CalendarIcon,
  Compass,
  Feather
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { TripItem } from '../../types';
import { ItemCard } from './ItemCard';
import { useTripStore } from '../../store/tripStore';

interface DayColumnProps {
  dayIndex: number;
  dateString: string;
  items: TripItem[];
  currency: string;
}

export const DayColumn: React.FC<DayColumnProps> = ({
  dayIndex,
  dateString,
  items,
  currency
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayIndex}`
  });

  const { scheduleDay, optimiseDay, addItem } = useTripStore();
  const [isOptimising, setIsOptimising] = useState(false);
  const [optimiseMessage, setOptimiseMessage] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'place' | 'restaurant' | 'hotel' | 'event'>('place');
  const [newDuration, setNewDuration] = useState('60');

  // Compute total day duration
  const totalDurationMinutes = items.reduce(
    (acc, it) => acc + it.duration_minutes + (it.travel_minutes_from_prev || 0),
    0
  );
  const totalHours = Math.floor(totalDurationMinutes / 60);
  const remainingMinutes = totalDurationMinutes % 60;
  const isOverloaded = totalDurationMinutes > 600; // > 10 hours

  // Formatted date
  let formattedDate = `Day ${dayIndex + 1}`;
  try {
    formattedDate = format(parseISO(dateString), 'EEE, MMM d');
  } catch {
    formattedDate = `Day ${dayIndex + 1}`;
  }

  const handleOptimise = async () => {
    setIsOptimising(true);
    setOptimiseMessage(null);
    try {
      const res = await optimiseDay(dayIndex);
      if (res && res.saved_minutes > 0) {
        setOptimiseMessage(`Saved ${res.saved_minutes} min of transit!`);
      } else {
        setOptimiseMessage('Already on the most efficient route.');
      }
      setTimeout(() => setOptimiseMessage(null), 4000);
    } finally {
      setIsOptimising(false);
    }
  };

  const handleSchedule = async () => {
    setIsScheduling(true);
    try {
      await scheduleDay(dayIndex, '09:00');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleMakeLighter = async () => {
    // If over-scheduled, increase pauses or highlight
    if (items.length > 3) {
      setOptimiseMessage('Tip: Consider spreading out afternoon stops across other days.');
      setTimeout(() => setOptimiseMessage(null), 4000);
    } else {
      setOptimiseMessage('Schedule is already nicely paced.');
      setTimeout(() => setOptimiseMessage(null), 3000);
    }
  };

  const handleAddCustomStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await addItem({
      title: newTitle.trim(),
      type: newType,
      day_index: dayIndex,
      duration_minutes: parseInt(newDuration, 10) || 60,
      cost_estimate: 0,
      travel_mode: 'cab'
    });

    setNewTitle('');
    setShowAddForm(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-80 shrink-0 bg-[var(--bg-elevated)] border rounded-2xl transition-colors duration-150 ${
        isOver
          ? 'border-[var(--primary)] bg-[var(--bg)] ring-2 ring-[var(--ring)]'
          : 'border-[var(--border)]'
      }`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-[var(--primary)] text-[#FDFBD4]">
              {dayIndex + 1}
            </span>
            <h3 className="font-semibold text-sm text-[var(--text)] tracking-tight">
              {formattedDate}
            </h3>
          </div>
          <span className="text-xs text-[var(--text-muted)] font-medium tabular-nums">
            {totalHours}h {remainingMinutes}m
          </span>
        </div>

        {/* Warning if day exceeds 10 hours */}
        {isOverloaded && (
          <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 text-[11px] font-medium text-amber-900 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Packed day (&gt;10 hrs). Consider pacing.</span>
          </div>
        )}

        {/* Action feedback message */}
        {optimiseMessage && (
          <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 text-[11px] font-medium text-[var(--text)] bg-[var(--bg)] border border-[var(--primary)] rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
            <span>{optimiseMessage}</span>
          </div>
        )}

        {/* Quick action buttons */}
        <div className="flex items-center gap-1.5 mt-3">
          <button
            onClick={handleOptimise}
            disabled={isOptimising || items.length < 2}
            title="Optimise stops route using 2-opt"
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] rounded-lg hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="w-3 h-3 text-[var(--primary)]" />
            <span>{isOptimising ? 'Optimising...' : 'Optimise'}</span>
          </button>

          <button
            onClick={handleSchedule}
            disabled={isScheduling || items.length === 0}
            title="Calculate realistic timing and transit"
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] rounded-lg hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Clock className="w-3 h-3 text-[var(--primary)]" />
            <span>{isScheduling ? 'Timing...' : 'Schedule'}</span>
          </button>

          <button
            onClick={handleMakeLighter}
            title="Pace this day lighter"
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors"
          >
            <Feather className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Items Container */}
      <div className="flex-1 p-3 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[160px]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-[var(--border)] rounded-xl text-center p-4">
            <Compass className="w-6 h-6 text-[var(--text-muted)] opacity-50 mb-1.5" />
            <p className="text-xs text-[var(--text-muted)] font-medium">
              No stops yet for this day
            </p>
            <p className="text-[11px] text-[var(--text-muted)] opacity-70">
              Drag places here or click below to add
            </p>
          </div>
        ) : (
          <SortableContext items={items.map(it => it.id)} strategy={verticalListSortingStrategy}>
            {items.map((item, index) => (
              <ItemCard
                key={item.id}
                item={item}
                isFirstInDay={index === 0}
                currency={currency}
              />
            ))}
          </SortableContext>
        )}
      </div>

      {/* Add Custom Stop Footer */}
      <div className="p-3 border-t border-[var(--border)]">
        {showAddForm ? (
          <form onSubmit={handleAddCustomStop} className="p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl space-y-2">
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Amber Fort morning visit"
              className="w-full px-2.5 py-1 text-xs bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as any)}
                className="w-full px-2 py-1 text-xs bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none"
              >
                <option value="place">Attraction</option>
                <option value="restaurant">Food / Dining</option>
                <option value="hotel">Stay / Hotel</option>
                <option value="event">Festival / Event</option>
              </select>
              <input
                type="number"
                min="15"
                step="15"
                value={newDuration}
                onChange={e => setNewDuration(e.target.value)}
                placeholder="Mins"
                className="w-full px-2 py-1 text-xs bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs font-medium bg-[var(--primary)] text-[#FDFBD4] rounded-md hover:bg-[var(--primary-strong)]"
              >
                Add Stop
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] rounded-xl border border-transparent hover:border-[var(--border)] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add stop to this day</span>
          </button>
        )}
      </div>
    </div>
  );
};
