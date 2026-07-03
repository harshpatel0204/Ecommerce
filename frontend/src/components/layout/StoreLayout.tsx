import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, ArrowRight, Shield, Truck, RefreshCcw, CreditCard } from "lucide-react";

const FOOTER_LINKS = {
  shop: [
    { label: "New Arrivals", href: "/products?sort=newest" },
    { label: "Best Sellers", href: "/products?sort=price_desc" },
    { label: "Deals & Offers", href: "/products?sort=price_asc" },
    { label: "All Products", href: "/products" },
  ],
  account: [
    { label: "My Account", href: "/account" },
    { label: "Order History", href: "/orders" },
    { label: "Wishlist", href: "/wishlist" },
    { label: "Cart", href: "/cart" },
  ],
  support: [
    { label: "Contact Us", href: "#" },
    { label: "FAQ", href: "#" },
    { label: "Shipping Policy", href: "#" },
    { label: "Return Policy", href: "#" },
  ],
};

const TRUST_BADGES = [
  { icon: Truck, label: "Free Delivery", sub: "On orders over ₹999" },
  { icon: RefreshCcw, label: "Easy Returns", sub: "30-day return policy" },
  { icon: Shield, label: "Secure Payments", sub: "100% protected" },
  { icon: CreditCard, label: "EMI Available", sub: "No cost EMI options" },
];

/** Shared storefront chrome (navbar + footer) wrapping public + customer pages. */
export function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-mesh">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Trust Badges Bar */}
      <div className="border-t border-border bg-white dark:bg-gray-950">
        <div className="container py-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors group">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-300">
        {/* Newsletter */}
        <div className="border-b border-white/10">
          <div className="container py-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Stay in the loop</h3>
                <p className="text-sm text-gray-400 mt-1">Get exclusive deals and new arrivals in your inbox.</p>
              </div>
              <form className="flex gap-2 w-full sm:w-auto" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 sm:w-64 h-10 px-4 rounded-xl bg-white/10 border border-white/20 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white/15 transition-all"
                />
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 shrink-0"
                >
                  Subscribe <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Links grid */}
        <div className="container py-12">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4">
            {/* Brand column */}
            <div className="col-span-2 sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-hero flex items-center justify-center">
                  <span className="text-base font-bold text-white">B</span>
                </div>
                <span className="text-lg font-bold text-white">HariomCoins</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">
                Your trusted destination for quality products across India. Everyday essentials, thoughtfully curated.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <a href="mailto:hello@hariomcoins.in" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="h-4 w-4" /> hello@hariomcoins.in
                </a>
                <a href="tel:+911800000000" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="h-4 w-4" /> 1800-000-0000
                </a>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Mumbai, India
                </span>
              </div>
            </div>

            {/* Shop links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Shop</h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.shop.map((l) => (
                  <li key={l.href}>
                    <Link to={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Account</h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.account.map((l) => (
                  <li key={l.href}>
                    <Link to={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Support</h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.support.map((l) => (
                  <li key={l.href}>
                    <Link to={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">© 2025 HariomCoins. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {[
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Facebook, href: "#", label: "Facebook" },
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Youtube, href: "#", label: "YouTube" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <Shield className="h-3 w-3" /> Secured by SSL · PCI DSS Compliant
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
