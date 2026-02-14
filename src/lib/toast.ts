import { create } from 'zustand';

interface ToastState {
  message: string | null;
  type: 'success' | 'error' | null;
  showToast: (params: { message: string; type: 'success' | 'error' }) => void;
  hideToast: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  type: null,
  showToast: ({ message, type }) => {
    set({ message, type });
    setTimeout(() => {
      set({ message: null, type: null });
    }, 3000);
  },
  hideToast: () => set({ message: null, type: null }),
})); 