export interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  reviewer_name: string;
  is_verified: boolean;
  created_at: string;
}

export interface ProductReviews {
  avg_rating: number;
  review_count: number;
  rating_distribution: Record<string, number>;
  reviews: Review[];
}

export interface AdminReview {
  id: string;
  product_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  reviewer_name: string;
  is_approved: boolean;
  created_at: string;
}

export interface ReviewCreatePayload {
  product_id: string;
  order_id?: string;
  rating: number;
  title?: string;
  comment?: string;
}
