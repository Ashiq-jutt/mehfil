import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, kind?: ToastKind, durationMs?: number) => void;
  dismiss: (id: number) => void;
  /** Drops every toast and cancels its pending hide timer (sign-out, tests). */
  clear: () => void;
}

let nextId = 1;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function cancel(id: number) {
  const timer = timers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(id);
  }
}

/** Tiny global toast queue ("Game Code has been copied" style pills). */
export const useToastStore = create<ToastState>(set => ({
  toasts: [],
  show(message, kind = 'info', durationMs = 2200) {
    const id = nextId++;
    set(state => ({ toasts: [...state.toasts.slice(-2), { id, message, kind }] }));
    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id);
        set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
      }, durationMs),
    );
  },
  dismiss(id) {
    cancel(id);
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },
  clear() {
    timers.forEach(clearTimeout);
    timers.clear();
    set({ toasts: [] });
  },
}));

export const toast = {
  info: (message: string) => useToastStore.getState().show(message, 'info'),
  success: (message: string) => useToastStore.getState().show(message, 'success'),
  error: (message: string) => useToastStore.getState().show(message, 'error'),
  clear: () => useToastStore.getState().clear(),
};
