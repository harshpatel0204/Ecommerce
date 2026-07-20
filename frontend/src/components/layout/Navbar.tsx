import { ChevronDown, Grid3x3, Heart, Menu, Search, ShoppingCart, User, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { logout as logoutApi } from "@/api/auth";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useCategories } from "@/hooks/useProducts";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useUiStore } from "@/store/uiStore";

const QUICK_LINKS = [
  { label: "Indian Coins", href: "/products?category_slug=indian-coins" },
  { label: "Foreign Coins", href: "/products?category_slug=foreign-coins" },
  { label: "Indian Notes", href: "/products?category_slug=indian-notes" },
  { label: "Foreign Notes", href: "/products?category_slug=foreign-notes" },
  { label: "New Arrivals", href: "/products?sort=newest" },
];

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshToken, clear } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount);
  const openCart = useUiStore((s) => s.openCart);
  const { data: categories } = useCategories();

  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const megaRef = useRef<HTMLDivElement>(null);

  useCart();

  // Animate the cart badge when the count increases (item added).
  const [bump, setBump] = useState(false);
  const prevCount = useRef(itemCount);
  useEffect(() => {
    if (itemCount > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 420);
      prevCount.current = itemCount;
      return () => clearTimeout(t);
    }
    prevCount.current = itemCount;
  }, [itemCount]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/products?search=${encodeURIComponent(term)}` : "/products");
    setMobileOpen(false);
  };

  const onLogout = () => {
    if (refreshToken) logoutApi(refreshToken).catch((err) => console.error("Logout API error:", err));
    clear();
    toast.success("Signed out successfully");
    navigate("/");
    setUserMenuOpen(false);
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-gradient-hero py-2 text-center text-xs font-medium tracking-wide text-white">
        <span className="flex items-center justify-center gap-2">
          <Zap className="h-3 w-3" />
          Free shipping on orders over ₹999 · India's Trusted Numismatic Store
          <Zap className="h-3 w-3" />
        </span>
      </div>

      <header
        className={`sticky top-0 z-50 border-b border-border transition-all duration-300 ${
          scrolled ? "bg-white/95 shadow-md backdrop-blur-xl dark:bg-gray-950/95" : "bg-white dark:bg-gray-950"
        }`}
      >
        {/* Main row */}
        <div className="container">
          <div className="flex h-16 items-center gap-4 lg:gap-6">
            <Link to="/" className="group flex shrink-0 items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-glow transition-shadow group-hover:shadow-lg">
                <span className="text-lg font-bold leading-none text-white">🪙</span>
              </div>
              <span className="hidden text-lg font-bold tracking-tight sm:block">
                Hariom<span className="text-gradient">Coins</span>
              </span>
            </Link>

            {/* Search */}
            <form onSubmit={onSearch} className="relative hidden max-w-xl flex-1 sm:flex">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search coins, notes, era, country…"
                  className="h-10 rounded-xl border-transparent bg-muted/60 pl-10 pr-4 transition-all focus:border-primary focus:bg-white dark:focus:bg-gray-900"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setMobileOpen(true)}
                className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-xl sm:hidden" })}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {isAuthenticated && (
                <Link
                  to="/wishlist"
                  className={buttonVariants({ variant: "ghost", size: "icon", className: "hidden rounded-xl sm:flex" })}
                  aria-label="Wishlist"
                >
                  <Heart className="h-5 w-5" />
                </Link>
              )}

              {/* Cart → opens drawer */}
              <button
                onClick={openCart}
                className={buttonVariants({ variant: "ghost", size: "icon", className: "relative rounded-xl" })}
                aria-label={`Cart (${itemCount} items)`}
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span
                    className={`absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-glow ${
                      bump ? "animate-badge-bump" : ""
                    }`}
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>

              {/* Account */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="hidden h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-muted sm:flex"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-hero text-xs font-bold text-white">
                      {user?.full_name?.[0]?.toUpperCase() ?? <User className="h-3.5 w-3.5" />}
                    </div>
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 animate-scale-in overflow-hidden rounded-2xl border border-border bg-white shadow-card-hover dark:bg-gray-900">
                      <div className="border-b border-border px-4 py-3">
                        <p className="truncate text-sm font-semibold">{user?.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                      <div className="py-1.5">
                        {[
                          { to: "/account", label: "My Account", icon: User },
                          { to: "/orders", label: "My Orders", icon: ShoppingCart },
                          { to: "/wishlist", label: "Wishlist", icon: Heart },
                        ].map(({ to, label, icon: Icon }) => (
                          <Link
                            key={to}
                            to={to}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-muted"
                          >
                            <Icon className="h-4 w-4 text-muted-foreground" /> {label}
                          </Link>
                        ))}
                        {user?.is_admin && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-primary transition-colors hover:bg-accent"
                          >
                            <Zap className="h-4 w-4" /> Admin Panel
                          </Link>
                        )}
                        <div className="mt-1.5 border-t border-border pt-1.5">
                          <button
                            onClick={onLogout}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/5"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <Link to="/account" className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-xl sm:hidden" })}>
                    <User className="h-5 w-5" />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="hidden px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="hidden h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-glow sm:flex"
                  >
                    Get Started
                  </Link>
                  <Link to="/login" className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-xl sm:hidden" })}>
                    <User className="h-5 w-5" />
                  </Link>
                </div>
              )}

              <button
                onClick={() => setMobileOpen((o) => !o)}
                className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-xl lg:hidden" })}
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category row + mega menu (desktop) */}
        <div className="hidden border-t border-border lg:block">
          <div className="container flex h-11 items-center gap-1">
            <div className="relative" ref={megaRef}>
              <button
                onClick={() => setMegaOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                <Grid3x3 className="h-4 w-4 text-primary" /> All Categories
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${megaOpen ? "rotate-180" : ""}`} />
              </button>

              {megaOpen && categories && categories.length > 0 && (
                <div className="absolute left-0 top-full z-50 mt-1 w-[560px] animate-scale-in rounded-2xl border border-border bg-white p-4 shadow-card-hover dark:bg-gray-900">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    {categories.map((c) => (
                      <div key={c.id} className="py-1">
                        <Link
                          to={`/products?category_slug=${c.slug}`}
                          onClick={() => setMegaOpen(false)}
                          className="block rounded-lg px-2 py-1.5 text-sm font-semibold hover:bg-muted hover:text-primary"
                        >
                          {c.name}
                        </Link>
                        {c.children?.length > 0 && (
                          <div className="ml-2">
                            {c.children.map((sub) => (
                              <Link
                                key={sub.id}
                                to={`/products?category_slug=${sub.slug}`}
                                onClick={() => setMegaOpen(false)}
                                className="block rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-primary"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <span className="mx-1 h-5 w-px bg-border" />

            {QUICK_LINKS.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/products"
              className="ml-auto rounded-lg px-3 py-1.5 text-sm font-semibold text-primary hover:bg-accent"
            >
              View all →
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-full animate-slide-in-right bg-white shadow-2xl dark:bg-gray-950">
            <div className="flex items-center justify-between border-b border-border p-4">
              <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-hero">
                  <span className="text-sm font-bold text-white">🪙</span>
                </div>
                <span className="font-bold">HariomCoins</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-xl" })}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-4" style={{ maxHeight: "calc(100% - 65px)" }}>
              <form onSubmit={onSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search coins, notes…"
                    className="rounded-xl border-transparent bg-muted pl-10"
                  />
                </div>
              </form>

              <nav className="space-y-1">
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categories</p>
                {(categories ?? []).map((c) => (
                  <Link
                    key={c.id}
                    to={`/products?category_slug=${c.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    {c.name}
                  </Link>
                ))}
                <Link to="/products" onClick={() => setMobileOpen(false)} className="flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-primary hover:bg-accent">
                  View all products →
                </Link>
              </nav>

              <div className="space-y-2 border-t border-border pt-4">
                {isAuthenticated ? (
                  <>
                    <Link to="/orders" onClick={() => setMobileOpen(false)} className="flex rounded-xl px-3 py-2.5 text-sm hover:bg-muted">My Orders</Link>
                    <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="flex rounded-xl px-3 py-2.5 text-sm hover:bg-muted">Wishlist</Link>
                    {user?.is_admin && (
                      <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex rounded-xl px-3 py-2.5 text-sm text-primary hover:bg-accent">Admin Panel</Link>
                    )}
                    <button onClick={onLogout} className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-destructive hover:bg-destructive/5">Sign out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="flex w-full items-center justify-center rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">Sign in</Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Create Account</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
