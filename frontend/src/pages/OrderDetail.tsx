import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight, MapPin, Truck } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { cancelOrder, getOrder, requestReturn } from "@/api/orders";
import { TrackingTimeline } from "@/components/order/TrackingTimeline";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { statusBadgeVariant } from "@/lib/status";
import { formatPrice } from "@/lib/format";
import { imageUrlById } from "@/lib/image";

const CANCELLABLE = new Set(["pending", "paid", "processing"]);

export default function OrderDetail() {
  const { orderNumber = "" } = useParams();
  const [params] = useSearchParams();
  const justPaid = params.get("paid") === "1";
  const justPlaced = params.get("placed") === "1";
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => getOrder(orderNumber),
  });

  const cancel = useMutation({
    mutationFn: () => cancelOrder(order!.id),
    onSuccess: (o) => {
      qc.setQueryData(["order", orderNumber], o);
      toast.success("Order cancelled");
    },
    onError: () => toast.error("Could not cancel order"),
  });

  const ret = useMutation({
    mutationFn: () => requestReturn(order!.id),
    onSuccess: (o) => {
      qc.setQueryData(["order", orderNumber], o);
      toast.success("Return requested");
    },
    onError: (e) =>
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Could not request return"),
  });

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="shimmer h-96 w-full rounded-2xl" />
      </div>
    );
  }
  if (!order) {
    return <div className="container py-24 text-center text-muted-foreground">Order not found.</div>;
  }

  const addr = order.shipping_address;

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container max-w-5xl space-y-6 py-8">
        {(justPaid || justPlaced) && (
          <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-5 shadow-card animate-scale-in dark:border-green-900 dark:bg-green-950/40">
            <CheckCircle2 className="h-8 w-8 shrink-0 text-green-600" />
            <div>
              <div className="font-bold text-green-800 dark:text-green-300">
                {justPaid ? "Payment successful! 🎉" : "Order placed! 🎉"}
              </div>
              <div className="text-sm text-green-700 dark:text-green-400">
                Your order {order.order_number} is confirmed
                {justPlaced ? " — pay cash on delivery." : " and being processed."}
              </div>
            </div>
          </div>
        )}

        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/orders" className="hover:text-primary">Orders</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{order.order_number}</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{order.order_number}</h1>
            <p className="text-sm text-muted-foreground">
              Placed on{" "}
              {new Date(order.placed_at).toLocaleString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <Badge variant={statusBadgeVariant(order.status)} className="px-3 py-1 text-sm capitalize">
            {order.status.replace(/_/g, " ")}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-white p-5 shadow-card dark:bg-gray-900">
              <h2 className="mb-4 font-bold">Items in this order</h2>
              <div className="space-y-4">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <img src={imageUrlById(it.image_id, 120)} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{it.product_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {[it.size, it.color].filter(Boolean).join(" · ")} · Qty {it.quantity}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{formatPrice(it.line_total)}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-white p-5 shadow-card dark:bg-gray-900">
              <h2 className="mb-5 flex items-center gap-2 font-bold">
                <Truck className="h-5 w-5 text-primary" /> Order tracking
              </h2>
              <TrackingTimeline status={order.status} history={order.status_history} />
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm", className: "mt-5" })}
                >
                  Track on courier site
                </a>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-border bg-white p-5 text-sm shadow-card dark:bg-gray-900">
              <h2 className="mb-3 flex items-center gap-2 font-bold">
                <MapPin className="h-4 w-4 text-primary" /> Delivery address
              </h2>
              <p className="font-medium">{addr.full_name}</p>
              <p className="mt-1 text-muted-foreground">
                {addr.line1}
                {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} - {addr.pincode}
              </p>
              <p className="mt-1 text-muted-foreground">{addr.phone}</p>
            </section>

            <section className="rounded-2xl border border-border bg-white p-5 text-sm shadow-card dark:bg-gray-900">
              <h2 className="mb-3 font-bold">Payment summary</h2>
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              <Row label="Shipping" value={order.shipping_fee > 0 ? formatPrice(order.shipping_fee) : "Free"} />
              {order.discount_amount > 0 && (
                <Row label="Discount" value={`- ${formatPrice(order.discount_amount)}`} />
              )}
              <Row label="Tax" value={formatPrice(order.tax_amount)} />
              <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
              <p className="mt-3 text-xs capitalize text-muted-foreground">
                Payment status: <span className="font-medium text-foreground">{order.payment_status}</span>
              </p>
            </section>

            {CANCELLABLE.has(order.status) && (
              <Button
                variant="outline"
                className="w-full border-destructive/40 text-destructive hover:bg-destructive/5"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                {cancel.isPending ? "Cancelling…" : "Cancel order"}
              </Button>
            )}
            {order.status === "delivered" && (
              <Button
                variant="outline"
                className="w-full"
                disabled={ret.isPending}
                onClick={() => ret.mutate()}
              >
                {ret.isPending ? "Requesting…" : "Request return"}
              </Button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
