import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Lock, MapPin, Plus, ShieldCheck, Truck } from "lucide-react";
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
    if (serviceable === "not-serviceable")
      return toast.error("Delivery not available to this pincode");
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
    return (
      <div className="container py-8">
        <Skeleton className="shimmer h-96 w-full rounded-2xl" />
      </div>
    );
  }
  if (!cart || cart.items.length === 0) {
    return <div className="container py-24 text-center text-muted-foreground">Your cart is empty.</div>;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b border-border bg-white dark:bg-gray-950">
        <div className="container flex items-center gap-2 py-5">
          <Lock className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Secure Checkout</h1>
        </div>
      </div>

      <div className="container grid gap-8 py-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-white p-6 shadow-card dark:bg-gray-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <MapPin className="h-5 w-5 text-primary" /> Delivery address
            </h2>
            <div className="space-y-3">
              {addresses?.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-all",
                    a.id === selectedId
                      ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary))]"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                      a.id === selectedId ? "border-primary bg-primary text-white" : "border-muted-foreground/40",
                    )}
                  >
                    {a.id === selectedId && <Check className="h-3 w-3" />}
                  </span>
                  <span className="flex-1">
                    <span className="font-semibold">{a.full_name}</span>
                    {a.label && (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {a.label}
                      </span>
                    )}
                    <span className="mt-0.5 block text-muted-foreground">
                      {a.line1}, {a.city}, {a.state} - {a.pincode}
                    </span>
                    <span className="block text-muted-foreground">{a.phone}</span>
                  </span>
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
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Plus className="h-4 w-4" /> Add a new address
              </button>
            )}

            {selected && serviceable && serviceable !== "unknown" && (
              <div
                className={cn(
                  "mt-4 flex items-center gap-2 rounded-xl p-3 text-sm font-medium",
                  serviceable === "not-serviceable"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400",
                )}
              >
                <Truck className="h-4 w-4" />
                {serviceable === "not-serviceable"
                  ? "Delivery is not available to this pincode"
                  : serviceable}
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit">
          <div className="sticky top-24 space-y-5 rounded-2xl border border-border bg-white p-6 shadow-card dark:bg-gray-900">
            <h2 className="text-lg font-bold">Order summary</h2>
            <div className="max-h-64 space-y-3 overflow-y-auto">
              {cart.items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 text-sm">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img src={imageUrlById(i.product.image_id, 80)} alt="" className="h-full w-full object-cover" />
                  </div>
                  <span className="min-w-0 flex-1 truncate">
                    {i.product.name} <span className="text-muted-foreground">× {i.quantity}</span>
                  </span>
                  <span className="font-medium">{formatPrice(i.line_total)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-border pt-4 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatPrice(cart.subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Shipping &amp; tax are calculated securely on the server at payment.
            </p>
            <Button
              className="h-12 w-full rounded-xl text-base font-semibold shadow-sm transition-all hover:shadow-glow"
              disabled={placing || !selectedId}
              onClick={placeOrder}
            >
              {placing ? "Processing…" : "Place order & pay"}
            </Button>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              Secured by Razorpay · 100% safe payments
            </div>
          </div>
        </aside>
      </div>
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
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AddressPayload>({ defaultValues: emptyAddr });

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
    <form
      onSubmit={handleSubmit(submit)}
      className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-4"
    >
      <Input placeholder="Full name" className="rounded-lg" {...register("full_name", { required: true })} />
      <Input placeholder="Phone" className="rounded-lg" {...register("phone", { required: true })} />
      <Input className="col-span-2 rounded-lg" placeholder="Address line 1" {...register("line1", { required: true })} />
      <Input className="col-span-2 rounded-lg" placeholder="Address line 2 (optional)" {...register("line2")} />
      <Input placeholder="City" className="rounded-lg" {...register("city", { required: true })} />
      <Input placeholder="State" className="rounded-lg" {...register("state", { required: true })} />
      <Input placeholder="Pincode" className="rounded-lg" {...register("pincode", { required: true })} />
      <div className="col-span-2 flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          Save address
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
