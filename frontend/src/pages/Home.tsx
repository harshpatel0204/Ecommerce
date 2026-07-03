import { Link } from "react-router-dom";

import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories, useFeatured } from "@/hooks/useProducts";

export default function Home() {
  const { data: featured, isLoading } = useFeatured();
  const { data: categories } = useCategories();

  return (
    <div className="container space-y-10 py-8">
      <section className="rounded-xl bg-gradient-to-r from-primary/90 to-primary p-10 text-primary-foreground">
        <h1 className="text-3xl font-bold sm:text-4xl">Everyday essentials, thoughtfully made</h1>
        <p className="mt-2 max-w-xl text-primary-foreground/90">
          Discover our curated collection. Quality products delivered to your door.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-md bg-background px-5 py-2.5 text-sm font-medium text-foreground"
        >
          Shop all products
        </Link>
      </section>

      {categories && categories.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Shop by category</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/products?category_slug=${c.slug}`}
                className="rounded-full border px-4 py-2 text-sm hover:border-primary"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Featured products</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        ) : featured && featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No featured products yet.</p>
        )}
      </section>
    </div>
  );
}
