import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { ProductGallery } from "@/components/product/ProductGallery";
import { VariantSelector } from "@/components/product/VariantSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/format";
import type { ProductVariant } from "@/types/product";

export default function ProductDetail() {
  const { slug = "" } = useParams();
  const { data: product, isLoading, isError } = useProduct(slug);
  const [selected, setSelected] = useState<ProductVariant | null>(null);

  if (isLoading) {
    return (
      <div className="container grid gap-8 py-8 md:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return <div className="container py-20 text-center text-muted-foreground">Product not found.</div>;
  }

  const unitPrice = product.selling_price + (selected?.price_delta ?? 0);

  const addToCart = () => {
    if (!selected) {
      toast.error("Please select an option");
      return;
    }
    // Cart wiring arrives in Phase 3.
    toast.success(`Added ${product.name} (${[selected.size, selected.color].filter(Boolean).join(" · ")})`);
  };

  return (
    <div className="container grid gap-8 py-8 md:grid-cols-2">
      <ProductGallery images={product.images} name={product.name} />

      <div className="space-y-5">
        {product.brand && (
          <span className="text-sm uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </span>
        )}
        <h1 className="text-2xl font-bold">{product.name}</h1>

        <div className="flex items-center gap-3">
          <span className="text-2xl font-semibold">{formatPrice(unitPrice)}</span>
          {product.discount_percent > 0 && (
            <>
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.base_price)}
              </span>
              <Badge variant="success">{product.discount_percent}% OFF</Badge>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Inclusive of all taxes</p>

        <VariantSelector
          variants={product.variants}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
        />

        <Button size="lg" className="w-full sm:w-auto" onClick={addToCart}>
          Add to cart
        </Button>

        {product.description && (
          <div className="border-t pt-5">
            <h2 className="mb-2 font-semibold">Description</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
