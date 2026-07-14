import { apiClient } from "@/api/client";
import type {
  AbandonedCart,
  AdminUser,
  AdminUserListResponse,
  AnalyticsSummary,
  CategorySales,
  CustomerDetail,
  DashboardStats,
  LowStockItem,
  RecentOrder,
  SalesChart,
  TopProduct,
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

export async function adminGetCustomer(userId: string): Promise<CustomerDetail> {
  const { data } = await apiClient.get<CustomerDetail>(`/admin/users/${userId}`);
  return data;
}

// ---- Analytics ----
export async function adminGetAnalyticsSummary(days: number): Promise<AnalyticsSummary> {
  const { data } = await apiClient.get<AnalyticsSummary>("/admin/analytics/summary", {
    params: { days },
  });
  return data;
}

export async function adminGetTopProducts(days: number, limit = 10): Promise<TopProduct[]> {
  const { data } = await apiClient.get<TopProduct[]>("/admin/analytics/top-products", {
    params: { days, limit },
  });
  return data;
}

export async function adminGetSalesByCategory(days: number): Promise<CategorySales[]> {
  const { data } = await apiClient.get<CategorySales[]>("/admin/analytics/sales-by-category", {
    params: { days },
  });
  return data;
}

export async function adminGetAbandonedCarts(hours = 3): Promise<AbandonedCart[]> {
  const { data } = await apiClient.get<AbandonedCart[]>("/admin/abandoned-carts", {
    params: { hours },
  });
  return data;
}

/** Fetch the orders CSV as a blob and trigger a browser download. */
export async function adminDownloadOrdersCsv(params: { status?: string; search?: string }): Promise<void> {
  const { data } = await apiClient.get("/admin/orders/export.csv", { params, responseType: "blob" });
  const url = URL.createObjectURL(data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "orders.csv";
  a.click();
  URL.revokeObjectURL(url);
}
