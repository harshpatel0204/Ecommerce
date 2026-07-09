import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Package } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { getOrders } from "@/api/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { statusBadgeVariant } from "@/lib/status";
import { formatPrice } from "@/lib/format";
import { imageUrlById } from "@/lib/image";

export default function OrderHistory() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["orders", page],
    queryFn: () => getOrders(page),
  });

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b border-border bg-white dark:bg-gray-950">
        <div className="container py-5">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Package className="h-6 w-6 text-primary" /> My Orders
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Track and manage your purchases</p>
        </div>
      </div>

      <div className="container py-8">
        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-border bg-white p-8 dark:bg-gray-900 shadow-card">
            <BrandLoader />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
              <Package className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h2 className="mb-2 text-xl font-bold">No orders yet</h2>
            <p className="mb-8 text-muted-foreground">When you place an order, it'll show up here.</p>
            <Link
              to="/products"
              className="inline-flex h-12 items-center rounded-xl bg-primary px-8 font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-glow"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data.items.map((o, i) => (
              <Link
                key={o.id}
                to={`/orders/${o.order_number}`}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-4 shadow-card transition-all hover:shadow-card-hover animate-fade-in-up dark:bg-gray-900"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <img src={imageUrlById(o.first_image_id, 120)} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{o.order_number}</span>
                    <Badge variant={statusBadgeVariant(o.status)} className="capitalize">
                      {o.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    {new Date(o.placed_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {o.item_count} item{o.item_count !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatPrice(o.total_amount)}</div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}

            {data.pages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-6">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {data.page} of {data.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
