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

  const card = "rounded-2xl border border-border bg-white p-5 shadow-card dark:bg-gray-900";

  return (
    <div className="px-6 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Tag className="h-6 w-6 text-primary" /> Coupons
      </h1>

      <div className={`${card} mb-6`}>
        <h2 className="mb-4 font-bold">Create coupon</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="CODE"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="rounded-xl uppercase"
          />
          <select
            value={form.discount_type}
            onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percent" | "flat" })}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="percent">Percent %</option>
            <option value="flat">Flat ₹</option>
          </select>
          <Input
            type="number"
            placeholder="Value"
            value={form.discount_value}
            onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
            className="rounded-xl"
          />
          <Input
            type="number"
            placeholder="Min order ₹"
            value={form.min_order_value}
            onChange={(e) => setForm({ ...form, min_order_value: Number(e.target.value) })}
            className="rounded-xl"
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
        <div className="flex min-h-[30vh] items-center justify-center rounded-2xl border border-border bg-white p-8 dark:bg-gray-900 shadow-card">
          <BrandLoader />
        </div>
      ) : !data || data.length === 0 ? (
        <div className={`${card} py-12 text-center text-muted-foreground`}>No coupons yet.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
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
                <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-4 font-mono font-medium">{c.code}</td>
                  <td className="p-4">
                    {c.discount_type === "percent" ? `${c.discount_value}%` : formatPrice(c.discount_value)}
                  </td>
                  <td className="p-4">{formatPrice(c.min_order_value)}</td>
                  <td className="p-4">
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
                      className="text-muted-foreground hover:text-destructive"
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
