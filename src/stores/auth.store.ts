import { create } from "zustand";

interface AuthState {
  email: string;
  password: string;
  name: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setName: (name: string) => void;
  resetForm: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  email: "",
  password: "",
  name: "",
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setName: (name) => set({ name }),
  resetForm: () => set({ email: "", password: "", name: "" }),
}));
