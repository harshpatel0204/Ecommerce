import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, IndianRupee, Mail, Phone, ShoppingBag } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { adminGetCustomer } from "@/api/adminOps";
import { Badge } from "@/components/ui/badge";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { statusBadgeVariant } from "@/lib/status";
import { formatPrice } from "@/lib/format";

export default function AdminCustomerDetail() {
  const { userId = "" } = useParams();
  const { data: c, isLoading } = useQuery({
    queryKey: ["admin", "customer", userId],
    queryFn: () => adminGetCustomer(userId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <BrandLoader />
      </div>
    );
  }
  if (!c) return <div className="px-6 py-16 text-center text-slate-400">Customer not found.</div>;

  const stats = [
    { label: "Lifetime spend", value: formatPrice(c.total_spent), icon: IndianRupee, tint: "text-emerald-300 bg-emerald-500/15" },
    { label: "Orders", value: String(c.orders_count), icon: ShoppingBag, tint: "text-sky-300 bg-sky-500/15" },
    {
      label: "Last order",
      value: c.last_order_at ? new Date(c.last_order_at).toLocaleDateString("en-IN") : "—",
      icon: Calendar,
      tint: "text-amber-300 bg-amber-500/15",
    },
  ];

  return (
    <div className="animate-fade-in-up px-6 py-8">
      <Link to="/admin/users" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-amber-300">
        <ArrowLeft className="h-4 w-4" /> Customers
      </Link>

      {/* Header */}
      <div className="admin-glass mb-6 flex flex-wrap items-center gap-4 rounded-2xl p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-hero text-xl font-bold text-white">
          {(c.full_name ?? c.email)[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{c.full_name ?? "—"}</h1>
            {c.is_admin && <Badge>Admin</Badge>}
            <Badge variant={c.is_active ? "success" : "secondary"}>{c.is_active ? "Active" : "Deactivated"}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {c.email}</span>
            {c.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {c.phone}</span>}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Joined {new Date(c.created_at).toLocaleDateString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="admin-glass admin-glass-hover rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.tint}`}>
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs text-slate-400">{s.label}</div>
                <div className="text-lg font-bold text-white">{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order history */}
      <div className="admin-glass overflow-hidden rounded-2xl">
        <h2 className="border-b border-white/10 px-6 py-4 font-bold text-white">Order history</h2>
        {c.orders.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-400">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4 font-semibold">Order</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {c.orders.map((o) => (
                <tr key={o.order_number} className="border-t border-white/5 transition-colors hover:bg-white/5">
                  <td className="p-4 font-medium text-amber-300">{o.order_number}</td>
                  <td className="p-4 text-slate-400">{new Date(o.placed_at).toLocaleDateString("en-IN")}</td>
                  <td className="p-4">
                    <Badge variant={statusBadgeVariant(o.status)} className="capitalize">
                      {o.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="p-4 text-right font-medium text-slate-100">{formatPrice(o.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
