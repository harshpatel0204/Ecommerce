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
      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
        Current status:{" "}
        <span className="font-semibold capitalize">{status.replace(/_/g, " ")}</span>
      </div>
    );
  }

  const currentIdx = Math.max(ORDER.indexOf(status), 0);
  const timeOf = (key: string) => history.find((h) => h.status === key)?.changed_at;

  return (
    <ol className="relative space-y-6">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const at = timeOf(step.key);
        const notLast = i < STEPS.length - 1;
        return (
          <li key={step.key} className="relative flex gap-4">
            {notLast && (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%+0.5rem)] w-0.5",
                  i < currentIdx ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground",
                isCurrent && "shadow-glow",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
            </span>
            <div className="pt-1">
              <div className={cn("text-sm", done ? "font-semibold" : "text-muted-foreground")}>
                {step.label}
              </div>
              {at && (
                <div className="text-xs text-muted-foreground">{new Date(at).toLocaleString()}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
