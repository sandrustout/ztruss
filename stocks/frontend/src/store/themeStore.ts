import { create } from 'zustand';
import { ThemeMode } from '../types';

interface ThemeState {
  theme: ThemeMode;
  resolvedDark: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'tripwise-theme';

function applyThemeToDocument(mode: ThemeMode): boolean {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = mode === 'dark' || (mode === 'system' && prefersDark);

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  return isDark;
}

const initialMode: ThemeMode = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch (e) {}
  return 'system';
})();

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialMode,
  resolvedDark: applyThemeToDocument(initialMode),

  setTheme: (mode: ThemeMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {}

    const isDark = applyThemeToDocument(mode);
    set({ theme: mode, resolvedDark: isDark });
  },

  toggleTheme: () => {
    const current = get().theme;
    const next: ThemeMode = current === 'dark' ? 'light' : current === 'light' ? 'system' : 'dark';
    get().setTheme(next);
  },
}));

// Listen for OS system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const state = useThemeStore.getState();
    if (state.theme === 'system') {
      const isDark = applyThemeToDocument('system');
      useThemeStore.setState({ resolvedDark: isDark });
    }
  });
}
