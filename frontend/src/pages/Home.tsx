import { ArrowRight, Sparkles, TrendingUp, Tag, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories, useFeatured } from "@/hooks/useProducts";

const HERO_FEATURES = [
  { icon: "🚀", text: "Lightning fast delivery" },
  { icon: "✨", text: "Premium quality guaranteed" },
  { icon: "💯", text: "100% authentic products" },
];

export default function Home() {
  const { data: featured, isLoading } = useFeatured();
  const { data: categories } = useCategories();

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-950 dark:to-purple-950/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="container relative py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in-up">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                New Collection 2025 — Shop Now
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                Everyday Essentials,{" "}
                <span className="text-gradient">Thoughtfully</span>{" "}
                Made
              </h1>

              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                Discover our curated collection of premium products. Quality craftsmanship delivered straight to your door across India.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all shadow-glow hover:shadow-lg hover:-translate-y-0.5"
                >
                  Shop All Products <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/products?sort=newest"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-white dark:bg-gray-900 border border-border font-semibold hover:border-primary/50 transition-all hover:-translate-y-0.5 shadow-card"
                >
                  New Arrivals
                </Link>
              </div>

              {/* Feature bullets */}
              <div className="flex flex-wrap gap-4 pt-2">
                {HERO_FEATURES.map((f) => (
                  <div key={f.text} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span>{f.icon}</span> {f.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero visual */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 rounded-3xl bg-gradient-hero shadow-2xl flex items-center justify-center animate-float">
                  <div className="text-center text-white">
                    <div className="text-7xl font-bold mb-2 font-display">B</div>
                    <div className="text-xl font-semibold tracking-wide">HariomCoins</div>
                    <div className="text-sm opacity-80 mt-1">Premium Quality</div>
                  </div>
                </div>
                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 px-4 py-2 rounded-2xl bg-white shadow-card-hover text-sm font-semibold animate-fade-in-up border border-border">
                  🔥 50% OFF
                </div>
                <div className="absolute -bottom-4 -left-4 px-4 py-2 rounded-2xl bg-white shadow-card-hover text-sm font-semibold border border-border" style={{animationDelay:"0.2s"}}>
                  ⭐ 4.9 Rating
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-white dark:bg-gray-950 py-5">
        <div className="container">
          <div className="grid grid-cols-3 gap-4 sm:flex sm:justify-around">
            {[
              { value: "10K+", label: "Happy Customers" },
              { value: "500+", label: "Premium Products" },
              { value: "50+", label: "Top Brands" },
              { value: "4.9★", label: "Average Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center last:hidden sm:last:block">
                <div className="text-xl sm:text-2xl font-bold text-gradient">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <section className="py-14">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 text-primary text-sm font-medium mb-1">
                  <Tag className="h-4 w-4" /> Browse Categories
                </div>
                <h2 className="text-2xl font-bold">Shop by Category</h2>
              </div>
              <Link
                to="/products"
                className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              {categories.map((c, i) => (
                <Link
                  key={c.id}
                  to={`/products?category_slug=${c.slug}`}
                  className="category-pill"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-14 bg-white dark:bg-gray-950/50">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-primary text-sm font-medium mb-1">
                <TrendingUp className="h-4 w-4" /> Trending Now
              </div>
              <h2 className="text-2xl font-bold">Featured Products</h2>
            </div>
            <Link
              to="/products"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-border hover:border-primary/50 hover:text-primary transition-all"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border" style={{ animationDelay: `${i * 0.05}s` }}>
                  <Skeleton className="aspect-square w-full shimmer" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-3 w-16 shimmer" />
                    <Skeleton className="h-4 w-full shimmer" />
                    <Skeleton className="h-4 w-3/4 shimmer" />
                    <Skeleton className="h-5 w-20 shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured && featured.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {featured.map((p, i) => (
                <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">
              <div className="text-5xl mb-4">🛍️</div>
              <p className="text-lg font-medium">No featured products yet.</p>
              <p className="text-sm mt-1">Check back soon for amazing deals!</p>
            </div>
          )}

          <div className="mt-10 text-center sm:hidden">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all"
            >
              View All Products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="py-14">
        <div className="container">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-hero p-8 sm:p-12">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>
            <div className="relative text-white max-w-lg">
              <div className="text-sm font-semibold opacity-80 mb-2 uppercase tracking-wider">Limited Time Offer</div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">Get 10% off your first order</h2>
              <p className="opacity-90 text-base mb-6">Use code <strong>HARIOM10</strong> at checkout. Valid on orders above ₹500.</p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-white text-primary font-bold hover:bg-white/90 transition-all shadow-lg hover:-translate-y-0.5"
              >
                Claim Your Discount <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
