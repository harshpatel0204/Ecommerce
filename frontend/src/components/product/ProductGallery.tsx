import { useState } from "react";

import { cn } from "@/lib/utils";
import { imageUrl } from "@/lib/image";
import type { ProductImage } from "@/types/product";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? null;

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-24">
      <div className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted shadow-card">
        <img
          src={imageUrl(current, 900)}
          alt={current?.alt_text ?? name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                i === active
                  ? "border-primary shadow-glow"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <img
                src={imageUrl(img, 160)}
                alt={img.alt_text ?? `${name} ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
