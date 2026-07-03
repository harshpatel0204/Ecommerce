const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Format a rupee amount, e.g. 699 -> "₹699". */
export function formatPrice(amount: number): string {
  return inr.format(amount);
}
