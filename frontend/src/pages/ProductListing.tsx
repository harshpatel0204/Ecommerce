import { Filter, SlidersHorizontal, X, ChevronDown, Grid3X3, List, Search } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories, useProducts } from "@/hooks/useProducts";
import type { ProductFilters } from "@/types/product";

const SORTS: { value: NonNullable<ProductFilters["sort"]>; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function ProductListing() {
  const [params, setParams] = useSearchParams();
  const { data: categories } = useCategories();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const page = Number(params.get("page") ?? "1");
  const filters: ProductFilters = {
    search: params.get("search") ?? undefined,
    category_slug: params.get("category_slug") ?? undefined,
    sort: (params.get("sort") as ProductFilters["sort"]) ?? "newest",
    page,
    limit: 12,
  };
  const { data, isLoading, isError } = useProducts(filters);

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const activeSort = SORTS.find((s) => s.value === filters.sort) ?? SORTS[0];
  const hasActiveFilter = !!(filters.category_slug || filters.search);

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Category filter */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-foreground">Category</h3>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => update("category_slug", null)}
            className={`text-left px-3 py-2.5 text-sm rounded-xl transition-all font-medium ${
              !filters.category_slug
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All Categories
          </button>
          {categories?.map((c) => (
            <button
              key={c.id}
              onClick={() => update("category_slug", c.slug)}
              className={`text-left px-3 py-2.5 text-sm rounded-xl transition-all font-medium ${
                filters.category_slug === c.slug
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sort (mobile only, desktop has topbar) */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-foreground">Sort By</h3>
        <div className="flex flex-col gap-0.5">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => update("sort", s.value)}
              className={`text-left px-3 py-2.5 text-sm rounded-xl transition-all font-medium ${
                filters.sort === s.value
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="border-b border-border bg-white dark:bg-gray-950">
        <div className="container py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {filters.category_slug
                  ? categories?.find((c) => c.slug === filters.category_slug)?.name ?? "Products"
                  : filters.search
                  ? `Search results`
                  : "All Products"}
              </h1>
              {filters.search && (
                <p className="text-sm text-muted-foreground mt-1">
                  Showing results for{" "}
                  <span className="font-semibold text-foreground">"{filters.search}"</span>
                </p>
              )}
              {data && (
                <p className="text-sm text-muted-foreground mt-1">
                  {data.total ?? data.items.length} products found
                </p>
              )}
            </div>

            {hasActiveFilter && (
              <button
                onClick={() => {
                  const next = new URLSearchParams();
                  setParams(next);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:border-primary/50 hover:text-primary text-muted-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-6">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-border text-sm font-medium hover:border-primary/50 hover:text-primary transition-all lg:hidden"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilter && (
              <span className="h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">!</span>
            )}
          </button>

          {/* Desktop sort */}
          <div className="hidden lg:flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sort:</span>
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => update("sort", e.target.value)}
                className="h-9 pl-3 pr-8 rounded-xl border border-border bg-white dark:bg-gray-900 text-sm font-medium appearance-none cursor-pointer hover:border-primary/50 focus:outline-none focus:border-primary transition-all"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-muted-foreground" />
            </div>
          </div>

          {/* View mode */}
          <div className="flex items-center gap-1 ml-auto border border-border rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${viewMode === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${viewMode === "list" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex gap-7">
          {/* Sidebar desktop */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 rounded-2xl border border-border bg-white dark:bg-gray-900 p-5">
              <FilterSidebar />
            </div>
          </aside>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
              <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-gray-950 shadow-2xl p-5 overflow-y-auto animate-slide-in-right">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-bold">Filters</h2>
                  <button onClick={() => setSidebarOpen(false)} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <FilterSidebar />
              </div>
            </div>
          )}

          {/* Product grid */}
          <section className="flex-1 min-w-0">
            {isLoading ? (
              <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-border">
                    <Skeleton className="aspect-square w-full shimmer" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-3 w-14 shimmer" />
                      <Skeleton className="h-4 w-full shimmer" />
                      <Skeleton className="h-4 w-2/3 shimmer" />
                      <Skeleton className="h-5 w-20 shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="py-20 text-center">
                <div className="text-5xl mb-4">😕</div>
                <p className="text-lg font-semibold">Failed to load products</p>
                <p className="text-sm text-muted-foreground mt-1">Please try refreshing the page</p>
              </div>
            ) : !data || data.items.length === 0 ? (
              <div className="py-20 text-center">
                <Search className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-lg font-semibold">No products found</p>
                <p className="text-sm text-muted-foreground mt-1 mb-6">
                  {filters.search
                    ? `We couldn't find anything for "${filters.search}"`
                    : "No products in this category yet."}
                </p>
                <button
                  onClick={() => setParams(new URLSearchParams())}
                  className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:border-primary hover:text-primary transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                  {data.items.map((p, i) => (
                    <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {data.pages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => update("page", String(page - 1))}
                      className="rounded-xl h-9 px-4"
                    >
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: data.pages }, (_, i) => i + 1)
                        .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === data.pages)
                        .map((p, i, arr) => (
                          <>
                            {i > 0 && arr[i - 1] !== p - 1 && (
                              <span key={`dots-${p}`} className="px-1 text-muted-foreground">…</span>
                            )}
                            <button
                              key={p}
                              onClick={() => update("page", String(p))}
                              className={`h-9 min-w-9 px-3 rounded-xl text-sm font-medium transition-all ${
                                p === page
                                  ? "bg-primary text-white shadow-sm"
                                  : "border border-border hover:border-primary/50 hover:text-primary"
                              }`}
                            >
                              {p}
                            </button>
                          </>
                        ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.pages}
                      onClick={() => update("page", String(page + 1))}
                      className="rounded-xl h-9 px-4"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
