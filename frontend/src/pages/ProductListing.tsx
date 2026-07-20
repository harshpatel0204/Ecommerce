import { ChevronDown, Filter, Grid3X3, List, Search, SlidersHorizontal, X } from "lucide-react";
import { Fragment, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { ProductCard } from "@/components/product/ProductCard";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { useCategories, useProducts } from "@/hooks/useProducts";
import { BrandLoader } from "@/components/ui/BrandLoader";
import type { ProductFilters } from "@/types/product";

const SORTS: { value: NonNullable<ProductFilters["sort"]>; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const PRICE_RANGES: { label: string; min?: string; max?: string }[] = [
  { label: "Under ₹500", max: "500" },
  { label: "₹500 – ₹2,000", min: "500", max: "2000" },
  { label: "₹2,000 – ₹10,000", min: "2000", max: "10000" },
  { label: "Over ₹10,000", min: "10000" },
];

export default function ProductListing() {
  const [params, setParams] = useSearchParams();
  const { data: categories } = useCategories();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  usePageMeta({
    title: params.get("search") ? `Search: ${params.get("search")}` : "Shop All Coins & Banknotes",
    description: "Browse rare and collectible coins & banknotes — filter by category, price, and rating.",
  });

  const page = Number(params.get("page") ?? "1");
  const filters: ProductFilters = {
    search: params.get("search") ?? undefined,
    category_slug: params.get("category_slug") ?? undefined,
    min_price: params.get("min_price") ? Number(params.get("min_price")) : undefined,
    max_price: params.get("max_price") ? Number(params.get("max_price")) : undefined,
    sort: (params.get("sort") as ProductFilters["sort"]) ?? "newest",
    page,
    limit: 12,
  };
  const { data, isLoading, isError } = useProducts(filters);

  const setMany = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    setParams(next);
  };
  const update = (key: string, value: string | null) => setMany({ [key]: value });

  const activeCategory = categories?.find((c) => c.slug === filters.category_slug);
  const activePriceLabel = PRICE_RANGES.find(
    (r) => (r.min ?? "") === (params.get("min_price") ?? "") && (r.max ?? "") === (params.get("max_price") ?? ""),
  )?.label;
  const hasActiveFilter = !!(filters.category_slug || filters.search || filters.min_price || filters.max_price);

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">Category</h3>
        <div className="flex flex-col gap-0.5">
          <FilterOption active={!filters.category_slug} onClick={() => update("category_slug", null)} label="All Categories" />
          {categories?.map((c) => (
            <FilterOption
              key={c.id}
              active={filters.category_slug === c.slug}
              onClick={() => update("category_slug", c.slug)}
              label={c.name}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">Price</h3>
        <div className="flex flex-col gap-0.5">
          <FilterOption
            active={!filters.min_price && !filters.max_price}
            onClick={() => setMany({ min_price: null, max_price: null })}
            label="Any price"
          />
          {PRICE_RANGES.map((r) => (
            <FilterOption
              key={r.label}
              active={activePriceLabel === r.label}
              onClick={() => setMany({ min_price: r.min ?? null, max_price: r.max ?? null })}
              label={r.label}
            />
          ))}
        </div>
      </div>

      <div className="lg:hidden">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">Sort By</h3>
        <div className="flex flex-col gap-0.5">
          {SORTS.map((s) => (
            <FilterOption key={s.value} active={filters.sort === s.value} onClick={() => update("sort", s.value)} label={s.label} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-white dark:bg-gray-950">
        <div className="container py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {activeCategory?.name ?? (filters.search ? "Search results" : "All Products")}
              </h1>
              {filters.search && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Showing results for <span className="font-semibold text-foreground">"{filters.search}"</span>
                </p>
              )}
              {data && <p className="mt-1 text-sm text-muted-foreground">{data.total ?? data.items.length} products found</p>}
            </div>
          </div>

          {/* Active-filter chips */}
          {hasActiveFilter && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {activeCategory && <Chip label={activeCategory.name} onRemove={() => update("category_slug", null)} />}
              {filters.search && <Chip label={`"${filters.search}"`} onRemove={() => update("search", null)} />}
              {activePriceLabel && (
                <Chip label={activePriceLabel} onRemove={() => setMany({ min_price: null, max_price: null })} />
              )}
              <button
                onClick={() => setParams(new URLSearchParams())}
                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container py-6">
        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium transition-all hover:border-primary/50 hover:text-primary lg:hidden"
          >
            <Filter className="h-4 w-4" /> Filters
            {hasActiveFilter && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">!</span>
            )}
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sort:</span>
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => update("sort", e.target.value)}
                className="h-9 cursor-pointer appearance-none rounded-xl border border-border bg-white pl-3 pr-8 text-sm font-medium transition-all hover:border-primary/50 focus:border-primary focus:outline-none dark:bg-gray-900"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 rounded-xl border border-border p-1">
            {(["grid", "list"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                  viewMode === mode ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={`${mode} view`}
              >
                {mode === "grid" ? <Grid3X3 className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-7">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-32 rounded-2xl border border-border bg-white p-5 dark:bg-gray-900">
              <FilterSidebar />
            </div>
          </aside>

          {sidebarOpen && (
            <div className="fixed inset-0 z-[70] lg:hidden">
              <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={() => setSidebarOpen(false)} />
              <div className="absolute left-0 top-0 h-full w-72 animate-slide-in-right overflow-y-auto bg-white p-5 shadow-2xl dark:bg-gray-950">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-base font-bold">Filters</h2>
                  <button onClick={() => setSidebarOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <FilterSidebar />
                <Button className="mt-6 w-full rounded-xl" onClick={() => setSidebarOpen(false)}>
                  Show results
                </Button>
              </div>
            </div>
          )}

          <section className="min-w-0 flex-1">
            {isLoading ? (
              <div className="flex min-h-[45vh] w-full items-center justify-center py-12">
                <BrandLoader />
              </div>
            ) : isError ? (
              <div className="py-20 text-center">
                <div className="mb-4 text-5xl">😕</div>
                <p className="text-lg font-semibold">Failed to load products</p>
                <p className="mt-1 text-sm text-muted-foreground">Please try refreshing the page</p>
              </div>
            ) : !data || data.items.length === 0 ? (
              <div className="py-20 text-center">
                <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                <p className="text-lg font-semibold">No products found</p>
                <p className="mb-6 mt-1 text-sm text-muted-foreground">
                  {filters.search ? `We couldn't find anything for "${filters.search}"` : "No products match these filters."}
                </p>
                <button
                  onClick={() => setParams(new URLSearchParams())}
                  className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                  {data.items.map((p, i) => (
                    <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>

                {data.pages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => update("page", String(page - 1))}
                      className="h-9 rounded-xl px-4"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: data.pages }, (_, i) => i + 1)
                        .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === data.pages)
                        .map((p, i, arr) => (
                          <Fragment key={p}>
                            {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-muted-foreground">…</span>}
                            <button
                              onClick={() => update("page", String(p))}
                              className={`h-9 min-w-9 rounded-xl px-3 text-sm font-medium transition-all ${
                                p === page ? "bg-primary text-white shadow-sm" : "border border-border hover:border-primary/50 hover:text-primary"
                              }`}
                            >
                              {p}
                            </button>
                          </Fragment>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.pages}
                      onClick={() => update("page", String(page + 1))}
                      className="h-9 rounded-xl px-4"
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

function FilterOption({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
        active ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label}`} className="hover:text-primary/70">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
