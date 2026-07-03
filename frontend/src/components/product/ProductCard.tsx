import { Heart, Star, ShoppingBag, Eye } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { imageUrl } from "@/lib/image";
import { formatPrice } from "@/lib/format";
import type { ProductListItem } from "@/types/product";

export function ProductCard({ product }: { product: ProductListItem }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-border product-card-hover shadow-card">
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden bg-muted/50">
        {/* Placeholder shimmer while loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 shimmer" />
        )}
        <img
          src={imageUrl(product.primary_image, 400)}
          alt={product.primary_image?.alt_text ?? product.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {product.discount_percent > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500 text-white shadow-sm">
              -{product.discount_percent}%
            </span>
          )}
          {product.total_stock === 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-800/80 text-white backdrop-blur-sm shadow-sm">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
          className={`absolute right-2.5 top-2.5 h-8 w-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
            isWishlisted
              ? "bg-red-500 text-white scale-110"
              : "bg-white/90 text-gray-500 hover:bg-white hover:text-red-500 opacity-0 group-hover:opacity-100"
          }`}
          aria-label="Add to wishlist"
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        {/* Quick view button */}
        <Link
          to={`/products/${product.slug}`}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-white/95 text-gray-800 text-xs font-semibold shadow-card-hover opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 whitespace-nowrap hover:bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          <Eye className="h-3.5 w-3.5" /> Quick View
        </Link>
      </div>

      {/* Card body */}
      <Link to={`/products/${product.slug}`} className="flex flex-1 flex-col gap-2 p-3.5">
        {product.brand && (
          <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            {product.brand}
          </span>
        )}

        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.review_count > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= Math.round(product.avg_rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-200 fill-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {product.avg_rating.toFixed(1)} ({product.review_count})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-auto pt-1 flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">{formatPrice(product.selling_price)}</span>
          {product.discount_percent > 0 && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.base_price)}
            </span>
          )}
        </div>
      </Link>

      {/* Add to cart button - visible on hover */}
      <div className="px-3.5 pb-3.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
        <Link
          to={`/products/${product.slug}`}
          className={`flex w-full items-center justify-center gap-2 h-9 rounded-xl text-xs font-semibold transition-all ${
            product.total_stock === 0
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary/90 shadow-sm"
          }`}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          {product.total_stock === 0 ? "Out of Stock" : "Add to Cart"}
        </Link>
      </div>
    </div>
  );
}
