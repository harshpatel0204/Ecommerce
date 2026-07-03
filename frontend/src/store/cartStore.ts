import { create } from "zustand";

interface CartUiState {
  itemCount: number;
  setItemCount: (n: number) => void;
}

// Client-only UI state: the navbar badge count. Authoritative cart data lives in
// React Query (see useCart).
export const useCartStore = create<CartUiState>((set) => ({
  itemCount: 0,
  setItemCount: (itemCount) => set({ itemCount }),
}));
