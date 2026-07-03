import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/types/product";

interface Props {
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (variant: ProductVariant) => void;
}

/** Renders selectable size/color variants; out-of-stock options are disabled. */
export function VariantSelector({ variants, selectedId, onSelect }: Props) {
  const active = variants.filter((v) => v.is_active);
  if (active.length === 0) {
    return <p className="text-sm text-muted-foreground">No variants available.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium">Select option</span>
      <div className="flex flex-wrap gap-2">
        {active.map((v) => {
          const out = v.stock_quantity <= 0;
          const label = [v.size, v.color].filter(Boolean).join(" · ") || v.sku;
          return (
            <button
              key={v.id}
              type="button"
              disabled={out}
              onClick={() => onSelect(v)}
              className={cn(
                "rounded-md border px-3 py-2 text-sm transition-colors",
                v.id === selectedId
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-input hover:border-primary",
                out && "cursor-not-allowed text-muted-foreground line-through opacity-60",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      {(() => {
        const sel = active.find((v) => v.id === selectedId);
        if (sel && sel.stock_quantity > 0 && sel.stock_quantity < sel.low_stock_threshold) {
          return (
            <p className="text-sm text-orange-600">Only {sel.stock_quantity} left!</p>
          );
        }
        return null;
      })()}
    </div>
  );
}
