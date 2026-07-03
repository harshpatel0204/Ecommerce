import { useState } from "react";

import { cn } from "@/lib/utils";
import { imageUrl } from "@/lib/image";
import type { ProductImage } from "@/types/product";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
        <img
          src={imageUrl(current, 800)}
          alt={current?.alt_text ?? name}
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2",
                i === active ? "border-primary" : "border-transparent",
              )}
            >
              <img
                src={imageUrl(img, 150)}
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
