import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { cancelOrder, getOrder } from "@/api/orders";
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

  if (isLoading) return <div className="container py-8"><Skeleton className="h-96 w-full" /></div>;
  if (!order) return <div className="container py-20 text-center text-muted-foreground">Order not found.</div>;

  const addr = order.shipping_address;

  return (
    <div className="container max-w-4xl space-y-6 py-8">
      {justPaid && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="h-6 w-6" />
          <div>
            <div className="font-semibold">Payment successful!</div>
            <div className="text-sm">Your order {order.order_number} is confirmed.</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/orders" className="text-sm text-muted-foreground hover:underline">
            ← Orders
          </Link>
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            Placed {new Date(order.placed_at).toLocaleString()}
          </p>
        </div>
        <Badge variant={statusBadgeVariant(order.status)} className="capitalize">
          {order.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="space-y-6">
          <section className="rounded-lg border p-4">
            <h2 className="mb-3 font-semibold">Items</h2>
            <div className="space-y-3">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <img
                    src={imageUrlById(it.image_id, 80)}
                    alt=""
                    className="h-14 w-14 rounded object-cover"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{it.product_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {[it.size, it.color].filter(Boolean).join(" · ")} · Qty {it.quantity}
                    </div>
                  </div>
                  <div className="text-sm">{formatPrice(it.line_total)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="mb-4 font-semibold">Tracking</h2>
            <TrackingTimeline status={order.status} history={order.status_history} />
            {order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "outline", size: "sm", className: "mt-4" })}
              >
                Track on courier site
              </a>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border p-4 text-sm">
            <h2 className="mb-2 font-semibold">Delivery address</h2>
            <p>{addr.full_name}</p>
            <p className="text-muted-foreground">
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} - {addr.pincode}
            </p>
            <p className="text-muted-foreground">{addr.phone}</p>
          </section>

          <section className="rounded-lg border p-4 text-sm">
            <h2 className="mb-2 font-semibold">Payment</h2>
            <Row label="Subtotal" value={formatPrice(order.subtotal)} />
            <Row label="Shipping" value={formatPrice(order.shipping_fee)} />
            {order.discount_amount > 0 && (
              <Row label="Discount" value={`- ${formatPrice(order.discount_amount)}`} />
            )}
            <Row label="Tax" value={formatPrice(order.tax_amount)} />
            <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
            <p className="mt-2 text-xs capitalize text-muted-foreground">
              Payment: {order.payment_status}
            </p>
          </section>

          {CANCELLABLE.has(order.status) && (
            <Button
              variant="destructive"
              className="w-full"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              Cancel order
            </Button>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
