import { useMutation } from "@tanstack/react-query";
import {
  Check,
  ChevronRight,
  Heart,
  MapPin,
  Minus,
  Plus,
  RefreshCcw,
  Share2,
  Shield,
  ShoppingCart,
  Star,
  Tag,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { checkServiceability } from "@/api/shipping";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductRow } from "@/components/product/ProductRow";
import { StickyBuyBar } from "@/components/product/StickyBuyBar";
import { VariantSelector } from "@/components/product/VariantSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddToCart } from "@/hooks/useCart";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { recordRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useToggleWishlist } from "@/hooks/useWishlist";
import { trackAddToCart, trackViewProduct } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { BrandLoader } from "@/components/ui/BrandLoader";
import type { ProductVariant } from "@/types/product";

const PRODUCT_ASSURANCES = [
  { icon: Shield, text: "100% Authentic Products" },
  { icon: Truck, text: "Free Delivery on ₹999+" },
  { icon: RefreshCcw, text: "Easy 30-Day Returns" },
];

const OFFERS = [
  "Extra 5% off on prepaid orders — auto-applied at checkout",
  "Free insured shipping on orders above ₹999",
  "Certificate of authenticity included with every piece",
];

export default function ProductDetail() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openCart = useUiStore((s) => s.openCart);
  const addToCart = useAddToCart();
  const { data: product, isLoading, isError } = useProduct(slug);
  const [selected, setSelected] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { toggle: toggleWishlist, wishlistedIds } = useToggleWishlist();
  const [justAdded, setJustAdded] = useState(false);

  // "You may also like" — newest products, current one excluded.
  const { data: related } = useProducts({ sort: "newest", limit: 12 });

  usePageMeta({
    title: product?.name,
    description: product?.meta_desc ?? product?.description?.slice(0, 160),
    image: product?.images[0] ? `${product.images[0].url}?w=800` : undefined,
  });

  useEffect(() => {
    if (product) {
      trackViewProduct({ item_id: product.id, item_name: product.name, price: product.selling_price });
      recordRecentlyViewed({
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        base_price: product.base_price,
        selling_price: product.selling_price,
        is_active: product.is_active,
        is_featured: product.is_featured,
        primary_image: product.images[0] ?? null,
        total_stock: product.variants.reduce((a, v) => a + v.stock_quantity, 0),
        avg_rating: product.avg_rating,
        review_count: product.review_count,
        discount_percent: product.discount_percent,
      });
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center py-8 lg:py-12">
        <BrandLoader />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="container py-24 text-center">
        <div className="mb-4 text-6xl">😕</div>
        <h1 className="mb-2 text-2xl font-bold">Product not found</h1>
        <p className="mb-6 text-muted-foreground">The product you're looking for doesn't exist or has been removed.</p>
        <Link to="/products" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary/90">
          Browse All Products
        </Link>
      </div>
    );
  }

  const unitPrice = product.selling_price + (selected?.price_delta ?? 0);
  const totalPrice = unitPrice * quantity;
  const totalStock = product.variants.reduce((acc, v) => acc + v.stock_quantity, 0);
  const relatedItems = (related?.items ?? []).filter((p) => p.id !== product.id).slice(0, 10);

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
        trackAddToCart({
          item_id: product.id,
          item_name: product.name,
          price: unitPrice,
          quantity,
          item_variant: [selected.size, selected.color].filter(Boolean).join(" / ") || undefined,
        });
        toast.success("Added to cart! 🛍️");
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
        openCart();
      },
      onError: (e) =>
        toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Could not add to cart"),
    });
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-white dark:bg-gray-950">
        <div className="container py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="transition-colors hover:text-primary">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/products" className="transition-colors hover:text-primary">Products</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="max-w-40 truncate font-medium text-foreground">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container py-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div className="animate-fade-in-up">
            <ProductGallery images={product.images} name={product.name} />
          </div>

          {/* Info */}
          <div className="animate-fade-in-up space-y-6" style={{ animationDelay: "0.1s" }}>
            <div>
              {product.brand && (
                <Link
                  to={`/products?search=${encodeURIComponent(product.brand)}`}
                  className="text-sm font-semibold uppercase tracking-widest text-primary transition-colors hover:text-primary/80"
                >
                  {product.brand}
                </Link>
              )}
              <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">{product.name}</h1>
              {product.review_count > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded bg-green-600 px-1.5 py-0.5 text-xs font-bold text-white">
                    {product.avg_rating.toFixed(1)} <Star className="h-3 w-3 fill-current" />
                  </div>
                  <span className="text-sm text-muted-foreground">{product.review_count} reviews</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-bold">{formatPrice(unitPrice)}</span>
                {product.discount_percent > 0 && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">{formatPrice(product.base_price)}</span>
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-sm font-bold text-green-700">
                      {product.discount_percent}% OFF
                    </span>
                  </>
                )}
              </div>
              {product.discount_percent > 0 && (
                <p className="mt-1 text-sm font-medium text-green-600">
                  You save {formatPrice(product.base_price - product.selling_price)}!
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>
            </div>

            {/* Variants */}
            <VariantSelector variants={product.variants} selectedId={selected?.id ?? null} onSelect={setSelected} />

            {/* Quantity */}
            {selected && selected.stock_quantity > 0 && (
              <div>
                <label className="mb-2 block text-sm font-semibold">Quantity</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center overflow-hidden rounded-xl border border-border">
                    <button
                      className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-muted disabled:opacity-40"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
                    <button
                      className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-muted disabled:opacity-40"
                      disabled={quantity >= selected.stock_quantity}
                      onClick={() => setQuantity((q) => Math.min(selected.stock_quantity, q + 1))}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">{selected.stock_quantity} available</span>
                </div>
                {quantity > 1 && <p className="mt-1.5 text-sm font-medium text-primary">Total: {formatPrice(totalPrice)}</p>}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className={`h-12 flex-1 rounded-xl text-base font-semibold transition-all ${
                  justAdded ? "bg-green-600 hover:bg-green-600" : "bg-primary hover:bg-primary/90 hover:shadow-glow"
                }`}
                disabled={addToCart.isPending || totalStock === 0}
                onClick={handleAddToCart}
              >
                {justAdded ? (
                  <><Check className="h-5 w-5" /> Added to Cart!</>
                ) : addToCart.isPending ? (
                  "Adding..."
                ) : totalStock === 0 ? (
                  "Out of Stock"
                ) : (
                  <><ShoppingCart className="h-5 w-5" /> Add to Cart</>
                )}
              </Button>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-all ${
                  wishlistedIds.has(product.id) ? "border-red-200 bg-red-50 text-red-500" : "border-border hover:border-red-200 hover:text-red-500"
                }`}
                aria-label="Add to wishlist"
              >
                <Heart className={`h-5 w-5 ${wishlistedIds.has(product.id) ? "fill-current" : ""}`} />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast.success("Link copied!");
                }}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-border transition-all hover:border-primary/50 hover:text-primary"
                aria-label="Share product"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            {/* Delivery check */}
            <DeliveryCheck weightGrams={product.weight_grams} />

            {/* Offers */}
            <div className="rounded-2xl border border-border p-4">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold">
                <Tag className="h-4 w-4 text-primary" /> Available Offers
              </h2>
              <ul className="space-y-1.5">
                {OFFERS.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {o}
                  </li>
                ))}
              </ul>
            </div>

            {/* Assurances */}
            <div className="grid grid-cols-3 gap-3">
              {PRODUCT_ASSURANCES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/40 p-3 text-center">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-[11px] font-medium leading-tight text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            {product.description && (
              <div className="border-t border-border pt-2">
                <h2 className="mb-3 text-base font-bold">Product Description</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        <ProductReviews productId={product.id} />

        {relatedItems.length > 0 && (
          <div className="mt-12">
            <ProductRow title="You may also like" subtitle="More from the collection" products={relatedItems} />
          </div>
        )}
      </div>

      {/* Mobile sticky buy bar */}
      <StickyBuyBar
        price={unitPrice}
        originalPrice={product.discount_percent > 0 ? product.base_price : undefined}
        disabled={totalStock === 0}
        loading={addToCart.isPending}
        label={totalStock === 0 ? "Out of Stock" : "Add to Cart"}
        onClick={handleAddToCart}
      />
    </div>
  );
}

function DeliveryCheck({ weightGrams }: { weightGrams: number }) {
  const [pincode, setPincode] = useState("");
  const check = useMutation({ mutationFn: () => checkServiceability(pincode, weightGrams) });

  return (
    <div className="rounded-2xl border border-border p-4">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-bold">
        <MapPin className="h-4 w-4 text-primary" /> Check delivery
      </h2>
      <div className="flex gap-2">
        <Input
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Enter 6-digit pincode"
          className="h-10 rounded-xl"
          inputMode="numeric"
        />
        <Button
          variant="outline"
          className="h-10 rounded-xl"
          disabled={pincode.length !== 6 || check.isPending}
          onClick={() => check.mutate()}
        >
          {check.isPending ? "Checking…" : "Check"}
        </Button>
      </div>
      {check.data && (
        <p className={`mt-2 text-sm font-medium ${check.data.serviceable ? "text-green-600" : "text-destructive"}`}>
          {check.data.serviceable
            ? check.data.cheapest
              ? `Deliverable · from ${formatPrice(check.data.cheapest.rate)}${
                  check.data.cheapest.eta_days ? ` · ~${check.data.cheapest.eta_days} days` : ""
                }`
              : "Deliverable to this pincode ✓"
            : "Sorry, we don't deliver to this pincode yet."}
        </p>
      )}
      {check.isError && <p className="mt-2 text-sm text-destructive">Could not check right now. Try again.</p>}
    </div>
  );
}
