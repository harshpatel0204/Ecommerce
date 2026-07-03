import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

import { getOrders } from "@/api/orders";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { statusBadgeVariant } from "@/lib/status";
import { formatPrice } from "@/lib/format";
import { imageUrlById } from "@/lib/image";

export default function OrderHistory() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["orders", page],
    queryFn: () => getOrders(page),
  });

  if (isLoading) {
    return (
      <div className="container space-y-3 py-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="container flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg text-muted-foreground">No orders yet.</p>
        <Link to="/products" className={buttonVariants()}>
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container space-y-4 py-8">
      <h1 className="text-2xl font-bold">My orders</h1>
      {data.items.map((o) => (
        <Link
          key={o.id}
          to={`/orders/${o.order_number}`}
          className="flex items-center gap-4 rounded-lg border p-4 hover:shadow-sm"
        >
          <img
            src={imageUrlById(o.first_image_id, 80)}
            alt=""
            className="h-16 w-16 rounded object-cover"
          />
          <div className="flex-1">
            <div className="font-medium">{o.order_number}</div>
            <div className="text-sm text-muted-foreground">
              {new Date(o.placed_at).toLocaleDateString()} · {o.item_count} item(s)
            </div>
          </div>
          <Badge variant={statusBadgeVariant(o.status)} className="capitalize">
            {o.status.replace(/_/g, " ")}
          </Badge>
          <div className="w-24 text-right font-semibold">{formatPrice(o.total_amount)}</div>
        </Link>
      ))}

      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
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
  );
}
