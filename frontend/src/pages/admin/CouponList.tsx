import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { adminCreateCoupon, adminDeleteCoupon, adminListCoupons, type CouponPayload } from "@/api/coupons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { BrandLoader } from "@/components/ui/BrandLoader";

const empty: CouponPayload = {
  code: "",
  discount_type: "percent",
  discount_value: 10,
  min_order_value: 0,
};

export default function AdminCouponList() {
  const qc = useQueryClient();
  const [form, setForm] = useState<CouponPayload>({ ...empty });
  const { data, isLoading } = useQuery({ queryKey: ["admin", "coupons"], queryFn: adminListCoupons });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
  const create = useMutation({
    mutationFn: () => adminCreateCoupon(form),
    onSuccess: () => {
      toast.success("Coupon created");
      setForm({ ...empty });
      invalidate();
    },
    onError: (e) =>
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to create"),
  });
  const remove = useMutation({
    mutationFn: adminDeleteCoupon,
    onSuccess: () => {
      toast.success("Coupon deleted");
      invalidate();
    },
  });

  const inputClass = "rounded-xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500";

  return (
    <div className="animate-fade-in-up px-6 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
        <Tag className="h-6 w-6 text-amber-400" /> Coupons
      </h1>

      <div className="admin-glass mb-6 rounded-2xl p-6">
        <h2 className="mb-4 font-bold text-white">Create coupon</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="CODE"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className={`${inputClass} uppercase`}
          />
          <select
            value={form.discount_type}
            onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percent" | "flat" })}
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200"
          >
            <option value="percent" className="bg-slate-900">Percent %</option>
            <option value="flat" className="bg-slate-900">Flat ₹</option>
          </select>
          <Input
            type="number"
            placeholder="Value"
            value={form.discount_value}
            onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
            className={inputClass}
          />
          <Input
            type="number"
            placeholder="Min order ₹"
            value={form.min_order_value}
            onChange={(e) => setForm({ ...form, min_order_value: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
        <Button
          className="mt-4 rounded-xl"
          disabled={!form.code || form.discount_value <= 0 || create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending ? "Creating…" : "Create coupon"}
        </Button>
      </div>

      {isLoading ? (
        <div className="admin-glass flex min-h-[30vh] items-center justify-center rounded-2xl p-8">
          <BrandLoader />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="admin-glass rounded-2xl py-12 text-center text-slate-400">No coupons yet.</div>
      ) : (
        <div className="admin-glass overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4 font-semibold">Code</th>
                <th className="p-4 font-semibold">Discount</th>
                <th className="p-4 font-semibold">Min order</th>
                <th className="p-4 font-semibold">Used</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className="border-t border-white/5 transition-colors hover:bg-white/5">
                  <td className="p-4 font-mono font-medium text-amber-300">{c.code}</td>
                  <td className="p-4 text-slate-200">
                    {c.discount_type === "percent" ? `${c.discount_value}%` : formatPrice(c.discount_value)}
                  </td>
                  <td className="p-4 text-slate-300">{formatPrice(c.min_order_value)}</td>
                  <td className="p-4 text-slate-300">
                    {c.times_used}
                    {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                  </td>
                  <td className="p-4">
                    <Badge variant={c.is_active ? "success" : "secondary"}>
                      {c.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
