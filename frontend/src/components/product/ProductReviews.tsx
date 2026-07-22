import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { createReview, getProductReviews } from "@/api/reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/StarRating";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";

export function ProductReviews({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => getProductReviews(productId),
  });

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const submit = useMutation({
    mutationFn: () =>
      createReview({ product_id: productId, rating, title: title || undefined, comment: comment || undefined }),
    onSuccess: () => {
      toast.success("Thanks! Your review is pending approval.");
      setRating(0);
      setTitle("");
      setComment("");
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
    },
    onError: (e) =>
      toast.error(
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          "Could not submit review",
      ),
  });

  return (
    <div className="mt-12 border-t border-border pt-10">
      <h2 className="mb-6 text-xl font-bold">Ratings &amp; Reviews</h2>

      {isLoading ? (
        <Skeleton className="shimmer h-32 w-full rounded-2xl" />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Summary */}
          <div className="rounded-lg border border-border bg-card p-6 text-center shadow-card">
            <div className="text-4xl font-bold">{data?.avg_rating.toFixed(1) ?? "0.0"}</div>
            <StarRating value={data?.avg_rating ?? 0} className="mt-2 justify-center" />
            <div className="mt-1 text-sm text-muted-foreground">{data?.review_count ?? 0} reviews</div>
            <div className="mt-4 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = data?.rating_distribution?.[String(star)] ?? 0;
                const pct = data && data.review_count > 0 ? (count / data.review_count) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3">{star}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* List + form */}
          <div className="space-y-6">
            {isAuthenticated && (
              <div className="rounded-lg border border-border bg-card p-5 shadow-card">
                <h3 className="mb-3 font-semibold">Write a review</h3>
                <StarRating value={rating} onChange={setRating} size={24} />
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title (optional)"
                  className="mt-3 rounded-xl"
                />
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience…"
                  className="mt-3 rounded-xl"
                  rows={3}
                />
                <Button
                  className="mt-3 rounded-xl"
                  disabled={rating === 0 || submit.isPending}
                  onClick={() => submit.mutate()}
                >
                  {submit.isPending ? "Submitting…" : "Submit review"}
                </Button>
              </div>
            )}

            {data && data.reviews.length > 0 ? (
              <div className="space-y-4">
                {data.reviews.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border bg-card p-5 shadow-card">
                    <div className="flex items-center justify-between">
                      <StarRating value={r.rating} size={16} />
                      {r.is_verified && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Verified purchase
                        </span>
                      )}
                    </div>
                    {r.title && <div className="mt-2 font-semibold">{r.title}</div>}
                    {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
                    <div className="mt-2 text-xs text-muted-foreground">
                      {r.reviewer_name} · {new Date(r.created_at).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
