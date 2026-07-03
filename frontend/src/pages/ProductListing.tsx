import { useSearchParams } from "react-router-dom";

import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories, useProducts } from "@/hooks/useProducts";
import type { ProductFilters } from "@/types/product";

const SORTS: { value: NonNullable<ProductFilters["sort"]>; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function ProductListing() {
  const [params, setParams] = useSearchParams();
  const { data: categories } = useCategories();

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

  return (
    <div className="container grid gap-6 py-6 md:grid-cols-[220px_1fr]">
      <aside className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Category</h3>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => update("category_slug", null)}
              className={`text-left text-sm ${!filters.category_slug ? "font-medium text-primary" : "text-muted-foreground"}`}
            >
              All
            </button>
            {categories?.map((c) => (
              <button
                key={c.id}
                onClick={() => update("category_slug", c.slug)}
                className={`text-left text-sm ${filters.category_slug === c.slug ? "font-medium text-primary" : "text-muted-foreground"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Sort by</h3>
          <select
            value={filters.sort}
            onChange={(e) => update("sort", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </aside>

      <section>
        {filters.search && (
          <p className="mb-4 text-sm text-muted-foreground">
            Results for “<span className="font-medium text-foreground">{filters.search}</span>”
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-destructive">Failed to load products.</p>
        ) : !data || data.items.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">No products found.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {data.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {data.pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => update("page", String(page - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {data.page} of {data.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pages}
                  onClick={() => update("page", String(page + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
