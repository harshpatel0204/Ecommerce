/**
 * Unified analytics module — PostHog + Google Analytics 4.
 *
 * Both providers are opt-in: if the relevant VITE_* env vars are blank the
 * provider silently no-ops (no crashes, no console errors). This keeps the
 * dev workflow unchanged for contributors who haven't configured analytics.
 *
 * Usage:
 *   import { initAnalytics, trackPageView, trackEvent, identifyUser } from "@/lib/analytics";
 *   initAnalytics();                       // once, at app boot
 *   trackPageView("/products");            // on every route change
 *   identifyUser(user);                    // after login / register
 *   trackEvent("add_to_cart", { ... });    // custom events
 */

import posthog from "posthog-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal user shape needed for identification. */
interface AnalyticsUser {
  id: string;
  email: string;
  full_name?: string | null;
  is_admin?: boolean;
}

/** Ecommerce item for GA4 standard events. */
interface EcommerceItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
  item_variant?: string;
}

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || "https://us.i.posthog.com";
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

let posthogReady = false;
let gtagReady = false;

// Extend window for gtag.
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/** Call once at app startup (before ReactDOM.createRoot). */
export function initAnalytics(): void {
  // --- PostHog ---
  if (POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false,       // we fire manually on route change
      capture_pageleave: true,
      autocapture: true,
      persistence: "localStorage+cookie",
    });
    posthogReady = true;
  }

  // --- GA4 (gtag.js) ---
  if (GA_ID) {
    // Inject the gtag.js script dynamically so there's no build dependency.
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { send_page_view: false }); // manual page views
    gtagReady = true;
  }
}

// ---------------------------------------------------------------------------
// Page views
// ---------------------------------------------------------------------------

/** Fire on every client-side route change. */
export function trackPageView(path: string): void {
  if (posthogReady) {
    posthog.capture("$pageview", { $current_url: window.location.href });
  }
  if (gtagReady) {
    window.gtag("event", "page_view", { page_path: path });
  }
}

// ---------------------------------------------------------------------------
// User identification
// ---------------------------------------------------------------------------

/** Call after login or register to tie events to the user. */
export function identifyUser(user: AnalyticsUser): void {
  if (posthogReady) {
    posthog.identify(user.id, {
      email: user.email,
      name: user.full_name ?? undefined,
      is_admin: user.is_admin ?? false,
    });
  }
  if (gtagReady) {
    window.gtag("set", { user_id: user.id });
  }
}

/** Call on logout to reset analytics identity. */
export function resetAnalytics(): void {
  if (posthogReady) {
    posthog.reset();
  }
  // GA4 doesn't have a built-in "reset" — clearing user_id is sufficient.
  if (gtagReady) {
    window.gtag("set", { user_id: undefined });
  }
}

// ---------------------------------------------------------------------------
// Generic events
// ---------------------------------------------------------------------------

/** Fire a custom event to both PostHog and GA4. */
export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  if (posthogReady) {
    posthog.capture(name, properties);
  }
  if (gtagReady) {
    window.gtag("event", name, properties);
  }
}

// ---------------------------------------------------------------------------
// Ecommerce helpers (GA4 standard event names)
// ---------------------------------------------------------------------------

/** Product detail page viewed. */
export function trackViewProduct(item: EcommerceItem): void {
  const props = { currency: "INR", value: item.price, items: [item] };
  if (posthogReady) {
    posthog.capture("view_item", props);
  }
  if (gtagReady) {
    window.gtag("event", "view_item", props);
  }
}

/** Item added to cart. */
export function trackAddToCart(item: EcommerceItem): void {
  const props = { currency: "INR", value: item.price * (item.quantity ?? 1), items: [item] };
  if (posthogReady) {
    posthog.capture("add_to_cart", props);
  }
  if (gtagReady) {
    window.gtag("event", "add_to_cart", props);
  }
}

/** Cart page viewed. */
export function trackViewCart(value: number, items: EcommerceItem[]): void {
  const props = { currency: "INR", value, items };
  if (posthogReady) {
    posthog.capture("view_cart", props);
  }
  if (gtagReady) {
    window.gtag("event", "view_cart", props);
  }
}

/** Checkout started. */
export function trackBeginCheckout(value: number, items: EcommerceItem[]): void {
  const props = { currency: "INR", value, items };
  if (posthogReady) {
    posthog.capture("begin_checkout", props);
  }
  if (gtagReady) {
    window.gtag("event", "begin_checkout", props);
  }
}

/** Purchase completed (after payment verification). */
export function trackPurchase(
  transactionId: string,
  value: number,
  items: EcommerceItem[],
  shipping?: number,
  tax?: number,
): void {
  const props = {
    currency: "INR",
    transaction_id: transactionId,
    value,
    items,
    shipping: shipping ?? 0,
    tax: tax ?? 0,
  };
  if (posthogReady) {
    posthog.capture("purchase", props);
  }
  if (gtagReady) {
    window.gtag("event", "purchase", props);
  }
}
