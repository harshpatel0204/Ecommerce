import { Eye, Heart, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useToggleWishlist } from "@/hooks/useWishlist";
import { imageUrl } from "@/lib/image";
import { formatPrice } from "@/lib/format";
import { useUiStore } from "@/store/uiStore";
import type { ProductListItem } from "@/types/product";

export function ProductCard({ product }: { product: ProductListItem }) {
  const { toggle, wishlistedIds } = useToggleWishlist();
  const isWishlisted = wishlistedIds.has(product.id);
  const openQuickView = useUiStore((s) => s.openQuickView);
  const [imageLoaded, setImageLoaded] = useState(false);
  const soldOut = product.total_stock === 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card product-card-hover hover:border-gold/50">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted/50">
        {!imageLoaded && <div className="absolute inset-0 shimmer" />}
        <Link to={`/products/${product.slug}`}>
          <img
            src={imageUrl(product.primary_image, 400)}
            alt={product.primary_image?.alt_text ?? product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          />
        </Link>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {product.discount_percent > 0 && (
            <span className="inline-flex items-center rounded-sm bg-destructive px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-destructive-foreground shadow-sm">
              -{product.discount_percent}%
            </span>
          )}
          {soldOut && (
            <span className="inline-flex items-center rounded-sm bg-foreground/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-background shadow-sm backdrop-blur-sm">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={() => toggle(product.id)}
          className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-all duration-200 ${
            isWishlisted
              ? "scale-110 bg-primary text-primary-foreground"
              : "bg-card/90 text-muted-foreground opacity-0 hover:bg-card hover:text-primary group-hover:opacity-100"
          }`}
          aria-label="Add to wishlist"
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        {/* Quick view (opens modal — no page load) */}
        {!soldOut && (
          <button
            onClick={() => openQuickView(product.slug)}
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 translate-y-2 items-center gap-2 whitespace-nowrap rounded-full bg-card/95 px-4 py-2 text-xs font-semibold text-foreground opacity-0 shadow-card-hover transition-all duration-300 hover:bg-card group-hover:translate-y-0 group-hover:opacity-100"
          >
            <Eye className="h-3.5 w-3.5" /> Quick View
          </button>
        )}
      </div>

      {/* Body */}
      <Link to={`/products/${product.slug}`} className="flex flex-1 flex-col gap-2 p-3.5">
        {product.brand && (
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gold">{product.brand}</span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
          {product.name}
        </h3>
        {product.review_count > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 rounded-sm bg-primary px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground">
              {product.avg_rating.toFixed(1)} <Star className="h-2.5 w-2.5 fill-current" />
            </div>
            <span className="text-[11px] text-muted-foreground">({product.review_count})</span>
          </div>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-base font-bold text-foreground">{formatPrice(product.selling_price)}</span>
          {product.discount_percent > 0 && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.base_price)}</span>
          )}
        </div>
      </Link>

      {/* Add to cart (opens quick-view to pick a variant) */}
      <div className="px-3.5 pb-3.5">
        <button
          onClick={() => !soldOut && openQuickView(product.slug)}
          disabled={soldOut}
          className={`flex h-9 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all ${
            soldOut
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-primary text-white shadow-sm hover:bg-primary/90 hover:shadow-glow"
          }`}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          {soldOut ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
