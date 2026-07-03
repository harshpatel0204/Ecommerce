import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
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
      <div className="container py-8 lg:py-12">
        <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border p-4 flex gap-4">
                <Skeleton className="h-24 w-24 rounded-xl shrink-0 shimmer" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 shimmer" />
                  <Skeleton className="h-3 w-1/2 shimmer" />
                  <Skeleton className="h-8 w-28 shimmer rounded-lg" />
                </div>
                <Skeleton className="h-6 w-16 shimmer" />
              </div>
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container py-24 text-center">
        <div className="max-w-sm mx-auto">
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">
            Looks like you haven't added anything yet. Start shopping to fill it up!
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-glow"
          >
            Start Shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b border-border bg-white dark:bg-gray-950">
        <div className="container py-5">
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{cart.item_count} {cart.item_count === 1 ? "item" : "items"}</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Cart items */}
          <div className="space-y-4">
            {cart.items.map((item, i) => (
              <div
                key={item.id}
                className={`flex gap-4 rounded-2xl border border-border bg-white dark:bg-gray-900 p-4 shadow-card animate-fade-in-up ${!item.available ? "opacity-60" : ""}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Product image */}
                <Link to={`/products/${item.product.slug}`} className="shrink-0">
                  <div className="h-24 w-24 rounded-xl overflow-hidden bg-muted">
                    <img
                      src={imageUrlById(item.product.image_id, 120)}
                      alt={item.product.name}
                      className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>

                {/* Product info */}
                <div className="flex flex-1 flex-col min-w-0 gap-1.5">
                  <Link
                    to={`/products/${item.product.slug}`}
                    className="font-semibold text-sm hover:text-primary transition-colors line-clamp-2 leading-snug"
                  >
                    {item.product.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {[item.variant.size, item.variant.color].filter(Boolean).join(" · ") || item.variant.sku}
                  </span>
                  {!item.available && (
                    <span className="text-xs text-destructive font-medium">⚠️ Out of stock — remove to continue</span>
                  )}

                  <div className="mt-auto flex items-center gap-3 flex-wrap">
                    {/* Quantity controls */}
                    <div className="flex items-center rounded-xl border border-border overflow-hidden">
                      <button
                        className="h-8 w-8 flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors text-muted-foreground"
                        disabled={item.quantity <= 1 || update.isPending}
                        onClick={() => update.mutate([item.id, item.quantity - 1])}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        className="h-8 w-8 flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors text-muted-foreground"
                        disabled={item.quantity >= item.variant.stock_quantity || update.isPending}
                        onClick={() => update.mutate([item.id, item.quantity + 1])}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => remove.mutate([item.id])}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="shrink-0 text-right">
                  <p className="font-bold text-base">{formatPrice(item.line_total)}</p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatPrice(item.line_total / item.quantity)} each
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Continue shopping */}
            <Link
              to="/products"
              className="flex items-center gap-2 text-sm text-primary font-medium hover:underline mt-2"
            >
              ← Continue Shopping
            </Link>
          </div>

          {/* Order summary */}
          <div className="h-fit">
            <div className="rounded-2xl border border-border bg-white dark:bg-gray-900 p-6 shadow-card sticky top-24 space-y-5">
              <h2 className="text-lg font-bold">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({cart.item_count} items)</span>
                  <span className="font-medium">{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Shipping</span>
                  <span className="font-medium">
                    {cart.subtotal >= 99900 ? "FREE" : formatPrice(4900)}
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-base">Total</span>
                    <span className="font-bold text-xl">
                      {formatPrice(cart.subtotal >= 99900 ? cart.subtotal : cart.subtotal + 4900)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Including all taxes</p>
                </div>
              </div>

              {cart.subtotal < 99900 && (
                <div className="rounded-xl bg-primary/8 border border-primary/20 p-3 text-sm">
                  <p className="text-primary font-medium">
                    🚚 Add {formatPrice(99900 - cart.subtotal)} more for <strong>FREE shipping!</strong>
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-primary/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (cart.subtotal / 99900) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                className="w-full h-12 rounded-xl font-bold text-base bg-primary hover:bg-primary/90 shadow-sm hover:shadow-glow transition-all"
                disabled={cart.items.every((i) => !i.available)}
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4 ml-1" />
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span>🔒 Secure checkout</span>
                <span>·</span>
                <span>SSL encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
