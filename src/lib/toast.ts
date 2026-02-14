import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  message: string | null;
  type: ToastType | null;
  showToast: (params: { message: string; type: ToastType }) => void;
  hideToast: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  type: null,
  showToast: ({ message, type }) => {
    set({ message, type });
    setTimeout(() => {
      set({ message: null, type: null });
    }, 4000);
  },
  hideToast: () => set({ message: null, type: null }),
}));
