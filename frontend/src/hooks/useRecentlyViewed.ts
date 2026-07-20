import { useEffect, useState } from "react";

import type { ProductListItem } from "@/types/product";

const KEY = "recently-viewed";
const MAX = 12;

function read(): ProductListItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProductListItem[]) : [];
  } catch {
    return [];
  }
}

/** Record a viewed product (most-recent first, de-duplicated, capped). Call from
 *  the product detail page. */
export function recordRecentlyViewed(item: ProductListItem) {
  try {
    const next = [item, ...read().filter((p) => p.id !== item.id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full / unavailable — ignore, it's non-critical.
  }
}

/** Read the recently-viewed list (client-only). Reads once on mount. */
export function useRecentlyViewed(excludeId?: string): ProductListItem[] {
  const [items, setItems] = useState<ProductListItem[]>([]);
  useEffect(() => {
    setItems(read().filter((p) => p.id !== excludeId));
  }, [excludeId]);
  return items;
}
