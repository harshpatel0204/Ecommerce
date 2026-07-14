import { useQuery } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { adminGetAbandonedCarts } from "@/api/adminOps";
import { Badge } from "@/components/ui/badge";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { formatPrice } from "@/lib/format";

const THRESHOLDS = [
  { hours: 3, label: "3h+" },
  { hours: 24, label: "1d+" },
  { hours: 72, label: "3d+" },
] as const;

/** Compact "time since" label from an ISO timestamp. */
function ageLabel(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminAbandonedCarts() {
  const [hours, setHours] = useState<number>(3);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "abandoned-carts", hours],
    queryFn: () => adminGetAbandonedCarts(hours),
  });

  const totalValue = data?.reduce((sum, c) => sum + c.total_value, 0) ?? 0;

  return (
    <div className="animate-fade-in-up px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <ShoppingCart className="h-6 w-6 text-amber-400" /> Abandoned Carts
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {data ? `${data.length} cart${data.length === 1 ? "" : "s"} · ${formatPrice(totalValue)} recoverable` : "Carts sitting untouched"}
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {THRESHOLDS.map((t) => (
            <button
              key={t.hours}
              onClick={() => setHours(t.hours)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                hours === t.hours ? "bg-amber-500 text-white shadow-glow" : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="admin-glass flex min-h-[30vh] items-center justify-center rounded-2xl p-8">
          <BrandLoader />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="admin-glass rounded-2xl py-16 text-center text-slate-400">
          No abandoned carts in this window. 🎉
        </div>
      ) : (
        <div className="admin-glass overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Items</th>
                <th className="p-4 font-semibold">Cart value</th>
                <th className="p-4 font-semibold">Sitting for</th>
                <th className="p-4 font-semibold">Reminder</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.user_id} className="border-t border-white/5 transition-colors hover:bg-white/5">
                  <td className="p-4">
                    <Link to={`/admin/users/${c.user_id}`} className="font-medium text-amber-300 hover:underline">
                      {c.full_name ?? c.email}
                    </Link>
                    {c.full_name && <div className="text-xs text-slate-500">{c.email}</div>}
                  </td>
                  <td className="p-4 text-slate-300">{c.item_count}</td>
                  <td className="p-4 font-medium text-slate-100">{formatPrice(c.total_value)}</td>
                  <td className="p-4 text-slate-400">{ageLabel(c.oldest_added_at)}</td>
                  <td className="p-4">
                    <Badge variant={c.reminder_sent ? "success" : "secondary"}>
                      {c.reminder_sent ? "Sent" : "Not sent"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
