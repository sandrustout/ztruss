import { create } from 'zustand';
import { apiClient } from '../lib/api';
import { Trip, TripItem, OptimiseDayResponse } from '../types';

interface HistorySnapshot {
  items: TripItem[];
}

interface TripState {
  trip: Trip | null;
  isLoading: boolean;
  isSaving: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'conflict' | 'error';
  errorMessage: string | null;
  history: HistorySnapshot[];
  future: HistorySnapshot[];

  // Actions
  loadTrip: (tripId: string) => Promise<void>;
  updateTripMeta: (data: Partial<Trip>) => Promise<void>;
  addItem: (item: Partial<TripItem>) => Promise<TripItem | null>;
  updateItem: (itemId: string, patch: Partial<TripItem>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  moveItem: (itemId: string, targetDayIndex: number, targetOrderIndex: number) => void;
  reorderDayItems: (dayIndex: number, newItems: TripItem[]) => void;
  scheduleDay: (dayIndex: number, preferredStartTime?: string) => Promise<void>;
  optimiseDay: (dayIndex: number) => Promise<OptimiseDayResponse | null>;
  undo: () => void;
  redo: () => void;
  flushSync: () => Promise<void>;
}

// Timer for debounced reorder syncing
let reorderDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useTripStore = create<TripState>((set, get) => ({
  trip: null,
  isLoading: false,
  isSaving: false,
  saveStatus: 'saved',
  errorMessage: null,
  history: [],
  future: [],

  loadTrip: async (tripId: string) => {
    if (!tripId || tripId === 'new') return;
    set({ isLoading: true, errorMessage: null });
    try {
      const data = await apiClient.get<Trip>(`/trips/${tripId}`);
      set({
        trip: data,
        isLoading: false,
        saveStatus: 'saved',
        history: [],
        future: []
      });
    } catch (err: any) {
      set({
        isLoading: false,
        errorMessage: err.message || 'Failed to load itinerary.'
      });
    }
  },

  updateTripMeta: async (data: Partial<Trip>) => {
    const { trip } = get();
    if (!trip) return;

    set({ isSaving: true, saveStatus: 'saving' });
    try {
      const updated = await apiClient.patch<Trip>(`/trips/${trip.id}`, {
        ...data,
        version: trip.version
      });
      set({
        trip: { ...trip, ...updated },
        isSaving: false,
        saveStatus: 'saved'
      });
    } catch (err: any) {
      if (err.status === 409) {
        set({ saveStatus: 'conflict', errorMessage: 'Trip was modified in another window. Please refresh.' });
      } else {
        set({ isSaving: false, saveStatus: 'error', errorMessage: err.message });
      }
    }
  },

  addItem: async (itemData: Partial<TripItem>) => {
    const { trip, history } = get();
    if (!trip) return null;

    // Save history snapshot before modifying
    const newHistory = [...history.slice(-19), { items: [...trip.items] }];
    set({ isSaving: true, saveStatus: 'saving', history: newHistory, future: [] });

    try {
      const createdItem = await apiClient.post<TripItem>(`/trips/${trip.id}/items`, {
        type: itemData.type || 'place',
        day_index: itemData.day_index ?? 0,
        order_index: itemData.order_index ?? trip.items.filter(i => i.day_index === (itemData.day_index ?? 0)).length,
        ref_table: itemData.ref_table,
        ref_id: itemData.ref_id,
        title: itemData.title || 'Untitled stop',
        start_time: itemData.start_time || '09:00',
        end_time: itemData.end_time || '10:30',
        duration_minutes: itemData.duration_minutes || 90,
        travel_minutes_from_prev: itemData.travel_minutes_from_prev || 15,
        travel_mode: itemData.travel_mode || 'cab',
        travel_source: itemData.travel_source || 'estimate',
        notes: itemData.notes,
        cost_estimate: itemData.cost_estimate || 0.0,
        cost_is_estimate: itemData.cost_is_estimate ?? true,
        locked: itemData.locked ?? false
      });

      set(state => {
        if (!state.trip) return {};
        return {
          trip: {
            ...state.trip,
            version: state.trip.version + 1,
            items: [...state.trip.items, createdItem]
          },
          isSaving: false,
          saveStatus: 'saved'
        };
      });

      return createdItem;
    } catch (err: any) {
      set({ isSaving: false, saveStatus: 'error', errorMessage: err.message });
      return null;
    }
  },

  updateItem: async (itemId: string, patch: Partial<TripItem>) => {
    const { trip, history } = get();
    if (!trip) return;

    // Snapshot
    const newHistory = [...history.slice(-19), { items: [...trip.items] }];

    // Optimistic update
    const updatedItems = trip.items.map(it => (it.id === itemId ? { ...it, ...patch } : it));
    set({
      trip: { ...trip, items: updatedItems },
      history: newHistory,
      future: [],
      isSaving: true,
      saveStatus: 'saving'
    });

    try {
      const savedItem = await apiClient.patch<TripItem>(`/trips/${trip.id}/items/${itemId}`, patch);
      set(state => {
        if (!state.trip) return {};
        return {
          trip: {
            ...state.trip,
            items: state.trip.items.map(it => (it.id === itemId ? savedItem : it))
          },
          isSaving: false,
          saveStatus: 'saved'
        };
      });
    } catch (err: any) {
      set({ isSaving: false, saveStatus: 'error', errorMessage: err.message });
    }
  },

  deleteItem: async (itemId: string) => {
    const { trip, history } = get();
    if (!trip) return;

    // Snapshot
    const newHistory = [...history.slice(-19), { items: [...trip.items] }];
    const remainingItems = trip.items.filter(it => it.id !== itemId);

    set({
      trip: { ...trip, items: remainingItems },
      history: newHistory,
      future: [],
      isSaving: true,
      saveStatus: 'saving'
    });

    try {
      await apiClient.delete(`/trips/${trip.id}/items/${itemId}`);
      set({ isSaving: false, saveStatus: 'saved' });
    } catch (err: any) {
      set({ isSaving: false, saveStatus: 'error', errorMessage: err.message });
    }
  },

  moveItem: (itemId: string, targetDayIndex: number, targetOrderIndex: number) => {
    const { trip, history } = get();
    if (!trip) return;

    const currentItem = trip.items.find(it => it.id === itemId);
    if (!currentItem) return;

    // Snapshot for undo
    const newHistory = [...history.slice(-19), { items: [...trip.items] }];

    // Recompute items
    const otherItems = trip.items.filter(it => it.id !== itemId);
    const dayTargetItems = otherItems
      .filter(it => it.day_index === targetDayIndex)
      .sort((a, b) => a.order_index - b.order_index);

    const updatedCurrentItem: TripItem = {
      ...currentItem,
      day_index: targetDayIndex,
      order_index: targetOrderIndex
    };

    dayTargetItems.splice(targetOrderIndex, 0, updatedCurrentItem);
    dayTargetItems.forEach((it, idx) => {
      it.order_index = idx;
    });

    const otherDaysItems = otherItems.filter(it => it.day_index !== targetDayIndex);
    const allUpdatedItems = [...otherDaysItems, ...dayTargetItems];

    set({
      trip: { ...trip, items: allUpdatedItems },
      history: newHistory,
      future: [],
      saveStatus: 'unsaved'
    });

    // Debounced autosave (1.2 seconds)
    if (reorderDebounceTimer) {
      clearTimeout(reorderDebounceTimer);
    }
    reorderDebounceTimer = setTimeout(() => {
      get().flushSync();
    }, 1200);
  },

  reorderDayItems: (dayIndex: number, newItems: TripItem[]) => {
    const { trip, history } = get();
    if (!trip) return;

    const newHistory = [...history.slice(-19), { items: [...trip.items] }];
    const otherDayItems = trip.items.filter(it => it.day_index !== dayIndex);

    const indexedNewItems = newItems.map((it, idx) => ({
      ...it,
      day_index: dayIndex,
      order_index: idx
    }));

    set({
      trip: { ...trip, items: [...otherDayItems, ...indexedNewItems] },
      history: newHistory,
      future: [],
      saveStatus: 'unsaved'
    });

    if (reorderDebounceTimer) {
      clearTimeout(reorderDebounceTimer);
    }
    reorderDebounceTimer = setTimeout(() => {
      get().flushSync();
    }, 1200);
  },

  flushSync: async () => {
    const { trip } = get();
    if (!trip) return;

    set({ isSaving: true, saveStatus: 'saving' });
    try {
      const payloadItems = trip.items.map(it => ({
        id: it.id,
        day_index: it.day_index,
        order_index: it.order_index
      }));

      const updated = await apiClient.post<TripItem[]>(`/trips/${trip.id}/items/reorder`, {
        items: payloadItems,
        client_version: trip.version
      });

      set(state => {
        if (!state.trip) return {};
        return {
          trip: {
            ...state.trip,
            version: state.trip.version + 1,
            items: updated
          },
          isSaving: false,
          saveStatus: 'saved'
        };
      });
    } catch (err: any) {
      if (err.status === 409) {
        set({ saveStatus: 'conflict', errorMessage: 'Version conflict. Refreshing latest...' });
        get().loadTrip(trip.id);
      } else {
        set({ isSaving: false, saveStatus: 'error', errorMessage: err.message });
      }
    }
  },

  scheduleDay: async (dayIndex: number, preferredStartTime: string = '09:00') => {
    const { trip } = get();
    if (!trip) return;

    set({ isSaving: true, saveStatus: 'saving' });
    try {
      const scheduled = await apiClient.post<TripItem[]>(`/trips/${trip.id}/schedule`, {
        day_index: dayIndex,
        preferred_start_time: preferredStartTime
      });

      set(state => {
        if (!state.trip) return {};
        const otherItems = state.trip.items.filter(it => it.day_index !== dayIndex);
        return {
          trip: {
            ...state.trip,
            version: state.trip.version + 1,
            items: [...otherItems, ...scheduled]
          },
          isSaving: false,
          saveStatus: 'saved'
        };
      });
    } catch (err: any) {
      set({ isSaving: false, saveStatus: 'error', errorMessage: err.message });
    }
  },

  optimiseDay: async (dayIndex: number) => {
    const { trip } = get();
    if (!trip) return null;

    set({ isSaving: true, saveStatus: 'saving' });
    try {
      const res = await apiClient.post<OptimiseDayResponse>(`/trips/${trip.id}/optimise-day`, {
        day_index: dayIndex
      });

      set(state => {
        if (!state.trip) return {};
        const otherItems = state.trip.items.filter(it => it.day_index !== dayIndex);
        return {
          trip: {
            ...state.trip,
            version: state.trip.version + 1,
            items: [...otherItems, ...res.items]
          },
          isSaving: false,
          saveStatus: 'saved'
        };
      });

      return res;
    } catch (err: any) {
      set({ isSaving: false, saveStatus: 'error', errorMessage: err.message });
      return null;
    }
  },

  undo: () => {
    const { history, future, trip } = get();
    if (!trip || history.length === 0) return;

    const previous = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);
    const newFuture = [{ items: [...trip.items] }, ...future.slice(0, 19)];

    set({
      trip: { ...trip, items: previous.items },
      history: newHistory,
      future: newFuture,
      saveStatus: 'unsaved'
    });

    if (reorderDebounceTimer) clearTimeout(reorderDebounceTimer);
    reorderDebounceTimer = setTimeout(() => {
      get().flushSync();
    }, 1200);
  },

  redo: () => {
    const { history, future, trip } = get();
    if (!trip || future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const newHistory = [...history.slice(-19), { items: [...trip.items] }];

    set({
      trip: { ...trip, items: next.items },
      history: newHistory,
      future: newFuture,
      saveStatus: 'unsaved'
    });

    if (reorderDebounceTimer) clearTimeout(reorderDebounceTimer);
    reorderDebounceTimer = setTimeout(() => {
      get().flushSync();
    }, 1200);
  }
}));
