import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

interface Props {
  price: number;
  originalPrice?: number;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  onClick: () => void;
}

/** Mobile-only sticky purchase bar pinned to the thumb zone on product pages. */
export function StickyBuyBar({ price, originalPrice, disabled, loading, label = "Add to Cart", onClick }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 py-3 backdrop-blur-md lg:hidden">
      <div className="container flex items-center gap-3">
        <div className="min-w-0 leading-tight">
          <div className="text-lg font-bold">{formatPrice(price)}</div>
          {originalPrice && originalPrice > price && (
            <div className="text-xs text-muted-foreground line-through">{formatPrice(originalPrice)}</div>
          )}
        </div>
        <Button
          className="ml-auto h-11 flex-1 rounded-xl font-semibold shadow-sm"
          disabled={disabled || loading}
          onClick={onClick}
        >
          <ShoppingCart className="h-5 w-5" />
          {loading ? "Adding…" : label}
        </Button>
      </div>
    </div>
  );
}
