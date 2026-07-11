import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, PackageX, Pencil, Warehouse } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { adminGetProducts } from "@/api/admin";
import { getLowStock } from "@/api/adminOps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { formatPrice } from "@/lib/format";

function stockTone(stock: number): string {
  if (stock <= 0) return "text-rose-400";
  if (stock <= 5) return "text-amber-400";
  return "text-emerald-400";
}

export default function AdminInventory() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "inventory", search, page],
    queryFn: () => adminGetProducts({ search: search || undefined, page }),
  });
  const { data: lowStock } = useQuery({ queryKey: ["admin", "lowstock"], queryFn: getLowStock });

  const outOfStock = data?.items.filter((p) => p.total_stock <= 0).length ?? 0;

  const summary = [
    { label: "Products", value: data?.total ?? "—", icon: Warehouse, tint: "text-sky-300 bg-sky-500/15" },
    { label: "Low stock", value: lowStock?.length ?? "—", icon: AlertTriangle, tint: "text-amber-300 bg-amber-500/15" },
    { label: "Out of stock (page)", value: outOfStock, icon: PackageX, tint: "text-rose-300 bg-rose-500/15" },
  ];

  return (
    <div className="animate-fade-in-up px-6 py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Warehouse className="h-6 w-6 text-amber-400" /> Inventory
        </h1>
        <p className="mt-1 text-sm text-slate-400">Monitor stock levels and jump in to restock.</p>
      </div>

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {summary.map((s) => (
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

      {/* Low stock alerts */}
      {lowStock && lowStock.length > 0 && (
        <div className="admin-glass mb-6 rounded-2xl p-6">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-white">
            <AlertTriangle className="h-4 w-4 text-amber-400" /> Needs restocking
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {lowStock.map((v) => (
              <div
                key={v.variant_sku}
                className="flex items-center justify-between rounded-xl border border-amber-500/15 bg-amber-500/5 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-100">{v.product_name}</div>
                  <div className="text-xs text-slate-500">
                    {[v.size, v.color].filter(Boolean).join(" · ") || v.variant_sku}
                  </div>
                </div>
                <Badge variant="destructive">{v.stock_quantity} left</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search products…"
          className="max-w-xs rounded-xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
        />
      </div>

      {/* Products table */}
      {isLoading ? (
        <div className="admin-glass flex min-h-[30vh] items-center justify-center rounded-2xl p-8">
          <BrandLoader />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="admin-glass rounded-2xl py-16 text-center text-slate-400">No products found.</div>
      ) : (
        <>
          <div className="admin-glass overflow-hidden rounded-2xl">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-4 font-semibold">Product</th>
                  <th className="p-4 font-semibold">Price</th>
                  <th className="p-4 font-semibold">In stock</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id} className="border-t border-white/5 transition-colors hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/5">
                          {p.primary_image ? (
                            <img src={`${p.primary_image.url}?w=80`} alt={p.name} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <span className="font-medium text-slate-100">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{formatPrice(p.selling_price)}</td>
                    <td className={`p-4 font-semibold ${stockTone(p.total_stock)}`}>
                      {p.total_stock <= 0 ? "Out of stock" : `${p.total_stock} units`}
                    </td>
                    <td className="p-4">
                      <Badge variant={p.is_active ? "default" : "secondary"}>
                        {p.is_active ? "Active" : "Hidden"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end">
                        <Link
                          to={`/admin/products/${p.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-white/10"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Update stock
                        </Link>
                      </div>
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
