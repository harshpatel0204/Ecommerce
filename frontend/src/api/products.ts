import { apiClient } from "@/api/client";
import type {
  Category,
  PaginatedProducts,
  ProductDetail,
  ProductFilters,
  ProductListItem,
} from "@/types/product";

export async function getProducts(filters: ProductFilters = {}): Promise<PaginatedProducts> {
  const { data } = await apiClient.get<PaginatedProducts>("/products", { params: filters });
  return data;
}

export async function getProduct(slug: string): Promise<ProductDetail> {
  const { data } = await apiClient.get<ProductDetail>(`/products/${slug}`);
  return data;
}

export async function getFeatured(): Promise<ProductListItem[]> {
  const { data } = await apiClient.get<ProductListItem[]>("/products/featured");
  return data;
}

export async function searchProducts(q: string, page = 1): Promise<PaginatedProducts> {
  const { data } = await apiClient.get<PaginatedProducts>("/search", { params: { q, page } });
  return data;
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>("/categories");
  return data;
}
