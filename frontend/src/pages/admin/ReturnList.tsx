import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { adminGetOrders, adminProcessReturn } from "@/api/adminOps";
import { Badge } from "@/components/ui/badge";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { statusBadgeVariant } from "@/lib/status";
import { formatPrice } from "@/lib/format";

const TABS = [
  { key: "return_requested", label: "Requested" },
  { key: "returned", label: "Returned" },
  { key: "refunded", label: "Refunded" },
] as const;

export default function AdminReturnList() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("return_requested");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "returns", tab],
    queryFn: () => adminGetOrders({ status: tab }),
  });

  const mutation = useMutation({
    mutationFn: ({ orderId, approve }: { orderId: string; approve: boolean }) =>
      adminProcessReturn(orderId, approve),
    onSuccess: (_res, vars) => {
      toast.success(vars.approve ? "Return approved & refund initiated" : "Return rejected");
      qc.invalidateQueries({ queryKey: ["admin", "returns"] });
    },
    onError: () => toast.error("Could not process the return. Please try again."),
  });

  return (
    <div className="animate-fade-in-up px-6 py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <RotateCcw className="h-6 w-6 text-amber-400" /> Returns &amp; Refunds
        </h1>
        <p className="mt-1 text-sm text-slate-400">Review return requests and track refunded orders.</p>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-amber-500 text-white shadow-glow" : "text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="admin-glass flex min-h-[30vh] items-center justify-center rounded-2xl p-8">
          <BrandLoader />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="admin-glass rounded-2xl py-16 text-center text-slate-400">
          {tab === "return_requested"
            ? "No pending return requests. 🎉"
            : tab === "returned"
              ? "No returned orders yet."
              : "No refunded orders yet."}
        </div>
      ) : (
        <div className="admin-glass overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4 font-semibold">Order</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Items</th>
                <th className="p-4 font-semibold">Total</th>
                <th className="p-4 font-semibold">Status</th>
                {tab === "return_requested" && <th className="p-4 text-right font-semibold">Action</th>}
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
                  <td className="p-4">
                    <Badge variant={statusBadgeVariant(o.status)} className="capitalize">
                      {o.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  {tab === "return_requested" && (
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={mutation.isPending}
                          onClick={() => mutation.mutate({ orderId: o.id, approve: true })}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          disabled={mutation.isPending}
                          onClick={() => mutation.mutate({ orderId: o.id, approve: false })}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/25 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
