import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, IndianRupee, Package, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { getDashboardStats, getLowStock, getRecentOrders, getSalesChart } from "@/api/adminOps";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { statusBadgeVariant } from "@/lib/status";
import { formatPrice } from "@/lib/format";

const card = "rounded-2xl border border-border bg-white p-5 shadow-card dark:bg-gray-900";

export default function AdminDashboard() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");
  const { data: stats, isLoading } = useQuery({ queryKey: ["admin", "stats"], queryFn: getDashboardStats });
  const { data: chart } = useQuery({ queryKey: ["admin", "chart", period], queryFn: () => getSalesChart(period) });
  const { data: recent } = useQuery({ queryKey: ["admin", "recent"], queryFn: getRecentOrders });
  const { data: lowStock } = useQuery({ queryKey: ["admin", "lowstock"], queryFn: getLowStock });

  const maxRev = chart ? Math.max(...chart.revenue, 1) : 1;

  const cards = [
    { label: "Revenue today", value: stats ? formatPrice(stats.revenue_today) : "—", icon: IndianRupee, tint: "text-green-600 bg-green-100" },
    { label: "Orders today", value: stats?.orders_today ?? "—", icon: ShoppingBag, tint: "text-blue-600 bg-blue-100" },
    { label: "Pending orders", value: stats?.orders_pending ?? "—", icon: TrendingUp, tint: "text-orange-600 bg-orange-100" },
    { label: "Low stock", value: stats?.low_stock_products ?? "—", icon: AlertTriangle, tint: "text-red-600 bg-red-100" },
  ];

  return (
    <div className="px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="shimmer h-28 rounded-2xl" />)
          : cards.map((c) => (
              <div key={c.label} className={card}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{c.label}</span>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.tint}`}>
                    <c.icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-3 text-2xl font-bold">{c.value}</div>
              </div>
            ))}
      </div>

      {/* Secondary stats */}
      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <MiniStat icon={IndianRupee} label="Total revenue" value={formatPrice(stats.revenue_total)} />
          <MiniStat icon={Package} label="Active products" value={String(stats.products_total)} />
          <MiniStat icon={Users} label="Customers" value={`${stats.customers_total} (+${stats.customers_new_this_month})`} />
        </div>
      )}

      {/* Chart */}
      <div className={`${card} mb-6`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">Revenue</h2>
          <div className="flex gap-1 rounded-xl border border-border p-1">
            {(["7d", "30d", "90d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  period === p ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {chart ? (
          <div className="flex h-40 items-end gap-1">
            {chart.revenue.map((rev, i) => (
              <div key={i} className="group relative flex-1" title={`${chart.labels[i]}: ${formatPrice(rev)}`}>
                <div
                  className="w-full rounded-t bg-primary/80 transition-all hover:bg-primary"
                  style={{ height: `${Math.max((rev / maxRev) * 100, 2)}%` }}
                />
              </div>
            ))}
          </div>
        ) : (
          <Skeleton className="shimmer h-40 w-full rounded-xl" />
        )}
      </div>

      {/* Recent orders + low stock */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <h2 className="mb-4 font-bold">Recent orders</h2>
          <div className="space-y-2">
            {recent?.length ? (
              recent.map((o) => (
                <div key={o.order_number} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{o.order_number}</div>
                    <div className="text-xs text-muted-foreground">{o.customer_name ?? "—"}</div>
                  </div>
                  <Badge variant={statusBadgeVariant(o.status)} className="capitalize">
                    {o.status.replace(/_/g, " ")}
                  </Badge>
                  <span className="w-20 text-right font-medium">{formatPrice(o.total_amount)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
          </div>
          <Link to="/admin/orders" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            View all orders →
          </Link>
        </div>

        <div className={card}>
          <h2 className="mb-4 font-bold">Low stock alerts</h2>
          <div className="space-y-2">
            {lowStock?.length ? (
              lowStock.map((v) => (
                <div key={v.variant_sku} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{v.product_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {[v.size, v.color].filter(Boolean).join(" · ") || v.variant_sku}
                    </div>
                  </div>
                  <Badge variant="destructive">{v.stock_quantity} left</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Everything is well stocked. 🎉</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string }) {
  return (
    <div className={card}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}
