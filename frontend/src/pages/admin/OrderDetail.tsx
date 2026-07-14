import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Truck } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import {
  adminDownloadInvoice,
  adminGetLabel,
  adminGetOrder,
  adminProcessReturn,
  adminShipOrder,
  adminUpdateOrderStatus,
} from "@/api/adminOps";
import { TrackingTimeline } from "@/components/order/TrackingTimeline";
import { Badge } from "@/components/ui/badge";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { Button } from "@/components/ui/button";
import { statusBadgeVariant } from "@/lib/status";
import { formatPrice } from "@/lib/format";
import { imageUrlById } from "@/lib/image";

const MANUAL_STATUSES = ["processing", "packed", "shipped", "out_for_delivery", "delivered"];
const SHIPPABLE = new Set(["paid", "processing", "packed"]);

const card = "admin-glass rounded-2xl p-5";

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

  const processReturn = useMutation({
    mutationFn: (approve: boolean) => adminProcessReturn(orderId, approve),
    onSuccess: () => {
      toast.success("Return processed");
      invalidate();
    },
    onError: () => toast.error("Could not process return"),
  });

  const invoice = useMutation({
    mutationFn: () => adminDownloadInvoice(orderId, order?.order_number ?? "order"),
    onError: () => toast.error("Could not generate invoice"),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6 py-8">
        <BrandLoader />
      </div>
    );
  }
  if (!order) return <div className="px-6 py-16 text-center text-slate-400">Order not found.</div>;

  const addr = order.shipping_address;

  return (
    <div className="animate-fade-in-up px-6 py-8">
      <Link to="/admin/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-amber-300">
        <ArrowLeft className="h-4 w-4" /> Orders
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">{order.order_number}</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
            disabled={invoice.isPending}
            onClick={() => invoice.mutate()}
          >
            <FileText className="h-4 w-4" />
            {invoice.isPending ? "Generating…" : "Invoice"}
          </Button>
          <Badge variant={statusBadgeVariant(order.status)} className="px-3 py-1 text-sm capitalize">
            {order.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className={card}>
            <h2 className="mb-4 font-bold text-white">Items</h2>
            <div className="space-y-3">
              {order.items.map((it, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img src={imageUrlById(it.image_id, 80)} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-100">{it.product_name}</div>
                    <div className="text-xs text-slate-500">
                      {[it.size, it.color].filter(Boolean).join(" · ")} · Qty {it.quantity}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-100">{formatPrice(it.line_total)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className={card}>
            <h2 className="mb-4 font-bold text-white">Tracking</h2>
            <TrackingTimeline status={order.status} history={order.status_history} />
          </section>
        </div>

        <aside className="space-y-6">
          {/* Fulfilment actions */}
          <section className={card}>
            <h2 className="mb-3 flex items-center gap-2 font-bold text-white">
              <Truck className="h-5 w-5 text-amber-400" /> Fulfilment
            </h2>
            {order.awb_number ? (
              <div className="space-y-1 text-sm text-slate-300">
                <p>AWB: <span className="font-medium text-slate-100">{order.awb_number}</span></p>
                <p>Courier: <span className="font-medium text-slate-100">{order.courier_name}</span></p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
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
              <p className="text-sm text-slate-400">Not ready to ship.</p>
            )}

            <div className="mt-4 border-t border-white/10 pt-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Set status</label>
              <div className="flex gap-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="h-9 flex-1 rounded-lg border border-white/10 bg-white/5 px-2 text-sm capitalize text-slate-200"
                >
                  <option value="" className="bg-slate-900">Choose…</option>
                  {MANUAL_STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-slate-900">
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

          {order.status === "return_requested" && (
            <section className="admin-glass rounded-2xl border-amber-500/40 p-5">
              <h2 className="mb-2 font-bold text-amber-300">Return requested</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={processReturn.isPending}
                  onClick={() => processReturn.mutate(true)}
                >
                  Approve &amp; refund
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
                  disabled={processReturn.isPending}
                  onClick={() => processReturn.mutate(false)}
                >
                  Reject
                </Button>
              </div>
            </section>
          )}

          <section className={`${card} text-sm`}>
            <h2 className="mb-2 font-bold text-white">Customer</h2>
            <p className="font-medium text-slate-100">{addr.full_name}</p>
            <p className="mt-1 text-slate-400">
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} - {addr.pincode}
            </p>
            <p className="text-slate-400">{addr.phone}</p>
          </section>

          <section className={`${card} text-sm`}>
            <h2 className="mb-2 font-bold text-white">Payment</h2>
            <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="text-slate-200">{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Shipping</span><span className="text-slate-200">{formatPrice(order.shipping_fee)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Tax</span><span className="text-slate-200">{formatPrice(order.tax_amount)}</span></div>
            <div className="mt-2 flex justify-between border-t border-white/10 pt-2 font-bold text-white">
              <span>Total</span><span>{formatPrice(order.total_amount)}</span>
            </div>
            <p className="mt-2 text-xs capitalize text-slate-500">Payment: {order.payment_status}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
