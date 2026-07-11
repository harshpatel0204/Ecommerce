import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowUpRight, IndianRupee, Package, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { getDashboardStats, getLowStock, getRecentOrders, getSalesChart } from "@/api/adminOps";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { statusBadgeVariant } from "@/lib/status";
import { formatPrice } from "@/lib/format";
import { BrandLoader } from "@/components/ui/BrandLoader";

/** Build a smooth cubic area + line path from a series of values. */
function buildPaths(values: number[], w = 100, h = 40, pad = 3) {
  const max = Math.max(...values, 1);
  const n = values.length;
  const pts = values.map((v, i): [number, number] => [
    n === 1 ? 0 : (i / (n - 1)) * w,
    h - pad - (v / max) * (h - pad * 2),
  ]);
  let line = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    line += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  const area = `${line} L ${pts[pts.length - 1][0]},${h} L ${pts[0][0]},${h} Z`;
  return { line, area };
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");
  const { data: stats, isLoading } = useQuery({ queryKey: ["admin", "stats"], queryFn: getDashboardStats });
  const { data: chart } = useQuery({ queryKey: ["admin", "chart", period], queryFn: () => getSalesChart(period) });
  const { data: recent } = useQuery({ queryKey: ["admin", "recent"], queryFn: getRecentOrders });
  const { data: lowStock } = useQuery({ queryKey: ["admin", "lowstock"], queryFn: getLowStock });

  if (isLoading || !stats) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <BrandLoader />
      </div>
    );
  }

  const cards = [
    {
      label: "Revenue today",
      value: formatPrice(stats.revenue_today),
      icon: IndianRupee,
      grad: "from-emerald-500/20 to-emerald-500/0",
      ring: "text-emerald-300 bg-emerald-500/15",
      glow: "rgba(16,185,129,0.15)",
    },
    {
      label: "Orders today",
      value: String(stats.orders_today),
      icon: ShoppingBag,
      grad: "from-sky-500/20 to-sky-500/0",
      ring: "text-sky-300 bg-sky-500/15",
      glow: "rgba(14,165,233,0.15)",
    },
    {
      label: "Pending orders",
      value: String(stats.orders_pending),
      icon: TrendingUp,
      grad: "from-amber-500/20 to-amber-500/0",
      ring: "text-amber-300 bg-amber-500/15",
      glow: "rgba(245,158,11,0.15)",
    },
    {
      label: "Low stock",
      value: String(stats.low_stock_products),
      icon: AlertTriangle,
      grad: "from-rose-500/20 to-rose-500/0",
      ring: "text-rose-300 bg-rose-500/15",
      glow: "rgba(244,63,94,0.15)",
    },
  ];

  const paths = chart ? buildPaths(chart.revenue) : null;
  const totalPeriodRevenue = chart ? chart.revenue.reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="animate-fade-in-up px-6 py-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Welcome back — here's how your store is doing.</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`admin-glass admin-glass-hover relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.grad} p-5`}
            style={{ boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 24px ${c.glow}` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{c.label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.ring}`}>
                <c.icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold text-white">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MiniStat icon={IndianRupee} label="Total revenue" value={formatPrice(stats.revenue_total)} />
        <MiniStat icon={Package} label="Active products" value={String(stats.products_total)} />
        <MiniStat
          icon={Users}
          label="Customers"
          value={`${stats.customers_total}`}
          hint={`+${stats.customers_new_this_month} this month`}
        />
      </div>

      {/* Revenue chart */}
      <div className="admin-glass mb-6 rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">Revenue</h2>
            <p className="mt-0.5 text-sm text-slate-400">
              {formatPrice(totalPeriodRevenue)} <span className="text-slate-600">· last {period}</span>
            </p>
          </div>
          <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {(["7d", "30d", "90d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  period === p ? "bg-amber-500 text-white shadow-glow" : "text-slate-400 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {chart && paths ? (
          <div className="relative h-48 w-full">
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full overflow-visible">
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(245,158,11)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="rgb(245,158,11)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* horizontal gridlines */}
              {[0, 10, 20, 30, 40].map((y) => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" />
              ))}
              <path d={paths.area} fill="url(#revFill)" />
              <path
                d={paths.line}
                fill="none"
                stroke="rgb(245,158,11)"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.5))" }}
              />
            </svg>
            <div className="mt-2 flex justify-between text-[10px] text-slate-500">
              <span>{chart.labels[0]}</span>
              <span>{chart.labels[Math.floor(chart.labels.length / 2)]}</span>
              <span>{chart.labels[chart.labels.length - 1]}</span>
            </div>
          </div>
        ) : (
          <Skeleton className="shimmer h-48 w-full rounded-xl" />
        )}
      </div>

      {/* Recent orders + low stock */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="admin-glass rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-white">Recent orders</h2>
            <Link to="/admin/orders" className="flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-amber-200">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {recent?.length ? (
              recent.map((o) => (
                <div
                  key={o.order_number}
                  className="flex items-center justify-between rounded-xl px-2 py-2 text-sm transition-colors hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-100">{o.order_number}</div>
                    <div className="truncate text-xs text-slate-500">{o.customer_name ?? "—"}</div>
                  </div>
                  <Badge variant={statusBadgeVariant(o.status)} className="capitalize">
                    {o.status.replace(/_/g, " ")}
                  </Badge>
                  <span className="w-20 text-right font-medium text-slate-100">{formatPrice(o.total_amount)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No orders yet.</p>
            )}
          </div>
        </div>

        <div className="admin-glass rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-white">Low stock alerts</h2>
            <Link to="/admin/inventory" className="flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-amber-200">
              Manage <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {lowStock?.length ? (
              lowStock.map((v) => (
                <div
                  key={v.variant_sku}
                  className="flex items-center justify-between rounded-xl px-2 py-2 text-sm transition-colors hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-100">{v.product_name}</div>
                    <div className="text-xs text-slate-500">
                      {[v.size, v.color].filter(Boolean).join(" · ") || v.variant_sku}
                    </div>
                  </div>
                  <Badge variant="destructive">{v.stock_quantity} left</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Everything is well stocked. 🎉</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="admin-glass admin-glass-hover rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="text-xs text-slate-400">{label}</div>
          <div className="text-lg font-bold text-white">
            {value} {hint && <span className="text-xs font-medium text-emerald-400">{hint}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
