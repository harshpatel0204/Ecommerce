import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, X } from "lucide-react";
import { Link } from "react-router-dom";

import { getWishlist, removeFromWishlist } from "@/api/wishlist";
import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Wishlist() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["wishlist"], queryFn: getWishlist });

  const remove = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-white dark:bg-gray-950">
        <div className="container py-5">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Heart className="h-6 w-6 text-primary" /> My Wishlist
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Items you've saved for later</p>
        </div>
      </div>

      <div className="container py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="shimmer aspect-square rounded-2xl" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
              <Heart className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h2 className="mb-2 text-xl font-bold">Your wishlist is empty</h2>
            <p className="mb-8 text-muted-foreground">Save products you love to find them easily later.</p>
            <Link
              to="/products"
              className="inline-flex h-12 items-center rounded-xl bg-primary px-8 font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-glow"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {data.map((p, i) => (
              <div key={p.id} className="relative animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <button
                  onClick={() => remove.mutate(p.id)}
                  className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-muted-foreground shadow-card transition-colors hover:text-destructive"
                  aria-label="Remove from wishlist"
                >
                  <X className="h-4 w-4" />
                </button>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
