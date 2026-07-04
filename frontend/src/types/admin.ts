export interface DashboardStats {
  revenue_today: number;
  revenue_this_month: number;
  revenue_total: number;
  orders_today: number;
  orders_this_month: number;
  orders_pending: number;
  orders_shipped: number;
  products_total: number;
  low_stock_products: number;
  customers_total: number;
  customers_new_this_month: number;
}

export interface SalesChart {
  labels: string[];
  revenue: number[];
  orders: number[];
}

export interface LowStockItem {
  product_name: string;
  variant_sku: string;
  size: string | null;
  color: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
}

export interface RecentOrder {
  order_number: string;
  customer_name: string | null;
  total_amount: number;
  status: string;
  placed_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AdminUserListResponse {
  items: AdminUser[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}
