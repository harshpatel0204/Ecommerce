import { apiClient } from "@/api/client";
import type { CheckoutResponse, Order, OrderListResponse } from "@/types/order";

export interface VerifyPaymentPayload {
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function checkout(
  addressId: string,
  couponCode?: string,
  paymentMethod: "online" | "cod" = "online",
): Promise<CheckoutResponse> {
  const { data } = await apiClient.post<CheckoutResponse>("/orders/checkout", {
    address_id: addressId,
    coupon_code: couponCode ?? null,
    payment_method: paymentMethod,
  });
  return data;
}

export async function verifyPayment(payload: VerifyPaymentPayload): Promise<{ order_number: string }> {
  const { data } = await apiClient.post<{ success: boolean; order_number: string }>(
    "/orders/verify-payment",
    payload,
  );
  return data;
}

export async function getOrders(page = 1): Promise<OrderListResponse> {
  const { data } = await apiClient.get<OrderListResponse>("/orders", { params: { page } });
  return data;
}

export async function getOrder(orderNumber: string): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${orderNumber}`);
  return data;
}

export async function cancelOrder(orderId: string): Promise<Order> {
  const { data } = await apiClient.post<Order>(`/orders/${orderId}/cancel`);
  return data;
}

export async function requestReturn(orderId: string, reason?: string): Promise<Order> {
  const { data } = await apiClient.post<Order>(`/orders/${orderId}/return`, { reason });
  return data;
}
