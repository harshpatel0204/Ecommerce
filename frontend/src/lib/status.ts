type BadgeVariant = "default" | "secondary" | "destructive" | "success" | "outline";

/** Map an order status to a badge colour variant. */
export function statusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "delivered":
      return "success";
    case "cancelled":
      return "destructive";
    case "pending":
      return "outline";
    case "returned":
    case "return_requested":
    case "refunded":
      return "secondary";
    default:
      // paid, processing, packed, shipped, out_for_delivery
      return "default";
  }
}
