import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { createAddress, getAddresses, type AddressPayload } from "@/api/addresses";
import { checkout, verifyPayment } from "@/api/orders";
import { checkServiceability } from "@/api/shipping";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/format";
import { imageUrlById } from "@/lib/image";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { useAuthStore } from "@/store/authStore";
import type { Address } from "@/types/order";

export default function Checkout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses, isLoading: addrLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: getAddresses,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [serviceable, setServiceable] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (addresses && !selectedId) {
      setSelectedId((addresses.find((a) => a.is_default) ?? addresses[0])?.id ?? null);
    }
    if (addresses && addresses.length === 0) setShowForm(true);
  }, [addresses, selectedId]);

  const selected = addresses?.find((a) => a.id === selectedId) ?? null;

  useEffect(() => {
    setServiceable(null);
    if (!selected) return;
    let active = true;
    checkServiceability(selected.pincode)
      .then((r) => {
        if (!active) return;
        setServiceable(
          r.serviceable && r.cheapest
            ? `Delivers via ${r.cheapest.courier_name} (~${r.cheapest.eta_days} days)`
            : "not-serviceable",
        );
      })
      .catch(() => active && setServiceable("unknown"));
    return () => {
      active = false;
    };
  }, [selected]);

  const placeOrder = async () => {
    if (!selectedId) return toast.error("Select a delivery address");
    if (serviceable === "not-serviceable") return toast.error("Delivery not available to this pincode");
    setPlacing(true);
    try {
      const co = await checkout(selectedId);
      const pay = await openRazorpayCheckout(co, {
        name: user?.full_name ?? undefined,
        email: user?.email,
      });
      await verifyPayment({
        order_id: co.order_id,
        razorpay_order_id: pay.razorpay_order_id,
        razorpay_payment_id: pay.razorpay_payment_id,
        razorpay_signature: pay.razorpay_signature,
      });
      qc.invalidateQueries({ queryKey: ["cart"] });
      navigate(`/orders/${co.order_number}?paid=1`, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPlacing(false);
    }
  };

  if (cartLoading || addrLoading) {
    return <div className="container py-8"><Skeleton className="h-64 w-full" /></div>;
  }
  if (!cart || cart.items.length === 0) {
    return <div className="container py-20 text-center text-muted-foreground">Your cart is empty.</div>;
  }

  return (
    <div className="container grid gap-8 py-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Delivery address</h2>
          <div className="space-y-2">
            {addresses?.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={cn(
                  "block w-full rounded-lg border p-3 text-left text-sm",
                  a.id === selectedId ? "border-primary bg-primary/5" : "border-input",
                )}
              >
                <span className="font-medium">{a.full_name}</span> · {a.phone}
                <div className="text-muted-foreground">
                  {a.line1}, {a.city}, {a.state} - {a.pincode}
                </div>
              </button>
            ))}
          </div>

          {showForm ? (
            <AddressForm
              onCreated={(a) => {
                qc.invalidateQueries({ queryKey: ["addresses"] });
                setSelectedId(a.id);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowForm(true)}>
              + Add new address
            </Button>
          )}

          {selected && serviceable && (
            <p
              className={cn(
                "mt-3 text-sm",
                serviceable === "not-serviceable" ? "text-destructive" : "text-green-600",
              )}
            >
              {serviceable === "not-serviceable"
                ? "✗ Delivery not available to this pincode"
                : serviceable === "unknown"
                  ? ""
                  : `✓ ${serviceable}`}
            </p>
          )}
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-lg border p-5">
        <h2 className="font-semibold">Order summary</h2>
        <div className="space-y-2">
          {cart.items.map((i) => (
            <div key={i.id} className="flex items-center gap-2 text-sm">
              <img src={imageUrlById(i.product.image_id, 60)} alt="" className="h-10 w-10 rounded object-cover" />
              <span className="flex-1 truncate">
                {i.product.name} × {i.quantity}
              </span>
              <span>{formatPrice(i.line_total)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between border-t pt-3 text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(cart.subtotal)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Final shipping & tax are computed securely on the server at payment.
        </p>
        <Button className="w-full" disabled={placing || !selectedId} onClick={placeOrder}>
          {placing ? "Processing…" : "Place order & pay"}
        </Button>
      </aside>
    </div>
  );
}

const emptyAddr: AddressPayload = {
  label: "Home",
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

function AddressForm({
  onCreated,
  onCancel,
}: {
  onCreated: (a: Address) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<AddressPayload>({
    defaultValues: emptyAddr,
  });

  const submit = async (values: AddressPayload) => {
    try {
      const a = await createAddress(values);
      toast.success("Address saved");
      onCreated(a);
    } catch {
      toast.error("Could not save address");
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="mt-3 grid grid-cols-2 gap-2 rounded-lg border p-3">
      <Input placeholder="Full name" {...register("full_name", { required: true })} />
      <Input placeholder="Phone" {...register("phone", { required: true })} />
      <Input className="col-span-2" placeholder="Address line 1" {...register("line1", { required: true })} />
      <Input className="col-span-2" placeholder="Address line 2 (optional)" {...register("line2")} />
      <Input placeholder="City" {...register("city", { required: true })} />
      <Input placeholder="State" {...register("state", { required: true })} />
      <Input placeholder="Pincode" {...register("pincode", { required: true })} />
      <div className="col-span-2 flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
