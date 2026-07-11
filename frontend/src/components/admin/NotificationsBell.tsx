import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bell, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { getDashboardStats } from "@/api/adminOps";

/** Lightweight notification center derived from dashboard stats — surfaces
 *  actionable items (pending orders, low stock) without a dedicated backend. */
export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: stats } = useQuery({ queryKey: ["admin", "stats"], queryFn: getDashboardStats });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const items = [
    stats?.orders_pending
      ? {
          icon: ShoppingBag,
          tint: "text-amber-300 bg-amber-500/15",
          label: `${stats.orders_pending} order${stats.orders_pending === 1 ? "" : "s"} awaiting action`,
          to: "/admin/orders",
        }
      : null,
    stats?.low_stock_products
      ? {
          icon: AlertTriangle,
          tint: "text-rose-300 bg-rose-500/15",
          label: `${stats.low_stock_products} product${stats.low_stock_products === 1 ? "" : "s"} low on stock`,
          to: "/admin/inventory",
        }
      : null,
  ].filter(Boolean) as { icon: typeof Bell; tint: string; label: string; to: string }[];

  const count = items.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="admin-glass-strong animate-scale-in absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10">
          <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-white">Notifications</div>
          {count === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">You're all caught up. 🎉</p>
          ) : (
            <div className="py-1.5">
              {items.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 transition-colors hover:bg-white/5"
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${it.tint}`}>
                    <it.icon className="h-4 w-4" />
                  </span>
                  {it.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
