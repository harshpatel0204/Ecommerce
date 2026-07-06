import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductListItem } from "@/types/product";

interface Props {
  title: string;
  subtitle?: string;
  products: ProductListItem[] | undefined;
  isLoading?: boolean;
  viewAllTo?: string;
}

/** Flipkart/Amazon-style titled horizontal product carousel. */
export function ProductRow({ title, subtitle, products, isLoading, viewAllTo }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) =>
    scroller.current?.scrollBy({ left: dir * 340, behavior: "smooth" });

  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <section className="rounded-2xl border border-border bg-white shadow-card dark:bg-gray-950">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-base font-bold sm:text-lg">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {viewAllTo && (
            <Link
              to={viewAllTo}
              className="hidden text-xs font-semibold text-primary hover:underline sm:inline"
            >
              VIEW ALL
            </Link>
          )}
          <button
            onClick={() => scroll(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="flex gap-3 overflow-x-auto scroll-smooth p-4 sm:gap-4 sm:p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="shimmer aspect-[3/4] w-40 shrink-0 rounded-2xl sm:w-48" />
            ))
          : products!.map((p) => (
              <div key={p.id} className="w-40 shrink-0 sm:w-48">
                <ProductCard product={p} />
              </div>
            ))}
      </div>
    </section>
  );
}
