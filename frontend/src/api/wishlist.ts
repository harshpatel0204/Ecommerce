import { apiClient } from "@/api/client";
import type { ProductListItem } from "@/types/product";

export async function getWishlist(): Promise<ProductListItem[]> {
  const { data } = await apiClient.get<ProductListItem[]>("/wishlist");
  return data;
}

export async function addToWishlist(productId: string): Promise<void> {
  await apiClient.post(`/wishlist/${productId}`);
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await apiClient.delete(`/wishlist/${productId}`);
}
