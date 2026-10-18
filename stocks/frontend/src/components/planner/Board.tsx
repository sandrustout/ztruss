import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { parseISO, addDays, format } from 'date-fns';
import { Trip, TripItem } from '../../types';
import { DayColumn } from './DayColumn';
import { ItemCard } from './ItemCard';
import { useTripStore } from '../../store/tripStore';

interface BoardProps {
  trip: Trip;
}

export const Board: React.FC<BoardProps> = ({ trip }) => {
  const { moveItem, reorderDayItems } = useTripStore();
  const [activeItem, setActiveItem] = useState<TripItem | null>(null);

  // Compute number of days between start_date and end_date
  let totalDays = 3;
  let startDate = new Date();
  try {
    startDate = parseISO(trip.start_date);
    const endDate = parseISO(trip.end_date);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  } catch {
    totalDays = 3;
  }

  // Set up sensors with small distance tolerance so clicks don't accidentally drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const found = trip.items.find(it => it.id === active.id);
    if (found) {
      setActiveItem(found);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const currentItem = trip.items.find(it => it.id === activeId);
    if (!currentItem) return;

    // Check if dragging over a day container (e.g., 'day-0', 'day-1')
    if (overId.startsWith('day-')) {
      const targetDayIndex = parseInt(overId.replace('day-', ''), 10);
      if (currentItem.day_index !== targetDayIndex) {
        const targetDayItems = trip.items.filter(it => it.day_index === targetDayIndex);
        moveItem(activeId, targetDayIndex, targetDayItems.length);
      }
      return;
    }

    // Check if dragging over another item in a different day
    const overItem = trip.items.find(it => it.id === overId);
    if (overItem && currentItem.day_index !== overItem.day_index) {
      moveItem(activeId, overItem.day_index, overItem.order_index);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeItemObj = trip.items.find(it => it.id === activeId);
    if (!activeItemObj) return;

    // Dropped on an item within the same day
    const dayItems = trip.items
      .filter(it => it.day_index === activeItemObj.day_index)
      .sort((a, b) => a.order_index - b.order_index);

    const oldIndex = dayItems.findIndex(it => it.id === activeId);
    const newIndex = dayItems.findIndex(it => it.id === overId);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const reordered = arrayMove(dayItems, oldIndex, newIndex);
      reorderDayItems(activeItemObj.day_index, reordered);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex items-start gap-4 min-w-max pb-4">
          {Array.from({ length: totalDays }).map((_, dayIndex) => {
            const dayDate = addDays(startDate, dayIndex);
            const dateStr = format(dayDate, 'yyyy-MM-dd');
            const dayItems = trip.items
              .filter(it => it.day_index === dayIndex)
              .sort((a, b) => a.order_index - b.order_index);

            return (
              <DayColumn
                key={dayIndex}
                dayIndex={dayIndex}
                dateString={dateStr}
                items={dayItems}
                currency={trip.currency}
              />
            );
          })}
        </div>
      </div>

      {/* Floating Drag Overlay */}
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="w-72 shadow-xl opacity-90 rotate-1 cursor-grabbing">
            <ItemCard
              item={activeItem}
              isFirstInDay={false}
              currency={trip.currency}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
