import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, ImageIcon, Images, Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { adminGetProducts } from "@/api/admin";
import {
  adminCreateBanner,
  adminDeleteBanner,
  adminListBanners,
  adminReorderBanners,
  adminUpdateBanner,
} from "@/api/banners";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { imageUrlById } from "@/lib/image";

export default function AdminBannerList() {
  const qc = useQueryClient();
  const { data: banners, isLoading } = useQuery({ queryKey: ["admin", "banners"], queryFn: adminListBanners });

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [productSearch, setProductSearch] = useState("");
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  const { data: productResults } = useQuery({
    queryKey: ["admin", "banner-product-search", productSearch],
    queryFn: () => adminGetProducts({ search: productSearch, limit: 6 }),
    enabled: productSearch.trim().length > 0 && !selected,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    qc.invalidateQueries({ queryKey: ["banners"] }); // storefront hero
  };

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setCtaText("");
    setSortOrder(0);
    setProductSearch("");
    setSelected(null);
  };

  const create = useMutation({
    mutationFn: () =>
      adminCreateBanner({
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        cta_text: ctaText.trim() || null,
        product_id: selected?.id ?? null,
        sort_order: sortOrder,
      }),
    onSuccess: () => {
      toast.success("Banner created");
      resetForm();
      invalidate();
    },
    onError: () => toast.error("Could not create banner"),
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => adminUpdateBanner(id, { is_active }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: adminDeleteBanner,
    onSuccess: () => {
      toast.success("Banner deleted");
      invalidate();
    },
  });

  // Drag-and-drop reordering (native HTML5 DnD, no extra dependency).
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const reorder = useMutation({
    mutationFn: adminReorderBanners,
    onSuccess: invalidate,
    onError: () => {
      toast.error("Could not reorder banners");
      invalidate();
    },
  });

  const onDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex || !banners) {
      setDragIndex(null);
      return;
    }
    const next = [...banners];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDragIndex(null);
    qc.setQueryData(["admin", "banners"], next); // optimistic
    reorder.mutate(next.map((b) => b.id));
  };

  return (
    <div className="animate-fade-in-up px-6 py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Images className="h-6 w-6 text-amber-400" /> Homepage Banners
        </h1>
        <p className="mt-0.5 text-sm text-slate-400">Each banner shows a product's image on the storefront hero and links to it.</p>
      </div>

      {/* Create form */}
      <div className="admin-glass mb-6 rounded-2xl p-6">
        <h2 className="mb-4 font-bold text-white">New banner</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
          />
          <Input
            placeholder="CTA text (e.g. Shop now)"
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            className="rounded-xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
          />
          <Input
            placeholder="Subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="rounded-xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 sm:col-span-2"
          />

          {/* Product picker */}
          <div className="sm:col-span-2">
            {selected ? (
              <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
                <span className="text-amber-200">Linked product: {selected.name}</span>
                <button onClick={() => setSelected(null)} className="text-amber-300 hover:text-amber-100" aria-label="Clear">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search a product to feature…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="rounded-xl border-white/10 bg-white/5 pl-10 text-slate-100 placeholder:text-slate-500"
                />
                {productResults && productResults.items.length > 0 && (
                  <div className="admin-glass-strong absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-white/10">
                    {productResults.items.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelected({ id: p.id, name: p.name });
                          setProductSearch("");
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5"
                      >
                        <img src={imageUrlById(p.primary_image?.id, 60)} alt="" className="h-7 w-7 rounded object-cover" />
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">Sort order</label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-24 rounded-xl border-white/10 bg-white/5 text-slate-100"
            />
          </div>
        </div>
        <Button
          className="mt-4 gap-2 rounded-xl"
          disabled={!title.trim() || create.isPending}
          onClick={() => create.mutate()}
        >
          <Plus className="h-4 w-4" /> {create.isPending ? "Creating…" : "Create banner"}
        </Button>
      </div>

      {/* Banner list */}
      {isLoading ? (
        <div className="admin-glass flex min-h-[30vh] items-center justify-center rounded-2xl p-8">
          <BrandLoader />
        </div>
      ) : !banners || banners.length === 0 ? (
        <div className="admin-glass rounded-2xl py-16 text-center text-slate-400">
          No banners yet — create one above to replace the default hero.
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b, i) => (
            <div
              key={b.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(i)}
              className={`admin-glass flex items-center gap-4 rounded-2xl p-4 transition-opacity ${
                dragIndex === i ? "opacity-40" : ""
              }`}
            >
              <span className="cursor-grab text-slate-600 hover:text-slate-400" title="Drag to reorder">
                <GripVertical className="h-5 w-5" />
              </span>
              <div className="h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-white/5">
                {b.image_id ? (
                  <img src={imageUrlById(b.image_id, 200)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-600">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{b.title}</span>
                  <Badge variant={b.is_active ? "success" : "secondary"}>{b.is_active ? "Live" : "Hidden"}</Badge>
                  <span className="text-xs text-slate-500">#{b.sort_order}</span>
                </div>
                {b.subtitle && <p className="truncate text-sm text-slate-400">{b.subtitle}</p>}
                <p className="text-xs text-slate-500">
                  {b.product_name ? `→ ${b.product_name}` : "No product linked"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
                  disabled={toggle.isPending}
                  onClick={() => toggle.mutate({ id: b.id, is_active: !b.is_active })}
                >
                  {b.is_active ? "Hide" : "Show"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(b.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
