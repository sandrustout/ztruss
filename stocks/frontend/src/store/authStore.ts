import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { apiClient } from '../lib/api';
import { UserProfile, AuthUser } from '../types';
import { useToastStore } from '../components/ui/Toast';

interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isGuest: boolean;
  error: string | null;

  initAuth: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  token: null,
  isLoading: true,
  isGuest: true,
  error: null,

  initAuth: async () => {
    set({ isLoading: true, error: null });

    // Check if demo session is stored in localStorage
    const savedDemoToken = localStorage.getItem('tripwise-demo-token');
    if (savedDemoToken) {
      set({
        user: { id: '00000000-0000-0000-0000-000000000001', email: 'demo.traveller@tripwise.local' },
        token: 'demo-token',
        isGuest: false,
        isLoading: false,
      });
      await get().fetchProfile();
      return;
    }

    if (!isSupabaseConfigured) {
      set({ isLoading: false, isGuest: true });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        set({
          user: { id: session.user.id, email: session.user.email },
          token: session.access_token,
          isGuest: false,
        });
        await get().fetchProfile();
      } else {
        set({ user: null, profile: null, token: null, isGuest: true });
      }
    } catch (err: any) {
      set({ error: err.message, isGuest: true });
    } finally {
      set({ isLoading: false });
    }

    // Set up auth state change listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        set({
          user: { id: session.user.id, email: session.user.email },
          token: session.access_token,
          isGuest: false,
        });
        await get().fetchProfile();
        if (event === 'SIGNED_IN') {
          useToastStore.getState().addToast({
            type: 'success',
            message: `Welcome back! Signed in as ${session.user.email}.`
          });
        }
      } else {
        set({ user: null, profile: null, token: null, isGuest: true });
      }
    });
  },

  signInWithGoogle: async () => {
    if (!isSupabaseConfigured) {
      // Fallback to demo mode if Supabase keys are not set yet
      await get().signInAsDemo();
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      set({ error: error.message });
      throw error;
    }
  },

  signInAsDemo: async () => {
    // Allows evaluator/student to test all authenticated flows locally
    localStorage.setItem('tripwise-demo-token', 'demo-token');
    set({
      user: { id: '00000000-0000-0000-0000-000000000001', email: 'demo.traveller@tripwise.local' },
      token: 'demo-token',
      isGuest: false,
      isLoading: false,
      error: null,
    });
    await get().fetchProfile();
    useToastStore.getState().addToast({
      type: 'success',
      message: 'Signed in as Demo Traveller! Welcome to TripWise.'
    });
  },

  signOut: async () => {
    localStorage.removeItem('tripwise-demo-token');
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    set({ user: null, profile: null, token: null, isGuest: true, error: null });
    useToastStore.getState().addToast({
      type: 'info',
      message: 'You have been signed out safely.'
    });
  },

  fetchProfile: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const profile = await apiClient<UserProfile>('/me', {}, token);
      set({ profile });
    } catch (err: any) {
      // Profile creation might be initialising
      console.warn('Could not fetch user profile:', err);
    }
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    const token = get().token;
    if (!token) return;

    const updated = await apiClient<UserProfile>('/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token);

    set({ profile: updated });
  },

  deleteAccount: async () => {
    const token = get().token;
    if (!token) return;

    await apiClient('/me', { method: 'DELETE' }, token);
    await get().signOut();
  },
}));
