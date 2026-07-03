import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { adminDeleteProduct, adminGetProducts } from "@/api/admin";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { imageUrl } from "@/lib/image";
import { formatPrice } from "@/lib/format";

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
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link to="/admin/products/new" className={buttonVariants()}>
          New product
        </Link>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name…"
        className="mb-4 max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No products.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={imageUrl(p.primary_image, 80)}
                        alt={p.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{formatPrice(p.selling_price)}</td>
                  <td className="p-3">
                    {p.total_stock}
                    {p.total_stock === 0 && (
                      <Badge variant="destructive" className="ml-2">
                        Out
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge variant={p.is_active ? "success" : "secondary"}>
                      {p.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/products/${p.id}/edit`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Edit
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={del.isPending}
                        onClick={() => del.mutate(p.id)}
                      >
                        Delete
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
