import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { adminGetOrders } from "@/api/adminOps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { statusBadgeVariant } from "@/lib/status";
import { formatPrice } from "@/lib/format";
import { BrandLoader } from "@/components/ui/BrandLoader";

const STATUSES = ["", "pending", "paid", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];

export default function AdminOrderList() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", status, search, page],
    queryFn: () => adminGetOrders({ status: status || undefined, search: search || undefined, page }),
  });

  return (
    <div className="px-6 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <ShoppingBag className="h-6 w-6 text-primary" /> Orders
      </h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search order number…"
          className="max-w-xs rounded-xl"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm capitalize"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s ? s.replace(/_/g, " ") : "All statuses"}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center rounded-2xl border border-border bg-white p-8 dark:bg-gray-900 shadow-card">
          <BrandLoader />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white py-16 text-center text-muted-foreground dark:bg-gray-900">
          No orders found.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card dark:bg-gray-900">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4 font-semibold">Order</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Items</th>
                  <th className="p-4 font-semibold">Total</th>
                  <th className="p-4 font-semibold">Payment</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-4">
                      <Link to={`/admin/orders/${o.id}`} className="font-medium text-primary hover:underline">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(o.placed_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-4">{o.item_count}</td>
                    <td className="p-4 font-medium">{formatPrice(o.total_amount)}</td>
                    <td className="p-4 capitalize text-muted-foreground">{o.payment_status}</td>
                    <td className="p-4">
                      <Badge variant={statusBadgeVariant(o.status)} className="capitalize">
                        {o.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {data.pages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
