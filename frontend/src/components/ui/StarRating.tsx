import { Star } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  className?: string;
}

/** Star rating — interactive when onChange is provided, display-only otherwise. */
export function StarRating({ value, onChange, size = 18, className }: Props) {
  const [hover, setHover] = useState(0);
  const interactive = !!onChange;
  const shown = hover || value;

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => onChange?.(star)}
          className={cn(interactive && "cursor-pointer transition-transform hover:scale-110")}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              star <= Math.round(shown)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700",
            )}
          />
        </button>
      ))}
    </div>
  );
}
