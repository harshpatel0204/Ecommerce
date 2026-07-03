import type { CheckoutResponse } from "@/types/order";

interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (r: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Open the Razorpay Standard Checkout widget and resolve with the payment
 * response, or reject if the customer dismisses the modal / the SDK fails.
 */
export async function openRazorpayCheckout(
  checkout: CheckoutResponse,
  customer: { name?: string; email?: string; contact?: string },
): Promise<RazorpayHandlerResponse> {
  const ok = await loadRazorpayScript();
  if (!ok || !window.Razorpay) {
    throw new Error("Failed to load payment gateway");
  }
  if (!checkout.razorpay_order_id) {
    throw new Error("Missing payment order");
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: checkout.razorpay_key_id,
      amount: checkout.amount_paise,
      currency: checkout.currency,
      order_id: checkout.razorpay_order_id!,
      name: "HariomCoins",
      description: checkout.order_number,
      prefill: customer,
      theme: { color: "#f97316" },
      handler: (r) => resolve(r),
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    });
    rzp.open();
  });
}
