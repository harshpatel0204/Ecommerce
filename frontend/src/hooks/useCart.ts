import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { addToCart, clearCart, getCart, removeCartItem, updateCartItem } from "@/api/cart";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import type { Cart } from "@/types/cart";

const CART_KEY = ["cart"];

export function useCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setItemCount = useCartStore((s) => s.setItemCount);

  const query = useQuery({
    queryKey: CART_KEY,
    queryFn: getCart,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (query.data) setItemCount(query.data.item_count);
    if (!isAuthenticated) setItemCount(0);
  }, [query.data, isAuthenticated, setItemCount]);

  return query;
}

/** Shared mutation factory that pushes the returned cart straight into the cache. */
function useCartMutation<TArgs extends unknown[]>(fn: (...args: TArgs) => Promise<Cart>) {
  const qc = useQueryClient();
  const setItemCount = useCartStore((s) => s.setItemCount);
  return useMutation({
    mutationFn: (args: TArgs) => fn(...args),
    onSuccess: (cart) => {
      qc.setQueryData(CART_KEY, cart);
      setItemCount(cart.item_count);
    },
  });
}

export function useAddToCart() {
  return useCartMutation((variantId: string, quantity?: number) => addToCart(variantId, quantity));
}
export function useUpdateCartItem() {
  return useCartMutation((itemId: string, quantity: number) => updateCartItem(itemId, quantity));
}
export function useRemoveCartItem() {
  return useCartMutation((itemId: string) => removeCartItem(itemId));
}
export function useClearCart() {
  return useCartMutation(() => clearCart());
}
