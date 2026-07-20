import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useCart, useRemoveCartItem, useUpdateCartItem } from "@/hooks/useCart";
import { imageUrlById } from "@/lib/image";
import { formatPrice } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";

export function CartDrawer() {
  const { cartOpen, closeCart } = useUiStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: cart, isLoading } = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();

  const items = cart?.items ?? [];

  return (
    <Drawer
      open={cartOpen}
      onClose={closeCart}
      title={
        <span className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          My Cart {cart ? `(${cart.item_count})` : ""}
        </span>
      }
      footer={
        isAuthenticated && items.length > 0 ? (
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-lg font-bold">{formatPrice(cart?.subtotal ?? 0)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={closeCart}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-glow"
            >
              Proceed to Checkout
            </Link>
            <Link
              to="/cart"
              onClick={closeCart}
              className="flex h-10 w-full items-center justify-center rounded-xl border border-border text-sm font-medium transition-colors hover:bg-muted"
            >
              View full cart
            </Link>
          </div>
        ) : null
      }
    >
      {!isAuthenticated ? (
        <EmptyState
          title="Sign in to view your cart"
          subtitle="Your saved items are waiting for you."
          cta={<CtaLink to="/login" label="Sign in" onClick={closeCart} />}
        />
      ) : isLoading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shimmer h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          subtitle="Explore our collection and add something you love."
          cta={<CtaLink to="/products" label="Start shopping" onClick={closeCart} />}
        />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((it) => (
            <li key={it.id} className="flex gap-3 p-4">
              <Link to={`/products/${it.product.slug}`} onClick={closeCart} className="shrink-0">
                <img
                  src={imageUrlById(it.product.image_id, 120)}
                  alt={it.product.name}
                  className="h-20 w-20 rounded-xl object-cover"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/products/${it.product.slug}`}
                  onClick={closeCart}
                  className="line-clamp-2 text-sm font-medium hover:text-primary"
                >
                  {it.product.name}
                </Link>
                {(it.variant.size || it.variant.color) && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[it.variant.size, it.variant.color].filter(Boolean).join(" · ")}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                      disabled={update.isPending || it.quantity <= 1}
                      onClick={() => update.mutate([it.id, it.quantity - 1])}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{it.quantity}</span>
                    <button
                      className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                      disabled={update.isPending || it.quantity >= it.variant.stock_quantity}
                      onClick={() => update.mutate([it.id, it.quantity + 1])}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-bold">{formatPrice(it.line_total)}</span>
                </div>
                {!it.available && (
                  <p className="mt-1 text-xs font-medium text-destructive">Currently unavailable</p>
                )}
              </div>
              <button
                onClick={() => remove.mutate([it.id])}
                disabled={remove.isPending}
                className="self-start text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}

function EmptyState({ title, subtitle, cta }: { title: string; subtitle: string; cta: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <ShoppingBag className="h-7 w-7 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {cta}
    </div>
  );
}

function CtaLink({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} className={buttonVariants({ className: "mt-1 rounded-xl" })}>
      {label}
    </Link>
  );
}
