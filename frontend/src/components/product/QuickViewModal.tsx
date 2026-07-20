import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { VariantSelector } from "@/components/product/VariantSelector";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { useAddToCart } from "@/hooks/useCart";
import { useProduct } from "@/hooks/useProducts";
import { trackAddToCart } from "@/lib/analytics";
import { imageUrl } from "@/lib/image";
import { formatPrice } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import type { ProductVariant } from "@/types/product";

export function QuickViewModal() {
  const { quickViewSlug, closeQuickView, openCart } = useUiStore();
  const open = quickViewSlug !== null;

  return (
    <Modal open={open} onClose={closeQuickView} widthClass="max-w-3xl">
      {quickViewSlug && (
        <QuickViewBody slug={quickViewSlug} onClose={closeQuickView} onAdded={openCart} />
      )}
    </Modal>
  );
}

function QuickViewBody({ slug, onClose, onAdded }: { slug: string; onClose: () => void; onAdded: () => void }) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: product, isLoading } = useProduct(slug);
  const addToCart = useAddToCart();
  const [selected, setSelected] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // Reset the picker whenever a different product opens.
  useEffect(() => {
    setSelected(null);
    setQuantity(1);
    setJustAdded(false);
  }, [slug]);

  if (isLoading || !product) {
    return <div className="shimmer h-80 w-full" />;
  }

  const unitPrice = product.selling_price + (selected?.price_delta ?? 0);

  const handleAdd = () => {
    if (!selected) {
      toast.error("Please select an option first");
      return;
    }
    if (!isAuthenticated) {
      onClose();
      navigate(`/login?next=/products/${slug}`);
      return;
    }
    addToCart.mutate([selected.id, quantity], {
      onSuccess: () => {
        trackAddToCart({
          item_id: product.id,
          item_name: product.name,
          price: unitPrice,
          quantity,
          item_variant: [selected.size, selected.color].filter(Boolean).join(" / ") || undefined,
        });
        setJustAdded(true);
        toast.success("Added to cart! 🛍️");
        setTimeout(() => {
          onClose();
          onAdded();
        }, 500);
      },
      onError: (e) =>
        toast.error(
          (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Could not add to cart",
        ),
    });
  };

  return (
    <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
      {/* Image */}
      <div className="overflow-hidden rounded-2xl bg-muted/50">
        <img
          src={imageUrl(product.images[0] ?? null, 600)}
          alt={product.name}
          className="aspect-square w-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col">
        {product.brand && (
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">{product.brand}</span>
        )}
        <h2 className="mt-1 text-xl font-bold leading-tight">{product.name}</h2>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold">{formatPrice(unitPrice)}</span>
          {product.discount_percent > 0 && (
            <>
              <span className="text-sm text-muted-foreground line-through">{formatPrice(product.base_price)}</span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                {product.discount_percent}% OFF
              </span>
            </>
          )}
        </div>

        <div className="mt-4">
          <VariantSelector variants={product.variants} selectedId={selected?.id ?? null} onSelect={setSelected} />
        </div>

        {selected && selected.stock_quantity > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-border">
              <button
                className="flex h-9 w-9 items-center justify-center hover:bg-muted disabled:opacity-40"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
              <button
                className="flex h-9 w-9 items-center justify-center hover:bg-muted disabled:opacity-40"
                disabled={quantity >= selected.stock_quantity}
                onClick={() => setQuantity((q) => Math.min(selected.stock_quantity, q + 1))}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">{selected.stock_quantity} available</span>
          </div>
        )}

        <div className="mt-auto space-y-2 pt-5">
          <Button
            className={`h-11 w-full rounded-xl font-semibold ${justAdded ? "bg-green-600 hover:bg-green-600" : ""}`}
            disabled={addToCart.isPending}
            onClick={handleAdd}
          >
            {justAdded ? (
              <><Check className="h-5 w-5" /> Added!</>
            ) : (
              <><ShoppingCart className="h-5 w-5" /> {addToCart.isPending ? "Adding…" : "Add to Cart"}</>
            )}
          </Button>
          <Link
            to={`/products/${slug}`}
            onClick={onClose}
            className="flex h-10 w-full items-center justify-center rounded-xl border border-border text-sm font-medium transition-colors hover:bg-muted"
          >
            View full details
          </Link>
        </div>
      </div>
    </div>
  );
}
