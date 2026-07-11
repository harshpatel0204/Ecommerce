import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Check, FolderTree, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  adminCreateCategory,
  adminDeleteCategory,
  adminGetCategories,
  adminUpdateCategory,
} from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/types/product";

function apiError(err: unknown, fallback: string): string {
  return err instanceof AxiosError && err.response?.data?.detail
    ? String(err.response.data.detail)
    : fallback;
}

export default function AdminCategoryList() {
  const qc = useQueryClient();
  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: adminGetCategories,
  });

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const create = useMutation({
    mutationFn: () => adminCreateCategory({ name: newName.trim() }),
    onSuccess: () => { invalidate(); setNewName(""); toast.success("Category created"); },
    onError: (e) => toast.error(apiError(e, "Could not create category")),
  });

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => adminUpdateCategory(id, { name }),
    onSuccess: () => { invalidate(); setEditingId(null); toast.success("Category renamed"); },
    onError: (e) => toast.error(apiError(e, "Could not rename category")),
  });

  const toggleActive = useMutation({
    mutationFn: (cat: Category) => adminUpdateCategory(cat.id, { is_active: !cat.is_active }),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(apiError(e, "Could not update category")),
  });

  const remove = useMutation({
    mutationFn: adminDeleteCategory,
    onSuccess: () => { invalidate(); toast.success("Category deleted"); },
    onError: (e) => toast.error(apiError(e, "Could not delete category")),
  });

  const flat: { cat: Category; depth: number }[] = [];
  const walk = (nodes: Category[], depth: number) => {
    for (const node of nodes) {
      flat.push({ cat: node, depth });
      if (node.children?.length) walk(node.children, depth + 1);
    }
  };
  if (categories) walk(categories, 0);

  return (
    <div className="animate-fade-in-up px-6 py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <FolderTree className="h-6 w-6 text-amber-400" /> Categories
        </h1>
        <p className="mt-0.5 text-sm text-slate-400">
          Organize your catalog. Deactivate instead of deleting once products are assigned.
        </p>
      </div>

      <form
        className="mb-6 flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (newName.trim()) create.mutate();
        }}
      >
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name…"
          className="rounded-xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
        />
        <Button type="submit" className="gap-2 rounded-xl" disabled={create.isPending || !newName.trim()}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="shimmer h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : flat.length === 0 ? (
        <div className="admin-glass rounded-2xl py-16 text-center text-slate-400">
          No categories yet — add your first one above.
        </div>
      ) : (
        <div className="admin-glass overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Slug</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flat.map(({ cat, depth }) => (
                <tr key={cat.id} className="border-t border-white/5 transition-colors hover:bg-white/5">
                  <td className="p-4 font-medium text-slate-100" style={{ paddingLeft: `${16 + depth * 24}px` }}>
                    {editingId === cat.id ? (
                      <form
                        className="flex items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (editName.trim()) rename.mutate({ id: cat.id, name: editName.trim() });
                        }}
                      >
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-9 max-w-56 rounded-lg border-white/10 bg-white/5 text-slate-100"
                          autoFocus
                        />
                        <button type="submit" className="text-emerald-400 hover:text-emerald-300" aria-label="Save name">
                          <Check className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="text-slate-500" aria-label="Cancel">
                          <X className="h-4 w-4" />
                        </button>
                      </form>
                    ) : (
                      <span>{depth > 0 && "↳ "}{cat.name}</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-400">{cat.slug}</td>
                  <td className="p-4">
                    <button onClick={() => toggleActive.mutate(cat)} title="Click to toggle">
                      <Badge variant={cat.is_active ? "default" : "secondary"}>
                        {cat.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditName(cat.name);
                        }}
                        aria-label="Rename category"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                        onClick={() => remove.mutate(cat.id)}
                        aria-label="Delete category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
