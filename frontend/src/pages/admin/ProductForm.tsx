import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import {
  adminCreateProduct,
  adminGetCategories,
  adminGetProduct,
  adminUpdateProduct,
  type ProductPayload,
} from "@/api/admin";
import { ProductImageManager } from "@/components/admin/ProductImageManager";
import { VariantManager } from "@/components/admin/VariantManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/types/product";
import { BrandLoader } from "@/components/ui/BrandLoader";

const schema = z.object({
  name: z.string().min(1, "Required"),
  category_id: z.string().optional(),
  brand: z.string().optional(),
  short_desc: z.string().optional(),
  description: z.string().optional(),
  base_price: z.coerce.number().positive("Must be > 0"),
  selling_price: z.coerce.number().positive("Must be > 0"),
  tax_percent: z.coerce.number().min(0),
  weight_grams: z.coerce.number().int().min(0),
  length_cm: z.coerce.number().optional(),
  width_cm: z.coerce.number().optional(),
  height_cm: z.coerce.number().optional(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function flatten(cats: Category[], depth = 0): { id: string; label: string }[] {
  return cats.flatMap((c) => [
    { id: c.id, label: `${"— ".repeat(depth)}${c.name}` },
    ...flatten(c.children, depth + 1),
  ]);
}

const card = "admin-glass rounded-2xl p-6";
const labelCls = "text-slate-300";
const inputCls = "rounded-xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500";
const selectCls = "h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200";

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: categories, isLoading: catsLoading } = useQuery({ queryKey: ["admin", "categories"], queryFn: adminGetCategories });
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => adminGetProduct(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tax_percent: 18, weight_grams: 500, is_active: true, is_featured: false },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        category_id: product.category_id ?? undefined,
        brand: product.brand ?? "",
        short_desc: product.short_desc ?? "",
        description: product.description ?? "",
        base_price: product.base_price,
        selling_price: product.selling_price,
        tax_percent: product.tax_percent,
        weight_grams: product.weight_grams,
        length_cm: product.length_cm ?? undefined,
        width_cm: product.width_cm ?? undefined,
        height_cm: product.height_cm ?? undefined,
        is_active: product.is_active,
        is_featured: product.is_featured,
      });
    }
  }, [product, reset]);

  const base = watch("base_price");
  const selling = watch("selling_price");
  const discount = base && selling && base > selling ? Math.round(((base - selling) / base) * 100) : 0;

  const onSubmit = async (values: FormValues) => {
    const payload: ProductPayload = { ...values, category_id: values.category_id || null };
    try {
      if (isEdit) {
        await adminUpdateProduct(id!, payload);
        qc.invalidateQueries({ queryKey: ["admin", "product", id] });
        toast.success("Product saved");
      } else {
        const created = await adminCreateProduct(payload);
        toast.success("Product created — add images and variants");
        navigate(`/admin/products/${created.id}/edit`, { replace: true });
      }
    } catch {
      toast.error("Save failed");
    }
  };

  if (catsLoading || (isEdit && productLoading)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <BrandLoader />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/admin/products" className="flex items-center gap-1 text-sm text-slate-400 hover:text-amber-300">
            <ArrowLeft className="h-4 w-4" /> Products
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-white">{isEdit ? "Edit product" : "New product"}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={`${card} space-y-5`}>
        <div className="space-y-2">
          <Label htmlFor="name" className={labelCls}>Product name</Label>
          <Input id="name" className={inputCls} {...register("name")} />
          {errors.name && <p className="text-sm text-rose-400">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category_id" className={labelCls}>Category</Label>
            <select id="category_id" {...register("category_id")} className={selectCls}>
              <option value="" className="bg-slate-900">—</option>
              {categories &&
                flatten(categories).map((o) => (
                  <option key={o.id} value={o.id} className="bg-slate-900">
                    {o.label}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand" className={labelCls}>Brand</Label>
            <Input id="brand" className={inputCls} {...register("brand")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="short_desc" className={labelCls}>Short description</Label>
          <Input id="short_desc" className={inputCls} {...register("short_desc")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description" className={labelCls}>Description</Label>
          <Textarea id="description" rows={4} className={inputCls} {...register("description")} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="base_price" className={labelCls}>MRP (base)</Label>
            <Input id="base_price" type="number" step="0.01" className={inputCls} {...register("base_price")} />
            {errors.base_price && <p className="text-sm text-rose-400">{errors.base_price.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="selling_price" className={labelCls}>Selling price</Label>
            <Input id="selling_price" type="number" step="0.01" className={inputCls} {...register("selling_price")} />
            {errors.selling_price && <p className="text-sm text-rose-400">{errors.selling_price.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className={labelCls}>Discount</Label>
            <div className="flex h-10 items-center text-sm font-semibold text-emerald-400">{discount}%</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tax_percent" className={labelCls}>Tax %</Label>
            <Input id="tax_percent" type="number" step="0.01" className={inputCls} {...register("tax_percent")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight_grams" className={labelCls}>Weight (g)</Label>
            <Input id="weight_grams" type="number" className={inputCls} {...register("weight_grams")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="length_cm" className={labelCls}>L (cm)</Label>
            <Input id="length_cm" type="number" step="0.1" className={inputCls} {...register("length_cm")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="width_cm" className={labelCls}>W (cm)</Label>
            <Input id="width_cm" type="number" step="0.1" className={inputCls} {...register("width_cm")} />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" className="accent-amber-500" {...register("is_active")} /> Active
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" className="accent-amber-500" {...register("is_featured")} /> Featured
          </label>
        </div>

        <Button type="submit" disabled={isSubmitting} className="rounded-xl">
          {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </Button>
      </form>

      {isEdit && product && (
        <div className="mt-6 space-y-8">
          <div className={card}>
            <ProductImageManager productId={product.id} images={product.images} />
          </div>
          <div className={card}>
            <VariantManager productId={product.id} variants={product.variants} />
          </div>
        </div>
      )}
    </div>
  );
}
