import { create } from "zustand";

/** Client-only UI state for global overlays (cart drawer, quick-view modal). */
interface UiState {
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  quickViewSlug: string | null;
  openQuickView: (slug: string) => void;
  closeQuickView: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  cartOpen: false,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  quickViewSlug: null,
  openQuickView: (slug) => set({ quickViewSlug: slug }),
  closeQuickView: () => set({ quickViewSlug: null }),
}));
