import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getBanners } from "@/api/banners";
import { ProductRow } from "@/components/product/ProductRow";
import { Countdown } from "@/components/ui/Countdown";
import { SectionReveal } from "@/components/ui/SectionReveal";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useCategories, useFeatured, useProducts } from "@/hooks/useProducts";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { imageUrlById } from "@/lib/image";

// ---- Bright promotional hero banners (Flipkart/Amazon style) ----
const BANNERS = [
  {
    title: "The Grand Coin Auction",
    subtitle: "Certified gold & silver rarities — up to 40% off",
    cta: "Shop the Collection",
    to: "/products",
    gradient: "from-amber-700 via-amber-800 to-yellow-900",
    emoji: "🪙",
  },
  {
    title: "Rare Banknotes",
    subtitle: "Historic RBI & world currency — freshly cataloged",
    cta: "Explore Notes",
    to: "/products?category_slug=world-banknotes",
    gradient: "from-emerald-800 via-emerald-900 to-green-950",
    emoji: "💵",
  },
  {
    title: "New Collector Arrivals",
    subtitle: "This week's most-wanted pieces before they're gone",
    cta: "See What's New",
    to: "/products?sort=newest",
    gradient: "from-red-900 via-rose-950 to-red-950",
    emoji: "✨",
  },
];

const PROMO_TILES = [
  { title: "Min. 30% Off", sub: "Starter coins", to: "/products?sort=price_asc", text: "text-primary" },
  { title: "Premium Gold", sub: "Investment grade", to: "/products?sort=price_desc", text: "text-gold" },
  { title: "Top Rated", sub: "Loved by collectors", to: "/products", text: "text-primary" },
  { title: "Free Delivery", sub: "On orders ₹999+", to: "/products", text: "text-gold" },
];

const TRUST = [
  { icon: ShieldCheck, text: "100% Authentic" },
  { icon: Truck, text: "Insured Delivery" },
  { icon: RefreshCcw, text: "Easy Returns" },
  { icon: Wallet, text: "Secure Payments" },
];

// Heritage tones — deep emerald (banknote green), antique gold, oxblood.
const CAT_COLORS = [
  "from-emerald-800 to-emerald-950",
  "from-amber-600 to-yellow-800",
  "from-emerald-700 to-teal-900",
  "from-red-900 to-rose-950",
  "from-yellow-700 to-amber-900",
  "from-emerald-900 to-green-950",
];

