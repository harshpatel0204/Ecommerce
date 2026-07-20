import { apiClient } from "@/api/client";

export interface BannerPublic {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  product_slug: string | null;
  image_id: string | null;
}

export interface BannerAdmin extends BannerPublic {
  product_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  product_name: string | null;
}

export interface BannerPayload {
  title: string;
  subtitle?: string | null;
  cta_text?: string | null;
  product_id?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

// ---- Public ----
export async function getBanners(): Promise<BannerPublic[]> {
  const { data } = await apiClient.get<BannerPublic[]>("/banners");
  return data;
}

// ---- Admin ----
export async function adminListBanners(): Promise<BannerAdmin[]> {
  const { data } = await apiClient.get<BannerAdmin[]>("/admin/banners");
  return data;
}

export async function adminCreateBanner(payload: BannerPayload): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>("/admin/banners", payload);
  return data;
}

export async function adminUpdateBanner(id: string, payload: Partial<BannerPayload>): Promise<void> {
  await apiClient.patch(`/admin/banners/${id}`, payload);
}

export async function adminDeleteBanner(id: string): Promise<void> {
  await apiClient.delete(`/admin/banners/${id}`);
}

export async function adminReorderBanners(ids: string[]): Promise<void> {
  await apiClient.patch("/admin/banners/reorder", { ids });
}
