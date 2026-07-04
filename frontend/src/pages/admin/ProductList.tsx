import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { adminDeleteProduct, adminGetProducts } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { imageUrlById } from "@/lib/image";

export default function AdminProductList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", search],
    queryFn: () => adminGetProducts({ search: search || undefined, limit: 50 }),
  });

  const del = useMutation({
    mutationFn: adminDeleteProduct,
    onSuccess: () => {
      toast.success("Product deactivated");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Package className="h-6 w-6 text-primary" /> Products
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage your catalog</p>
        </div>
        <Link to="/admin/products/new" className={buttonVariants({ className: "gap-2 rounded-xl" })}>
          <Plus className="h-4 w-4" /> New product
        </Link>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="rounded-xl pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="shimmer h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white py-16 text-center text-muted-foreground dark:bg-gray-900">
          No products found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4 font-semibold">Product</th>
                <th className="p-4 font-semibold">Price</th>
                <th className="p-4 font-semibold">Stock</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="border-t border-border transition-colors hover:bg-muted/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={imageUrlById(p.primary_image?.id, 80)}
                        alt={p.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium">{formatPrice(p.selling_price)}</td>
                  <td className="p-4">
                    {p.total_stock}
                    {p.total_stock === 0 && (
                      <Badge variant="destructive" className="ml-2">
                        Out
                      </Badge>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant={p.is_active ? "success" : "secondary"}>
                      {p.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/products/${p.id}/edit`}
                        className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-lg" })}
                      >
                        Edit
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg text-muted-foreground hover:text-destructive"
                        disabled={del.isPending}
                        onClick={() => del.mutate(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
