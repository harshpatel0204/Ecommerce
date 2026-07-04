import { Heart, Menu, Search, ShoppingCart, User, X, ChevronDown, Zap } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { logout as logoutApi } from "@/api/auth";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

const NAV_LINKS = [
  { label: "Indian Coins", href: "/products?category_slug=indian-coins" },
  { label: "Foreign Coins", href: "/products?category_slug=foreign-coins" },
  { label: "Indian Notes", href: "/products?category_slug=indian-notes" },
  { label: "Foreign Notes", href: "/products?category_slug=foreign-notes" },
  { label: "All Collection", href: "/products" },
];

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshToken, clear } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount);
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useCart();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/products?search=${encodeURIComponent(term)}` : "/products");
    setMobileOpen(false);
  };

  const onLogout = async () => {
    try {
      if (refreshToken) await logoutApi(refreshToken);
    } finally {
      clear();
      toast.success("Signed out successfully");
      navigate("/");
      setUserMenuOpen(false);
    }
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-gradient-hero py-2 text-center text-xs font-medium text-white tracking-wide">
        <span className="flex items-center justify-center gap-2">
          <Zap className="h-3 w-3" />
          Free shipping on orders over ₹999 · India's Trusted Numismatic Store
          <Zap className="h-3 w-3" />
        </span>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "shadow-md bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-border"
            : "bg-white dark:bg-gray-950 border-b border-border"
        }`}
      >
        <div className="container">
          <div className="flex h-16 items-center gap-4 lg:gap-6">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 shrink-0 group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-glow group-hover:shadow-lg transition-shadow">
                <span className="text-lg font-bold text-white leading-none">🪙</span>
              </div>
              <span className="text-lg font-bold tracking-tight hidden sm:block">
                Hariom<span className="text-gradient">Coins</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 ml-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Search bar */}
            <form
              onSubmit={onSearch}
              className={`relative flex-1 hidden sm:flex max-w-md transition-all duration-300 ${searchFocused ? "max-w-xl" : ""}`}
            >
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors peer-focus:text-primary" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search coins, notes, era..."
                  className="pl-10 pr-4 h-10 rounded-xl bg-muted/60 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-900 transition-all"
                />
              </div>
            </form>

            {/* Right actions */}
            <div className="ml-auto flex items-center gap-1">
              {/* Mobile search */}
              <button
                onClick={() => setMobileOpen(true)}
                className={buttonVariants({ variant: "ghost", size: "icon", className: "sm:hidden rounded-xl" })}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist */}
              {isAuthenticated && (
                <Link
                  to="/wishlist"
                  className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-xl hidden sm:flex" })}
                  aria-label="Wishlist"
                >
                  <Heart className="h-5 w-5" />
                </Link>
              )}

              {/* Cart */}
              <Link
                to="/cart"
                className={buttonVariants({ variant: "ghost", size: "icon", className: "relative rounded-xl" })}
                aria-label={`Cart (${itemCount} items)`}
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-glow animate-scale-in">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>

              {/* Auth */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <div className="h-7 w-7 rounded-full bg-gradient-hero flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {user?.full_name?.[0]?.toUpperCase() ?? <User className="h-3.5 w-3.5" />}
                    </div>
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* User dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white dark:bg-gray-900 shadow-card-hover border border-border overflow-hidden animate-scale-in">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold truncate">{user?.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <div className="py-1.5">
                        <Link
                          to="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          My Account
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                        >
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          My Orders
                        </Link>
                        <Link
                          to="/wishlist"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                        >
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          Wishlist
                        </Link>
                        {user?.is_admin && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-primary hover:bg-accent transition-colors"
                          >
                            <Zap className="h-4 w-4" />
                            Admin Panel
                          </Link>
                        )}
                        <div className="border-t border-border mt-1.5 pt-1.5">
                          <button
                            onClick={onLogout}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mobile user icon */}
                  <Link
                    to="/account"
                    className={buttonVariants({ variant: "ghost", size: "icon", className: "sm:hidden rounded-xl" })}
                  >
                    <User className="h-5 w-5" />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="hidden sm:block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-glow"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className={buttonVariants({ variant: "ghost", size: "icon", className: "sm:hidden rounded-xl" })}
                  >
                    <User className="h-5 w-5" />
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={buttonVariants({ variant: "ghost", size: "icon", className: "lg:hidden rounded-xl" })}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-white dark:bg-gray-950 shadow-2xl animate-slide-in-right">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <div className="h-8 w-8 rounded-xl bg-gradient-hero flex items-center justify-center">
                  <span className="text-sm font-bold text-white">🪙</span>
                </div>
                <span className="font-bold">HariomCoins</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-xl" })}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <form onSubmit={onSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search coins, notes..."
                    className="pl-10 rounded-xl bg-muted border-transparent"
                  />
                </div>
              </form>

              <nav className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center px-3 py-3 text-sm font-medium rounded-xl hover:bg-muted transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="border-t border-border pt-4 space-y-2">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/60">
                      <div className="h-9 w-9 rounded-full bg-gradient-hero flex items-center justify-center text-white font-bold">
                        {user?.full_name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{user?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <Link to="/orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl hover:bg-muted transition-colors">My Orders</Link>
                    <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl hover:bg-muted transition-colors">Wishlist</Link>
                    {user?.is_admin && (
                      <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-primary rounded-xl hover:bg-accent transition-colors">Admin Panel</Link>
                    )}
                    <button onClick={onLogout} className="w-full text-left px-3 py-2.5 text-sm text-destructive rounded-xl hover:bg-destructive/5 transition-colors">Sign out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors">Sign in</Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Create Account</Link>
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
