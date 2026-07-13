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

export interface CustomerOrderSummary {
  order_number: string;
  status: string;
  total_amount: number;
  placed_at: string;
}

export interface CustomerDetail {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  orders_count: number;
  total_spent: number;
  last_order_at: string | null;
  orders: CustomerOrderSummary[];
}

export interface TopProduct {
  product_name: string;
  units_sold: number;
  revenue: number;
}

export interface CategorySales {
  category: string;
  revenue: number;
  units: number;
}

export interface AnalyticsSummary {
  revenue: number;
  orders: number;
  avg_order_value: number;
  unique_customers: number;
}
