import { apiClient } from "@/api/client";
import type { AdminReview, ProductReviews, Review, ReviewCreatePayload } from "@/types/review";

export async function getProductReviews(productId: string): Promise<ProductReviews> {
  const { data } = await apiClient.get<ProductReviews>(`/products/${productId}/reviews`);
  return data;
}

export async function createReview(payload: ReviewCreatePayload): Promise<Review> {
  const { data } = await apiClient.post<Review>("/reviews", payload);
  return data;
}

// ---- Admin ----
export async function adminListReviews(approved?: boolean): Promise<AdminReview[]> {
  const { data } = await apiClient.get<AdminReview[]>("/admin/reviews", {
    params: approved === undefined ? {} : { approved },
  });
  return data;
}

export async function adminApproveReview(id: string): Promise<void> {
  await apiClient.patch(`/admin/reviews/${id}/approve`);
}

export async function adminDeleteReview(id: string): Promise<void> {
  await apiClient.delete(`/admin/reviews/${id}`);
}
