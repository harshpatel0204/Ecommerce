export interface ProductImage {
  id: string;
  is_primary: boolean;
  display_order: number;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  url: string; // "/api/images/{id}"
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  price_delta: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  children: Category[];
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  base_price: number;
  selling_price: number;
  is_active: boolean;
  is_featured: boolean;
  primary_image: ProductImage | null;
  total_stock: number;
  avg_rating: number;
  review_count: number;
  discount_percent: number;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  short_desc: string | null;
  brand: string | null;
  category_id: string | null;
  base_price: number;
  selling_price: number;
  tax_percent: number;
  weight_grams: number;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  is_active: boolean;
  is_featured: boolean;
  meta_title: string | null;
  meta_desc: string | null;
  created_at: string;
  variants: ProductVariant[];
  images: ProductImage[];
  avg_rating: number;
  review_count: number;
  discount_percent: number;
}

export interface PaginatedProducts {
  items: ProductListItem[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface ProductFilters {
  category_slug?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}
