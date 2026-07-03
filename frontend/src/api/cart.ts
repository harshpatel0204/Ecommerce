import { apiClient } from "@/api/client";
import type { Cart } from "@/types/cart";

export async function getCart(): Promise<Cart> {
  const { data } = await apiClient.get<Cart>("/cart");
  return data;
}

export async function addToCart(variantId: string, quantity = 1): Promise<Cart> {
  const { data } = await apiClient.post<Cart>("/cart/items", {
    variant_id: variantId,
    quantity,
  });
  return data;
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  const { data } = await apiClient.patch<Cart>(`/cart/items/${itemId}`, { quantity });
  return data;
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const { data } = await apiClient.delete<Cart>(`/cart/items/${itemId}`);
  return data;
}

export async function clearCart(): Promise<Cart> {
  const { data } = await apiClient.delete<Cart>("/cart");
  return data;
}
