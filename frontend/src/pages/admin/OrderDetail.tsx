import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Truck } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import { adminGetLabel, adminGetOrder, adminShipOrder, adminUpdateOrderStatus } from "@/api/adminOps";
import { TrackingTimeline } from "@/components/order/TrackingTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { statusBadgeVariant } from "@/lib/status";
import { formatPrice } from "@/lib/format";
import { imageUrlById } from "@/lib/image";

const MANUAL_STATUSES = ["processing", "packed", "shipped", "out_for_delivery", "delivered"];
const SHIPPABLE = new Set(["paid", "processing", "packed"]);

export default function AdminOrderDetail() {
  const { orderId = "" } = useParams();
  const qc = useQueryClient();
  const [newStatus, setNewStatus] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin", "order", orderId],
    queryFn: () => adminGetOrder(orderId),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "order", orderId] });

  const ship = useMutation({
    mutationFn: () => adminShipOrder(orderId),
    onSuccess: () => {
      toast.success("Order shipped — AWB assigned");
      invalidate();
    },
    onError: (e) =>
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Ship failed"),
  });

  const updateStatus = useMutation({
    mutationFn: () => adminUpdateOrderStatus(orderId, newStatus),
    onSuccess: () => {
      toast.success("Status updated");
      setNewStatus("");
      invalidate();
    },
    onError: () => toast.error("Update failed"),
  });

  const label = useMutation({
    mutationFn: () => adminGetLabel(orderId),
    onSuccess: (d) => {
      if (d.label_url) window.open(d.label_url, "_blank");
      else toast.error("Label not available yet");
    },
    onError: () => toast.error("Could not fetch label"),
  });

  if (isLoading) return <div className="px-6 py-8"><Skeleton className="shimmer h-96 rounded-2xl" /></div>;
  if (!order) return <div className="px-6 py-16 text-center text-muted-foreground">Order not found.</div>;

  const addr = order.shipping_address;
  const card = "rounded-2xl border border-border bg-white p-5 shadow-card dark:bg-gray-900";

  return (
    <div className="px-6 py-8">
      <Link to="/admin/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Orders
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{order.order_number}</h1>
        <Badge variant={statusBadgeVariant(order.status)} className="px-3 py-1 text-sm capitalize">
          {order.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className={card}>
            <h2 className="mb-4 font-bold">Items</h2>
            <div className="space-y-3">
              {order.items.map((it, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img src={imageUrlById(it.image_id, 80)} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{it.product_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {[it.size, it.color].filter(Boolean).join(" · ")} · Qty {it.quantity}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{formatPrice(it.line_total)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className={card}>
            <h2 className="mb-4 font-bold">Tracking</h2>
            <TrackingTimeline status={order.status} history={order.status_history} />
          </section>
        </div>

        <aside className="space-y-6">
          {/* Fulfilment actions */}
          <section className={card}>
            <h2 className="mb-3 flex items-center gap-2 font-bold">
              <Truck className="h-5 w-5 text-primary" /> Fulfilment
            </h2>
            {order.awb_number ? (
              <div className="space-y-1 text-sm">
                <p>AWB: <span className="font-medium">{order.awb_number}</span></p>
                <p>Courier: <span className="font-medium">{order.courier_name}</span></p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  disabled={label.isPending}
                  onClick={() => label.mutate()}
                >
                  Download label
                </Button>
              </div>
            ) : SHIPPABLE.has(order.status) ? (
              <Button className="w-full" disabled={ship.isPending} onClick={() => ship.mutate()}>
                {ship.isPending ? "Shipping…" : "Ship order"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Not ready to ship.</p>
            )}

            <div className="mt-4 border-t border-border pt-4">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Set status</label>
              <div className="flex gap-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="h-9 flex-1 rounded-lg border border-input bg-background px-2 text-sm capitalize"
                >
                  <option value="">Choose…</option>
                  {MANUAL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <Button size="sm" disabled={!newStatus || updateStatus.isPending} onClick={() => updateStatus.mutate()}>
                  Set
                </Button>
              </div>
            </div>
          </section>

          <section className={`${card} text-sm`}>
            <h2 className="mb-2 font-bold">Customer</h2>
            <p className="font-medium">{addr.full_name}</p>
            <p className="mt-1 text-muted-foreground">
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} - {addr.pincode}
            </p>
            <p className="text-muted-foreground">{addr.phone}</p>
          </section>

          <section className={`${card} text-sm`}>
            <h2 className="mb-2 font-bold">Payment</h2>
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatPrice(order.shipping_fee)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatPrice(order.tax_amount)}</span></div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold">
              <span>Total</span><span>{formatPrice(order.total_amount)}</span>
            </div>
            <p className="mt-2 text-xs capitalize text-muted-foreground">Payment: {order.payment_status}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
