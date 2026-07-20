import { useQuery } from "@tanstack/react-query";
import { BarChart3, IndianRupee, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

import {
  adminGetAnalyticsSummary,
  adminGetSalesByCategory,
  adminGetTopProducts,
  getSalesChart,
} from "@/api/adminOps";
import { AreaChart } from "@/components/admin/AreaChart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";

const PERIODS = [
  { key: 7, label: "7d" },
  { key: 30, label: "30d" },
  { key: 90, label: "90d" },
] as const;

export default function AdminAnalytics() {
  const [days, setDays] = useState<number>(30);

  const { data: summary } = useQuery({
    queryKey: ["admin", "analytics", "summary", days],
    queryFn: () => adminGetAnalyticsSummary(days),
  });
  const { data: top } = useQuery({
    queryKey: ["admin", "analytics", "top", days],
    queryFn: () => adminGetTopProducts(days, 10),
  });
  const { data: byCat } = useQuery({
    queryKey: ["admin", "analytics", "cat", days],
    queryFn: () => adminGetSalesByCategory(days),
  });
  const period = days === 7 ? "7d" : days === 30 ? "30d" : "90d";
  const { data: chart } = useQuery({
    queryKey: ["admin", "analytics", "chart", period],
    queryFn: () => getSalesChart(period),
  });

  const cards = [
    { label: "Revenue", value: summary ? formatPrice(summary.revenue) : "—", icon: IndianRupee, tint: "text-emerald-300 bg-emerald-500/15" },
    { label: "Orders", value: summary ? String(summary.orders) : "—", icon: ShoppingBag, tint: "text-sky-300 bg-sky-500/15" },
    { label: "Avg order value", value: summary ? formatPrice(summary.avg_order_value) : "—", icon: TrendingUp, tint: "text-amber-300 bg-amber-500/15" },
    { label: "Unique buyers", value: summary ? String(summary.unique_customers) : "—", icon: Users, tint: "text-violet-300 bg-violet-500/15" },
  ];

  const maxCat = byCat && byCat.length ? Math.max(...byCat.map((c) => c.revenue), 1) : 1;

  return (
    <div className="animate-fade-in-up px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <BarChart3 className="h-6 w-6 text-amber-400" /> Analytics
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">Sales performance over the selected period (paid orders).</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setDays(p.key)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                days === p.key ? "bg-amber-500 text-white shadow-glow" : "text-slate-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="admin-glass admin-glass-hover rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{c.label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.tint}`}>
                <c.icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold text-white">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue trend */}
      <div className="admin-glass mb-6 rounded-2xl p-6">
        <h2 className="mb-4 font-bold text-white">Revenue trend</h2>
        {chart ? (
          <AreaChart values={chart.revenue} labels={chart.labels} />
        ) : (
          <Skeleton className="shimmer h-48 w-full rounded-xl" />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top products */}
        <div className="admin-glass overflow-hidden rounded-2xl">
          <h2 className="border-b border-white/10 px-6 py-4 font-bold text-white">Top products</h2>
          {!top ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="shimmer h-8 w-full rounded-lg" />
              ))}
            </div>
          ) : top.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-slate-400">No sales in this period.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-4 font-semibold">Product</th>
                  <th className="p-4 font-semibold">Units</th>
                  <th className="p-4 text-right font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {top.map((p) => (
                  <tr key={p.product_name} className="border-t border-white/5 hover:bg-white/5">
                    <td className="p-4 font-medium text-slate-100">{p.product_name}</td>
                    <td className="p-4 text-slate-300">{p.units_sold}</td>
                    <td className="p-4 text-right font-medium text-slate-100">{formatPrice(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Sales by category */}
        <div className="admin-glass rounded-2xl p-6">
          <h2 className="mb-4 font-bold text-white">Sales by category</h2>
          {!byCat ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="shimmer h-8 w-full rounded-lg" />
              ))}
            </div>
          ) : byCat.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No sales in this period.</p>
          ) : (
            <div className="space-y-3">
              {byCat.map((c) => (
                <div key={c.category}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-200">{c.category}</span>
                    <span className="font-medium text-slate-100">{formatPrice(c.revenue)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                      style={{ width: `${Math.max((c.revenue / maxCat) * 100, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
