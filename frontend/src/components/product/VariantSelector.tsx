import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/types/product";

interface Props {
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (variant: ProductVariant) => void;
}

/** Selectable size/color variants; out-of-stock options are disabled. */
export function VariantSelector({ variants, selectedId, onSelect }: Props) {
  const active = variants.filter((v) => v.is_active);
  if (active.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        No variants available for this product.
      </div>
    );
  }

  const selected = active.find((v) => v.id === selectedId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Select an option</span>
        {selected && (
          <span className="text-xs text-muted-foreground">SKU: {selected.sku}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        {active.map((v) => {
          const out = v.stock_quantity <= 0;
          const isSelected = v.id === selectedId;
          const label = [v.size, v.color].filter(Boolean).join(" · ") || v.sku;
          return (
            <button
              key={v.id}
              type="button"
              disabled={out}
              onClick={() => onSelect(v)}
              className={cn(
                "group relative flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary/5 text-foreground shadow-[0_0_0_1px_hsl(var(--primary))]"
                  : "border-border hover:border-primary/60 hover:bg-muted/50",
                out && "cursor-not-allowed text-muted-foreground line-through opacity-50 hover:border-border hover:bg-transparent",
              )}
            >
              {v.color_hex && (
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: v.color_hex }}
                />
              )}
              {label}
            </button>
          );
        })}
      </div>

      {selected && selected.stock_quantity > 0 && selected.stock_quantity < selected.low_stock_threshold && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4" />
          Hurry! Only {selected.stock_quantity} left in stock
        </p>
      )}
      {selected && selected.stock_quantity <= 0 && (
        <p className="text-sm font-medium text-destructive">This option is out of stock.</p>
      )}
    </div>
  );
}
