import { useEffect } from "react";

interface PageMeta {
  title?: string;
  description?: string;
  /** Absolute or same-origin URL for og:image (e.g. /api/images/{id}?w=800). */
  image?: string;
}

const DEFAULT_TITLE = "HariomCoins — Rare Coins & Banknotes Collection";

function setMetaTag(attr: "name" | "property", key: string, content: string | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!content) {
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Per-page SEO meta for the SPA: document.title + description + Open Graph.
 * Pass undefined fields while data is loading — they're applied once available.
 * Title resets to the site default on unmount so stale titles don't linger.
 */
export function usePageMeta({ title, description, image }: PageMeta) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | HariomCoins`;
    }
    setMetaTag("name", "description", description);
    setMetaTag("property", "og:title", title ? `${title} | HariomCoins` : undefined);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:image", image);
    setMetaTag("property", "og:type", "website");

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, image]);
}
