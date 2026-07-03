import type { ProductImage } from "@/types/product";

/** Build a sized image URL (server resizes via Pillow). Falls back to a placeholder. */
export function imageUrl(image: ProductImage | null | undefined, width?: number): string {
  if (!image) return "/placeholder.svg";
  return width ? `${image.url}?w=${width}` : image.url;
}
