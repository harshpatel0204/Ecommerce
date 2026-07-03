export interface Address {
  id: string;
  label: string | null;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

export interface CheckoutResponse {
  order_id: string;
  order_number: string;
  razorpay_order_id: string | null;
  razorpay_key_id: string;
  amount_paise: number;
  total_amount: number;
  currency: string;
}

export interface OrderItem {
  product_name: string;
  product_sku: string;
  variant_sku: string;
  size: string | null;
  color: string | null;
  image_id: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface StatusHistoryEntry {
  status: string;
  note: string | null;
  changed_at: string;
}

export interface OrderListItem {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  placed_at: string;
  item_count: number;
  first_image_id: string | null;
}

export interface OrderListResponse {
  items: OrderListItem[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  shipping_address: Record<string, string | null>;
  razorpay_order_id: string | null;
  awb_number: string | null;
  courier_name: string | null;
  tracking_url: string | null;
  estimated_delivery: string | null;
  placed_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  items: OrderItem[];
  status_history: StatusHistoryEntry[];
}
