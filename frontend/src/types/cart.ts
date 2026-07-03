export interface CartItem {
  id: string;
  quantity: number;
  product: { id: string; name: string; slug: string; image_id: string | null };
  variant: {
    id: string;
    sku: string;
    size: string | null;
    color: string | null;
    color_hex: string | null;
    stock_quantity: number;
  };
  unit_price: number;
  line_total: number;
  available: boolean;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  item_count: number;
}
