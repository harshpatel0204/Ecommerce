import { apiClient } from "@/api/client";
import type {
  AdminUser,
  AdminUserListResponse,
  DashboardStats,
  LowStockItem,
  RecentOrder,
  SalesChart,
} from "@/types/admin";
import type { Order, OrderListResponse } from "@/types/order";

// ---- Dashboard ----
export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>("/admin/dashboard/stats");
  return data;
}

export async function getSalesChart(period: "7d" | "30d" | "90d"): Promise<SalesChart> {
  const { data } = await apiClient.get<SalesChart>("/admin/dashboard/sales-chart", {
    params: { period },
  });
  return data;
}

export async function getLowStock(): Promise<LowStockItem[]> {
  const { data } = await apiClient.get<LowStockItem[]>("/admin/dashboard/low-stock");
  return data;
}

export async function getRecentOrders(): Promise<RecentOrder[]> {
  const { data } = await apiClient.get<RecentOrder[]>("/admin/dashboard/recent-orders");
  return data;
}

// ---- Orders ----
export async function adminGetOrders(params: {
  status?: string;
  search?: string;
  page?: number;
}): Promise<OrderListResponse> {
  const { data } = await apiClient.get<OrderListResponse>("/admin/orders", { params });
  return data;
}

export async function adminGetOrder(orderId: string): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/admin/orders/${orderId}`);
  return data;
}

export async function adminUpdateOrderStatus(
  orderId: string,
  status: string,
  note?: string,
): Promise<Order> {
  const { data } = await apiClient.patch<Order>(`/admin/orders/${orderId}/status`, { status, note });
  return data;
}

export async function adminShipOrder(orderId: string): Promise<Order> {
  const { data } = await apiClient.post<Order>(`/admin/orders/${orderId}/ship`);
  return data;
}

export async function adminGetLabel(orderId: string): Promise<{ label_url: string | null }> {
  const { data } = await apiClient.get<{ label_url: string | null }>(`/admin/orders/${orderId}/label`);
  return data;
}

export async function adminProcessReturn(orderId: string, approve: boolean): Promise<Order> {
  const { data } = await apiClient.post<Order>(`/admin/orders/${orderId}/process-return`, { approve });
  return data;
}

// ---- Users ----
export async function adminGetUsers(params: {
  search?: string;
  page?: number;
}): Promise<AdminUserListResponse> {
  const { data } = await apiClient.get<AdminUserListResponse>("/admin/users", { params });
  return data;
}

export async function adminToggleUserActive(userId: string): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(`/admin/users/${userId}/deactivate`);
  return data;
}
