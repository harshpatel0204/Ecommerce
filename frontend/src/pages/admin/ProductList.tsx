import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Search, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { adminDeleteProduct, adminGetProducts, adminImportProductsCsv } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { imageUrlById } from "@/lib/image";
import { BrandLoader } from "@/components/ui/BrandLoader";

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importCsv = useMutation({
    mutationFn: adminImportProductsCsv,
    onSuccess: (result) => {
      if (result.created > 0) {
        toast.success(`Imported ${result.created} product${result.created === 1 ? "" : "s"}`);
        qc.invalidateQueries({ queryKey: ["admin", "products"] });
      }
      result.errors.slice(0, 5).forEach((e) => toast.error(`Row ${e.row}: ${e.error}`));
      if (result.errors.length > 5) {
        toast.error(`…and ${result.errors.length - 5} more rows failed`);
      }
      if (result.created === 0 && result.errors.length === 0) {
        toast.info("The CSV contained no data rows");
      }
    },
    onError: (e) =>
      toast.error(
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "CSV import failed",
      ),
  });

  return (
    <div className="animate-fade-in-up px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Package className="h-6 w-6 text-amber-400" /> Products
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">Manage your catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importCsv.mutate(file);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            className="gap-2 rounded-xl border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
            disabled={importCsv.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {importCsv.isPending ? "Importing…" : "Import CSV"}
          </Button>
          <Link to="/admin/products/new" className={buttonVariants({ className: "gap-2 rounded-xl" })}>
            <Plus className="h-4 w-4" /> New product
          </Link>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="rounded-xl border-white/10 bg-white/5 pl-10 text-slate-100 placeholder:text-slate-500"
        />
      </div>

      {isLoading ? (
        <div className="admin-glass flex min-h-[30vh] items-center justify-center rounded-2xl p-8">
          <BrandLoader />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="admin-glass rounded-2xl py-16 text-center text-slate-400">No products found.</div>
      ) : (
        <div className="admin-glass overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
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
                <tr key={p.id} className="border-t border-white/5 transition-colors hover:bg-white/5">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={imageUrlById(p.primary_image?.id, 80)}
                        alt={p.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div>
                        <div className="font-medium text-slate-100">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium text-slate-100">{formatPrice(p.selling_price)}</td>
                  <td className="p-4 text-slate-300">
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
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                          className: "rounded-lg border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white",
                        })}
                      >
                        Edit
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
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
