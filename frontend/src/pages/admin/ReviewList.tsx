import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { adminApproveReview, adminDeleteReview, adminListReviews } from "@/api/reviews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/StarRating";

type Filter = "pending" | "approved" | "all";

export default function AdminReviewList() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("pending");
  const approved = filter === "all" ? undefined : filter === "approved";

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reviews", filter],
    queryFn: () => adminListReviews(approved),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
  const approve = useMutation({
    mutationFn: adminApproveReview,
    onSuccess: () => {
      toast.success("Review approved");
      invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: adminDeleteReview,
    onSuccess: () => {
      toast.success("Review deleted");
      invalidate();
    },
  });

  return (
    <div className="px-6 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Star className="h-6 w-6 text-primary" /> Reviews
      </h1>

      <div className="mb-4 flex gap-1 rounded-xl border border-border p-1 w-fit">
        {(["pending", "approved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === f ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="shimmer h-24 rounded-xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white py-16 text-center text-muted-foreground dark:bg-gray-900">
          No reviews here.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-white p-5 shadow-card dark:bg-gray-900">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StarRating value={r.rating} size={14} />
                    <Badge variant={r.is_approved ? "success" : "secondary"}>
                      {r.is_approved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                  {r.title && <div className="mt-2 font-semibold">{r.title}</div>}
                  {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
                  <div className="mt-2 text-xs text-muted-foreground">
                    {r.reviewer_name} · {new Date(r.created_at).toLocaleDateString("en-IN")}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!r.is_approved && (
                    <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate(r.id)}>
                      Approve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(r.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
