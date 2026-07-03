import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StatusHistoryEntry } from "@/types/order";

const STEPS: { key: string; label: string }[] = [
  { key: "pending", label: "Ordered" },
  { key: "paid", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

const ORDER = STEPS.map((s) => s.key);

export function TrackingTimeline({
  status,
  history,
}: {
  status: string;
  history: StatusHistoryEntry[];
}) {
  // Cancelled/returned orders don't follow the linear delivery flow.
  if (["cancelled", "returned", "refunded", "return_requested"].includes(status)) {
    return (
      <div className="rounded-md border bg-muted/40 p-4 text-sm capitalize">
        Status: <span className="font-medium">{status.replace(/_/g, " ")}</span>
      </div>
    );
  }

  const currentIdx = Math.max(ORDER.indexOf(status), 0);
  const timeOf = (key: string) =>
    history.find((h) => h.status === key)?.changed_at;

  return (
    <ol className="relative space-y-4 border-l pl-6">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const at = timeOf(step.key);
        return (
          <li key={step.key} className="relative">
            <span
              className={cn(
                "absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border",
                done ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background",
              )}
            >
              {done && <Check className="h-3 w-3" />}
            </span>
            <div className={cn("text-sm", done ? "font-medium" : "text-muted-foreground")}>
              {step.label}
            </div>
            {at && (
              <div className="text-xs text-muted-foreground">
                {new Date(at).toLocaleString()}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
