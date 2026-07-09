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
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ProductRow } from "@/components/product/ProductRow";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useCategories, useFeatured, useProducts } from "@/hooks/useProducts";

// ---- Bright promotional hero banners (Flipkart/Amazon style) ----
const BANNERS = [
  {
    title: "The Big Coin Sale",
    subtitle: "Up to 40% off on certified gold & silver coins",
    cta: "Shop Deals",
    to: "/products",
    gradient: "from-orange-500 via-amber-500 to-yellow-400",
    emoji: "🪙",
  },
  {
    title: "Rare Banknotes",
    subtitle: "Historic RBI & world currency — freshly cataloged",
    cta: "Explore Notes",
    to: "/products?category_slug=world-banknotes",
    gradient: "from-violet-600 via-purple-600 to-fuchsia-500",
    emoji: "💵",
  },
  {
    title: "New Collector Arrivals",
    subtitle: "Grab this week's most-wanted pieces before they're gone",
    cta: "See What's New",
    to: "/products?sort=newest",
    gradient: "from-sky-600 via-blue-600 to-indigo-600",
    emoji: "✨",
  },
];

const PROMO_TILES = [
  { title: "Min. 30% Off", sub: "Starter coins", to: "/products?sort=price_asc", bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600" },
  { title: "Premium Gold", sub: "Investment grade", to: "/products?sort=price_desc", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600" },
  { title: "Top Rated", sub: "Loved by collectors", to: "/products", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600" },
  { title: "Free Delivery", sub: "On orders ₹999+", to: "/products", bg: "bg-sky-50 dark:bg-sky-950/30", text: "text-sky-600" },
];

const TRUST = [
  { icon: ShieldCheck, text: "100% Authentic" },
  { icon: Truck, text: "Insured Delivery" },
  { icon: RefreshCcw, text: "Easy Returns" },
  { icon: Wallet, text: "Secure Payments" },
];

const CAT_COLORS = [
  "from-orange-400 to-amber-500",
  "from-violet-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-indigo-500 to-blue-700",
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

  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % BANNERS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Category strip */}
      {categories && categories.length > 0 && (
        <div className="border-b border-border bg-white dark:bg-gray-950">
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
            {BANNERS.map((b, i) => (
              <Link
                to={b.to}
                key={i}
                className={`absolute inset-0 flex items-center bg-gradient-to-r ${b.gradient} transition-opacity duration-700 ${
                  i === slide ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <div className="flex w-full items-center justify-between px-6 sm:px-12">
                  <div className="max-w-lg text-white">
                    <h2 className="text-2xl font-extrabold drop-shadow-sm sm:text-4xl">{b.title}</h2>
                    <p className="mt-1.5 text-sm text-white/90 sm:text-base">{b.subtitle}</p>
                    <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-gray-900 shadow-md">
                      {b.cta} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="hidden text-[7rem] leading-none drop-shadow-lg sm:block">{b.emoji}</div>
                </div>
              </Link>
            ))}
          </div>
          <button
            onClick={() => setSlide((s) => (s - 1 + BANNERS.length) % BANNERS.length)}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow hover:bg-white"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSlide((s) => (s + 1) % BANNERS.length)}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow hover:bg-white"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all ${i === slide ? "w-6 bg-white" : "w-1.5 bg-white/60"}`}
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
              className={`flex items-center justify-between rounded-2xl border border-border p-4 shadow-card transition-transform hover:-translate-y-0.5 ${t.bg}`}
            >
              <div>
                <div className={`text-lg font-extrabold ${t.text}`}>{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.sub}</div>
              </div>
              <ArrowRight className={`h-5 w-5 ${t.text}`} />
            </Link>
          ))}
        </section>

        {/* Product carousels */}
        <ProductRow
          title="Deals of the Day"
          subtitle="Handpicked & certified"
          products={featured}
          isLoading={featuredLoading}
          viewAllTo="/products"
        />
        <ProductRow
          title="New Arrivals"
          subtitle="Fresh in the vault"
          products={newest?.items}
          isLoading={newestLoading}
          viewAllTo="/products?sort=newest"
        />
        <ProductRow
          title="Best Value Picks"
          subtitle="Great starters under budget"
          products={budget?.items}
          isLoading={budgetLoading}
          viewAllTo="/products?sort=price_asc"
        />

        {/* Trust strip */}
        <section className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-white p-4 dark:bg-gray-950 sm:grid-cols-4">
          {TRUST.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center justify-center gap-2 text-sm font-medium">
              <Icon className="h-5 w-5 text-primary" />
              {text}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
