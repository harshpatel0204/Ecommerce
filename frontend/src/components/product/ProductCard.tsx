import { Star } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { imageUrl } from "@/lib/image";
import { formatPrice } from "@/lib/format";
import type { ProductListItem } from "@/types/product";

export function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={imageUrl(product.primary_image, 400)}
          alt={product.primary_image?.alt_text ?? product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {product.discount_percent > 0 && (
          <Badge variant="success" className="absolute left-2 top-2">
            {product.discount_percent}% OFF
          </Badge>
        )}
        {product.total_stock === 0 && (
          <Badge variant="destructive" className="absolute right-2 top-2">
            Out of stock
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.brand && (
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium">{product.name}</h3>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <span className="text-base font-semibold">{formatPrice(product.selling_price)}</span>
          {product.discount_percent > 0 && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.base_price)}
            </span>
          )}
        </div>
        {product.review_count > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {product.avg_rating.toFixed(1)} ({product.review_count})
          </div>
        )}
      </div>
    </Link>
  );
}
