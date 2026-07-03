import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { adminAddVariant, adminUpdateStock, adminUpdateVariant } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductVariant } from "@/types/product";

interface Props {
  productId: string;
  variants: ProductVariant[];
}

const empty = { size: "", color: "", color_hex: "", price_delta: 0, stock_quantity: 0 };

export function VariantManager({ productId, variants }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "product", productId] });

  const add = async () => {
    setSaving(true);
    try {
      await adminAddVariant(productId, {
        size: form.size || undefined,
        color: form.color || undefined,
        color_hex: form.color_hex || undefined,
        price_delta: Number(form.price_delta) || 0,
        stock_quantity: Number(form.stock_quantity) || 0,
      });
      toast.success("Variant added");
      setForm({ ...empty });
      refresh();
    } catch (e) {
      toast.error("Failed to add variant");
    } finally {
      setSaving(false);
    }
  };

  const saveStock = async (id: string, value: string) => {
    await adminUpdateStock(id, Number(value) || 0);
    toast.success("Stock updated");
    refresh();
  };

  const toggleActive = async (v: ProductVariant) => {
    await adminUpdateVariant(v.id, { is_active: !v.is_active });
    refresh();
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Variants</h3>

      {variants.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2">SKU</th>
                <th className="p-2">Size</th>
                <th className="p-2">Color</th>
                <th className="p-2">Δ Price</th>
                <th className="p-2">Stock</th>
                <th className="p-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="p-2 font-mono text-xs">{v.sku}</td>
                  <td className="p-2">{v.size ?? "—"}</td>
                  <td className="p-2">{v.color ?? "—"}</td>
                  <td className="p-2">{v.price_delta}</td>
                  <td className="p-2">
                    <Input
                      type="number"
                      defaultValue={v.stock_quantity}
                      className="h-8 w-20"
                      onBlur={(e) => saveStock(v.id, e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <button type="button" onClick={() => toggleActive(v)}>
                      <Badge variant={v.is_active ? "success" : "secondary"}>
                        {v.is_active ? "Yes" : "No"}
                      </Badge>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2 rounded-md border p-3">
        <Field label="Size">
          <Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="h-8 w-24" />
        </Field>
        <Field label="Color">
          <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-8 w-24" />
        </Field>
        <Field label="Hex">
          <Input value={form.color_hex} onChange={(e) => setForm({ ...form, color_hex: e.target.value })} placeholder="#000" className="h-8 w-24" />
        </Field>
        <Field label="Δ Price">
          <Input type="number" value={form.price_delta} onChange={(e) => setForm({ ...form, price_delta: Number(e.target.value) })} className="h-8 w-24" />
        </Field>
        <Field label="Stock">
          <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })} className="h-8 w-24" />
        </Field>
        <Button type="button" size="sm" disabled={saving} onClick={add}>
          Add variant
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
