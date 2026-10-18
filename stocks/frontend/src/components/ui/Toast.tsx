import React from 'react';
import { create } from 'zustand';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  undoAction?: () => void;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'success'
            ? CheckCircle2
            : toast.type === 'error'
            ? AlertCircle
            : Info;

        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-[var(--bg-elevated)] border-2 shadow-2xl text-[var(--text)] transition-all animate-in slide-in-from-bottom-3 duration-300 ${
              isSuccess 
                ? 'border-[var(--primary)]' 
                : isError 
                ? 'border-red-500' 
                : 'border-[var(--border)]'
            }`}
          >
            <div className={`p-2 rounded-xl shrink-0 ${
              isSuccess 
                ? 'bg-[var(--primary)]/10 text-[var(--primary)]' 
                : isError 
                ? 'bg-red-500/10 text-red-600' 
                : 'bg-[var(--border)] text-[var(--text-muted)]'
            }`}>
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
                {isSuccess ? 'Success' : isError ? 'Attention' : 'Notification'}
              </span>
              <div className="text-xs font-bold text-[var(--text)] leading-snug mt-0.5">
                {toast.message}
              </div>
            </div>

            {toast.undoAction && (
              <button
                type="button"
                onClick={() => {
                  toast.undoAction?.();
                  removeToast(toast.id);
                }}
                className="text-xs font-bold text-[var(--primary)] hover:underline px-1.5 py-0.5"
              >
                Undo
              </button>
            )}

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded-lg hover:bg-[var(--bg)] transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
