import type { ProductImage } from "@/types/product";

/** Build a sized image URL (server resizes via Pillow). Falls back to a placeholder. */
export function imageUrl(image: ProductImage | null | undefined, width?: number): string {
  if (!image) return "/placeholder.svg";
  return width ? `${image.url}?w=${width}` : image.url;
}

/** Same, but from a raw image id (e.g. cart/order snapshots that store image_id). */
export function imageUrlById(id: string | null | undefined, width?: number): string {
  if (!id) return "/placeholder.svg";
  return width ? `/api/images/${id}?w=${width}` : `/api/images/${id}`;
}
