import { Minus, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart, useRemoveCartItem, useUpdateCartItem } from "@/hooks/useCart";
import { formatPrice } from "@/lib/format";
import { imageUrlById } from "@/lib/image";

export default function Cart() {
  const navigate = useNavigate();
  const { data: cart, isLoading } = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();

  if (isLoading) {
    return (
      <div className="container space-y-3 py-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg text-muted-foreground">Your cart is empty.</p>
        <Link to="/products" className={buttonVariants()}>
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container grid gap-8 py-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-4 rounded-lg border p-3">
            <img
              src={imageUrlById(item.product.image_id, 120)}
              alt={item.product.name}
              className="h-24 w-24 rounded object-cover"
            />
            <div className="flex flex-1 flex-col">
              <Link to={`/products/${item.product.slug}`} className="font-medium hover:underline">
                {item.product.name}
              </Link>
              <span className="text-sm text-muted-foreground">
                {[item.variant.size, item.variant.color].filter(Boolean).join(" · ") ||
                  item.variant.sku}
              </span>
              {!item.available && (
                <span className="text-sm text-destructive">Unavailable / out of stock</span>
              )}
              <div className="mt-auto flex items-center gap-3">
                <div className="flex items-center rounded-md border">
                  <button
                    className="px-2 py-1 disabled:opacity-40"
                    disabled={item.quantity <= 1 || update.isPending}
                    onClick={() => update.mutate([item.id, item.quantity - 1])}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    className="px-2 py-1 disabled:opacity-40"
                    disabled={item.quantity >= item.variant.stock_quantity || update.isPending}
                    onClick={() => update.mutate([item.id, item.quantity + 1])}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => remove.mutate([item.id])}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="text-right font-semibold">{formatPrice(item.line_total)}</div>
          </div>
        ))}
      </div>

      <aside className="h-fit space-y-4 rounded-lg border p-5">
        <h2 className="font-semibold">Order summary</h2>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal ({cart.item_count} items)</span>
          <span>{formatPrice(cart.subtotal)}</span>
        </div>
        <p className="text-xs text-muted-foreground">Shipping & taxes calculated at checkout.</p>
        <Button
          className="w-full"
          disabled={cart.items.every((i) => !i.available)}
          onClick={() => navigate("/checkout")}
        >
          Proceed to checkout
        </Button>
      </aside>
    </div>
  );
}
