import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

import { getWishlist, removeFromWishlist } from "@/api/wishlist";
import { ProductCard } from "@/components/product/ProductCard";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Wishlist() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["wishlist"], queryFn: getWishlist });

  const remove = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  if (isLoading) {
    return (
      <div className="container grid grid-cols-2 gap-4 py-8 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="container flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg text-muted-foreground">Your wishlist is empty.</p>
        <Link to="/products" className={buttonVariants()}>
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="mb-4 text-2xl font-bold">Wishlist</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {data.map((p) => (
          <div key={p.id} className="relative">
            <button
              onClick={() => remove.mutate(p.id)}
              className="absolute right-2 top-2 z-10 rounded-full bg-background/90 p-1 shadow"
              aria-label="Remove"
            >
              <X className="h-4 w-4" />
            </button>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
