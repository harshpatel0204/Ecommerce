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
    <div className="animate-fade-in-up px-6 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
        <ShoppingBag className="h-6 w-6 text-amber-400" /> Orders
      </h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search order number…"
          className="max-w-xs rounded-xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm capitalize text-slate-200"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="bg-slate-900">
              {s ? s.replace(/_/g, " ") : "All statuses"}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="admin-glass flex min-h-[30vh] items-center justify-center rounded-2xl p-8">
          <BrandLoader />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="admin-glass rounded-2xl py-16 text-center text-slate-400">No orders found.</div>
      ) : (
        <>
          <div className="admin-glass overflow-hidden rounded-2xl">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
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
                  <tr key={o.id} className="border-t border-white/5 transition-colors hover:bg-white/5">
                    <td className="p-4">
                      <Link to={`/admin/orders/${o.id}`} className="font-medium text-amber-300 hover:underline">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="p-4 text-slate-400">{new Date(o.placed_at).toLocaleDateString("en-IN")}</td>
                    <td className="p-4 text-slate-300">{o.item_count}</td>
                    <td className="p-4 font-medium text-slate-100">{formatPrice(o.total_amount)}</td>
                    <td className="p-4 capitalize text-slate-400">{o.payment_status}</td>
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
              <span className="text-sm text-slate-400">
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
