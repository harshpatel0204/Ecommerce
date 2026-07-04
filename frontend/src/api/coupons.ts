import { apiClient } from "@/api/client";

export interface CouponValidation {
  valid: boolean;
  code: string | null;
  discount_type: string | null;
  discount_value: number | null;
  discount_amount: number;
  message: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "flat";
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number | null;
  times_used: number;
  is_active: boolean;
}

export interface CouponPayload {
  code: string;
  description?: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  min_order_value?: number;
  max_discount?: number | null;
  valid_until?: string | null;
  usage_limit?: number | null;
  is_active?: boolean;
}

export async function validateCoupon(code: string, cartSubtotal: number): Promise<CouponValidation> {
  const { data } = await apiClient.post<CouponValidation>("/coupons/validate", {
    code,
    cart_subtotal: cartSubtotal,
  });
  return data;
}

// ---- Admin ----
export async function adminListCoupons(): Promise<Coupon[]> {
  const { data } = await apiClient.get<Coupon[]>("/admin/coupons");
  return data;
}

export async function adminCreateCoupon(payload: CouponPayload): Promise<Coupon> {
  const { data } = await apiClient.post<Coupon>("/admin/coupons", payload);
  return data;
}

export async function adminDeleteCoupon(id: string): Promise<void> {
  await apiClient.delete(`/admin/coupons/${id}`);
}