export default function Home() {
  usePageMeta({
    title: "Rare Coins & Banknotes Collection",
    description:
      "India's trusted store for rare and collectible coins & banknotes. Old Indian coins, foreign coins, currency notes — 100% authenticated.",
  });

  const { data: categories } = useCategories();
  const { data: featured, isLoading: featuredLoading } = useFeatured();
  const { data: newest, isLoading: newestLoading } = useProducts({ sort: "newest", limit: 12 });
  const { data: budget, isLoading: budgetLoading } = useProducts({ sort: "price_asc", limit: 12 });
  const recentlyViewed = useRecentlyViewed();

  // Deal timer resets at local midnight; computed once so it doesn't reset each render.
  const endOfDay = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  // Admin-managed banners drive the hero; fall back to the static promo set when
  // none are configured (or the banners table isn't migrated yet → []).
  const { data: dynamicBanners } = useQuery({ queryKey: ["banners"], queryFn: getBanners });
  const heroSlides =
    dynamicBanners && dynamicBanners.length > 0
      ? dynamicBanners.map((b, i) => ({
          title: b.title,
          subtitle: b.subtitle ?? "",
          cta: b.cta_text ?? "Shop now",
          to: b.product_slug ? `/products/${b.product_slug}` : "/products",
          imageUrl: b.image_id ? imageUrlById(b.image_id, 1200) : null,
          gradient: BANNERS[i % BANNERS.length].gradient,
          emoji: BANNERS[i % BANNERS.length].emoji,
        }))
      : BANNERS.map((b) => ({ ...b, imageUrl: null as string | null }));

  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % heroSlides.length), 5000);
    return () => clearInterval(t);
  }, [heroSlides.length]);
  const activeSlide = slide % heroSlides.length;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Category strip */}
      {categories && categories.length > 0 && (
        <div className="border-b border-border bg-card">
          <div className="container flex gap-6 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((c, i) => (
              <Link
                key={c.id}
                to={`/products?category_slug=${c.slug}`}
                className="group flex shrink-0 flex-col items-center gap-1.5"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${CAT_COLORS[i % CAT_COLORS.length]} text-white shadow-sm transition-transform group-hover:scale-105`}
                >
                  <span className="text-lg font-bold">{c.name.charAt(0)}</span>
                </div>
                <span className="max-w-[72px] truncate text-center text-xs font-medium text-foreground">
                  {c.name}
                </span>
              </Link>
            ))}
            <Link to="/products" className="group flex shrink-0 flex-col items-center gap-1.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">All</span>
            </Link>
          </div>
        </div>
      )}

      <div className="container space-y-6 py-5">
        {/* Hero banner carousel */}
        <section className="relative overflow-hidden rounded-2xl shadow-card">
          <div className="relative h-44 sm:h-56 md:h-72">
            {heroSlides.map((b, i) => (
              <Link
                to={b.to}
                key={i}
                className={`absolute inset-0 flex items-center bg-gradient-to-r ${b.gradient} transition-opacity duration-700 ${
                  i === activeSlide ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                {/* Product image background (admin banners), dimmed for text contrast. */}
                {b.imageUrl && (
                  <>
                    <img src={b.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                  </>
                )}
                <div className="relative flex w-full items-center justify-between px-6 sm:px-12">
                  <div className="max-w-lg text-white">
                    <h2 className="text-2xl font-extrabold drop-shadow-sm sm:text-4xl">{b.title}</h2>
                    <p className="mt-1.5 text-sm text-white/90 sm:text-base">{b.subtitle}</p>
                    <span className="mt-4 inline-flex items-center gap-2 rounded-md bg-card px-5 py-2.5 text-sm font-bold text-foreground shadow-md ring-1 ring-gold/30">
                      {b.cta} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                  {!b.imageUrl && (
                    <div className="hidden text-[7rem] leading-none drop-shadow-lg sm:block">{b.emoji}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <button
            onClick={() => setSlide((s) => (s - 1 + heroSlides.length) % heroSlides.length)}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow hover:bg-white"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSlide((s) => (s + 1) % heroSlides.length)}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow hover:bg-white"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all ${i === activeSlide ? "w-6 bg-white" : "w-1.5 bg-white/60"}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Promo tiles */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PROMO_TILES.map((t) => (
            <Link
              key={t.title}
              to={t.to}
              className="flex items-center justify-between rounded-lg border border-border bg-accent p-4 shadow-card transition-transform hover:-translate-y-0.5"
            >
              <div>
                <div className={`font-display text-lg font-bold ${t.text}`}>{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.sub}</div>
              </div>
              <ArrowRight className={`h-5 w-5 ${t.text}`} />
            </Link>
          ))}
        </section>

        {/* Product carousels */}
        <SectionReveal>
          <ProductRow
            title="Deals of the Day"
            subtitle="Handpicked & certified"
            products={featured}
            isLoading={featuredLoading}
            viewAllTo="/products"
            accessory={
              <span className="hidden items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 sm:flex">
                <span className="text-xs font-semibold text-destructive">Ends in</span>
                <Countdown to={endOfDay} />
              </span>
            }
          />
        </SectionReveal>
        <SectionReveal>
          <ProductRow
            title="New Arrivals"
            subtitle="Fresh in the vault"
            products={newest?.items}
            isLoading={newestLoading}
            viewAllTo="/products?sort=newest"
          />
        </SectionReveal>
        <SectionReveal>
          <ProductRow
            title="Best Value Picks"
            subtitle="Great starters under budget"
            products={budget?.items}
            isLoading={budgetLoading}
            viewAllTo="/products?sort=price_asc"
          />
        </SectionReveal>
        {recentlyViewed.length > 0 && (
          <SectionReveal>
            <ProductRow title="Recently Viewed" subtitle="Pick up where you left off" products={recentlyViewed} />
          </SectionReveal>
        )}

        {/* Trust strip */}
        <section className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-4">
          {TRUST.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center justify-center gap-2 text-sm font-medium">
              <Icon className="h-5 w-5 text-gold" />
              {text}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
