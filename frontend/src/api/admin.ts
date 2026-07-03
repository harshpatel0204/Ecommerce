import { apiClient } from "@/api/client";
import type {
  Category,
  PaginatedProducts,
  ProductDetail,
  ProductImage,
  ProductVariant,
} from "@/types/product";

export interface ProductPayload {
  name: string;
  category_id?: string | null;
  brand?: string | null;
  short_desc?: string | null;
  description?: string | null;
  base_price: number;
  selling_price: number;
  tax_percent?: number;
  weight_grams?: number;
  length_cm?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface VariantPayload {
  size?: string | null;
  color?: string | null;
  color_hex?: string | null;
  price_delta?: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  is_active?: boolean;
}

// ---- Products ----
export async function adminGetProducts(params: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedProducts> {
  const { data } = await apiClient.get<PaginatedProducts>("/admin/products", { params });
  return data;
}

export async function adminGetProduct(id: string): Promise<ProductDetail> {
  const { data } = await apiClient.get<ProductDetail>(`/admin/products/${id}`);
  return data;
}

export async function adminCreateProduct(payload: ProductPayload): Promise<ProductDetail> {
  const { data } = await apiClient.post<ProductDetail>("/admin/products", payload);
  return data;
}

export async function adminUpdateProduct(
  id: string,
  payload: Partial<ProductPayload>,
): Promise<ProductDetail> {
  const { data } = await apiClient.patch<ProductDetail>(`/admin/products/${id}`, payload);
  return data;
}

export async function adminDeleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/admin/products/${id}`);
}

// ---- Variants ----
export async function adminAddVariant(
  productId: string,
  payload: VariantPayload,
): Promise<ProductVariant> {
  const { data } = await apiClient.post<ProductVariant>(
    `/admin/products/${productId}/variants`,
    payload,
  );
  return data;
}

export async function adminUpdateVariant(
  id: string,
  payload: Partial<VariantPayload>,
): Promise<ProductVariant> {
  const { data } = await apiClient.patch<ProductVariant>(`/admin/variants/${id}`, payload);
  return data;
}

export async function adminUpdateStock(id: string, stock: number): Promise<ProductVariant> {
  const { data } = await apiClient.patch<ProductVariant>(`/admin/variants/${id}/stock`, {
    stock_quantity: stock,
  });
  return data;
}

// ---- Images ----
export async function adminUploadImage(
  productId: string,
  file: File,
  isPrimary = false,
  altText?: string,
): Promise<ProductImage> {
  const form = new FormData();
  form.append("file", file);
  form.append("is_primary", String(isPrimary));
  if (altText) form.append("alt_text", altText);
  const { data } = await apiClient.post<ProductImage>(
    `/admin/products/${productId}/images`,
    form,
  );
  return data;
}

export async function adminDeleteImage(productId: string, imageId: string): Promise<void> {
  await apiClient.delete(`/admin/products/${productId}/images/${imageId}`);
}

export async function adminReorderImages(
  productId: string,
  imageIds: string[],
): Promise<ProductImage[]> {
  const { data } = await apiClient.patch<ProductImage[]>(
    `/admin/products/${productId}/images/reorder`,
    { image_ids: imageIds },
  );
  return data;
}

// ---- Categories ----
export async function adminGetCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>("/admin/categories");
  return data;
}

export async function adminCreateCategory(payload: {
  name: string;
  parent_id?: string | null;
}): Promise<Category> {
  const { data } = await apiClient.post<Category>("/admin/categories", payload);
  return data;
}
