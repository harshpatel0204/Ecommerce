import { Search, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { logout as logoutApi } from "@/api/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshToken, clear } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount);
  const [q, setQ] = useState("");

  // Keeps the badge count in sync while authenticated.
  useCart();

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/products?search=${encodeURIComponent(term)}` : "/products");
  };

  const onLogout = async () => {
    try {
      if (refreshToken) await logoutApi(refreshToken);
    } finally {
      clear();
      toast.success("Signed out");
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="text-lg font-bold">
          BharatShop
        </Link>

        <form onSubmit={onSearch} className="relative hidden flex-1 sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
          />
        </form>

        <nav className="ml-auto flex items-center gap-2">
          <Link
            to="/cart"
            className={buttonVariants({ variant: "ghost", size: "icon", className: "relative" })}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <>
              {user?.is_admin && (
                <Link to="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Admin
                </Link>
              )}
              <Link to="/account" className={buttonVariants({ variant: "ghost", size: "icon" })}>
                <User className="h-5 w-5" />
              </Link>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                Sign out
              </Button>
            </>
          ) : (
            <Link to="/login" className={buttonVariants({ size: "sm" })}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
