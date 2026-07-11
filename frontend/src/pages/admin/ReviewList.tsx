import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { adminApproveReview, adminDeleteReview, adminListReviews } from "@/api/reviews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/StarRating";
import { BrandLoader } from "@/components/ui/BrandLoader";

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
    <div className="animate-fade-in-up px-6 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
        <Star className="h-6 w-6 text-amber-400" /> Reviews
      </h1>

      <div className="mb-4 flex w-fit gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {(["pending", "approved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === f ? "bg-amber-500 text-white shadow-glow" : "text-slate-400 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="admin-glass flex min-h-[30vh] items-center justify-center rounded-2xl p-8">
          <BrandLoader />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="admin-glass rounded-2xl py-16 text-center text-slate-400">No reviews here.</div>
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <div key={r.id} className="admin-glass rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StarRating value={r.rating} size={14} />
                    <Badge variant={r.is_approved ? "success" : "secondary"}>
                      {r.is_approved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                  {r.title && <div className="mt-2 font-semibold text-slate-100">{r.title}</div>}
                  {r.comment && <p className="mt-1 text-sm text-slate-400">{r.comment}</p>}
                  <div className="mt-2 text-xs text-slate-500">
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
                    className="border-white/15 bg-white/5 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
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
