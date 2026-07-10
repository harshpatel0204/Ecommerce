import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { addToWishlist, getWishlist, removeFromWishlist } from "@/api/wishlist";
import { useAuthStore } from "@/store/authStore";

const WISHLIST_KEY = ["wishlist"];

export function useWishlist() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: WISHLIST_KEY,
    queryFn: getWishlist,
    enabled: isAuthenticated,
  });
}

/** Set of wishlisted product ids — drives the heart buttons. */
export function useWishlistIds(): Set<string> {
  const { data } = useWishlist();
  return new Set((data ?? []).map((p) => p.id));
}

/**
 * Toggle a product in/out of the wishlist. Redirects unauthenticated users to
 * login (with ?next= back to where they were).
 */
export function useToggleWishlist() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const wishlistedIds = useWishlistIds();

  const mutation = useMutation({
    mutationFn: async (productId: string) => {
      if (wishlistedIds.has(productId)) {
        await removeFromWishlist(productId);
        return { added: false };
      }
      await addToWishlist(productId);
      return { added: true };
    },
    onSuccess: ({ added }) => {
      qc.invalidateQueries({ queryKey: WISHLIST_KEY });
      toast.success(added ? "Added to wishlist ❤️" : "Removed from wishlist");
    },
    onError: () => toast.error("Could not update wishlist"),
  });

  const toggle = (productId: string) => {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    mutation.mutate(productId);
  };

  return { toggle, wishlistedIds, isPending: mutation.isPending };
}
