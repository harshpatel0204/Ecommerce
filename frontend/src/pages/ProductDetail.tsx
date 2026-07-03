import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { ShoppingCart, Heart, Share2, Shield, Truck, RefreshCcw, Star, ChevronRight, Minus, Plus, Check } from "lucide-react";

import { ProductGallery } from "@/components/product/ProductGallery";
import { VariantSelector } from "@/components/product/VariantSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddToCart } from "@/hooks/useCart";
import { useProduct } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import type { ProductVariant } from "@/types/product";

const PRODUCT_ASSURANCES = [
  { icon: Shield, text: "100% Authentic Products" },
  { icon: Truck, text: "Free Delivery on ₹999+" },
  { icon: RefreshCcw, text: "Easy 30-Day Returns" },
];

export default function ProductDetail() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addToCart = useAddToCart();
  const { data: product, isLoading, isError } = useProduct(slug);
  const [selected, setSelected] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  if (isLoading) {
    return (
      <div className="container py-8 lg:py-12">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-8">
          <Skeleton className="h-4 w-12 shimmer" />
          <Skeleton className="h-4 w-4 shimmer rounded-full" />
          <Skeleton className="h-4 w-20 shimmer" />
        </div>
        <div className="grid gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-2xl shimmer" />
          <div className="space-y-5">
            <Skeleton className="h-5 w-24 shimmer" />
            <Skeleton className="h-9 w-3/4 shimmer" />
            <Skeleton className="h-8 w-1/3 shimmer" />
            <Skeleton className="h-24 w-full shimmer" />
            <Skeleton className="h-12 w-full shimmer rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="container py-24 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold mb-2">Product not found</h1>
        <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all">
          Browse All Products
        </Link>
      </div>
    );
  }

  const unitPrice = product.selling_price + (selected?.price_delta ?? 0);
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    if (!selected) {
      toast.error("Please select a variant first");
      return;
    }
    if (!isAuthenticated) {
      navigate(`/login?next=/products/${slug}`);
      return;
    }
    addToCart.mutate([selected.id, quantity], {
      onSuccess: () => {
        toast.success("Added to cart! 🛍️");
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
      },
      onError: (e) =>
        toast.error(
          (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
            "Could not add to cart",
        ),
    });
  };

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-white dark:bg-gray-950">
        <div className="container py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium truncate max-w-40">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container py-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div className="animate-fade-in-up">
            <ProductGallery images={product.images} name={product.name} />
          </div>

          {/* Product info */}
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            {/* Brand & title */}
            <div>
              {product.brand && (
                <Link
                  to={`/products?search=${encodeURIComponent(product.brand)}`}
                  className="text-sm font-semibold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                >
                  {product.brand}
                </Link>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold mt-1 leading-tight">{product.name}</h1>

              {/* Ratings */}
              {product.review_count > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`h-4 w-4 ${s <= Math.round(product.avg_rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">{product.avg_rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({product.review_count} reviews)</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold">{formatPrice(unitPrice)}</span>
                {product.discount_percent > 0 && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">{formatPrice(product.base_price)}</span>
                    <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold">
                      {product.discount_percent}% OFF
                    </span>
                  </>
                )}
              </div>
              {product.discount_percent > 0 && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  You save {formatPrice(product.base_price - product.selling_price)}!
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Inclusive of all taxes</p>
            </div>

            {/* Variant selector */}
            <VariantSelector
              variants={product.variants}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />

            {/* Quantity */}
            {selected && selected.stock_quantity > 0 && (
              <div>
                <label className="text-sm font-semibold mb-2 block">Quantity</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl border border-border overflow-hidden">
                    <button
                      className="h-10 w-10 flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-semibold text-sm">{quantity}</span>
                    <button
                      className="h-10 w-10 flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
                      disabled={quantity >= selected.stock_quantity}
                      onClick={() => setQuantity((q) => Math.min(selected.stock_quantity, q + 1))}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {selected.stock_quantity} available
                  </span>
                </div>
                {quantity > 1 && (
                  <p className="text-sm text-primary font-medium mt-1.5">
                    Total: {formatPrice(totalPrice)}
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className={`flex-1 h-12 rounded-xl font-semibold text-base transition-all ${
                  justAdded
                    ? "bg-green-600 hover:bg-green-600"
                    : "bg-primary hover:bg-primary/90 shadow-sm hover:shadow-glow"
                }`}
                disabled={addToCart.isPending || product.total_stock === 0}
                onClick={handleAddToCart}
              >
                {justAdded ? (
                  <><Check className="h-5 w-5" /> Added to Cart!</>
                ) : addToCart.isPending ? (
                  "Adding..."
                ) : product.total_stock === 0 ? (
                  "Out of Stock"
                ) : (
                  <><ShoppingCart className="h-5 w-5" /> Add to Cart</>
                )}
              </Button>

              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`h-12 w-12 rounded-xl border flex items-center justify-center transition-all ${
                  isWishlisted
                    ? "bg-red-50 border-red-200 text-red-500"
                    : "border-border hover:border-red-200 hover:text-red-500"
                }`}
                aria-label="Add to wishlist"
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
              </button>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast.success("Link copied!");
                }}
                className="h-12 w-12 rounded-xl border border-border flex items-center justify-center hover:border-primary/50 hover:text-primary transition-all"
                aria-label="Share product"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            {/* Assurances */}
            <div className="grid grid-cols-3 gap-3">
              {PRODUCT_ASSURANCES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/40 text-center">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-[11px] font-medium leading-tight text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-2 border-t border-border">
                <h2 className="text-base font-bold mb-3">Product Description</h2>
                <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
