import {
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Star,
  Store,
  Tag,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { logout as logoutApi } from "@/api/auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package, end: false },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag, end: false },
  { to: "/admin/reviews", label: "Reviews", icon: Star, end: false },
  { to: "/admin/coupons", label: "Coupons", icon: Tag, end: false },
  { to: "/admin/users", label: "Customers", icon: Users, end: false },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, refreshToken, clear } = useAuthStore();

  const onLogout = () => {
    if (refreshToken) {
      logoutApi(refreshToken).catch((err) => {
        console.error("Logout API error:", err);
      });
    }
    clear();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted/30 lg:grid lg:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="sticky top-0 z-30 flex h-16 items-center gap-1 border-b border-border bg-white px-4 dark:bg-gray-950 lg:h-screen lg:flex-col lg:items-stretch lg:gap-0 lg:border-b-0 lg:border-r lg:px-0 lg:py-5">
        <NavLink to="/admin" className="flex items-center gap-2 px-2 lg:px-6 lg:pb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-hero text-sm font-bold text-white">
            H
          </div>
          <span className="hidden text-base font-bold lg:block">Admin</span>
        </NavLink>

        <nav className="flex flex-1 items-center gap-1 lg:flex-col lg:items-stretch lg:gap-0.5 lg:px-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="hidden lg:block">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:mt-auto lg:block lg:space-y-1 lg:px-3">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Store className="h-4 w-4" />
            View store
          </NavLink>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        {/* Mobile: quick actions */}
        <button onClick={onLogout} className="ml-auto text-muted-foreground lg:hidden" aria-label="Sign out">
          <LogOut className="h-5 w-5" />
        </button>
      </aside>

      {/* Content */}
      <main className="min-w-0">
        <div className="border-b border-border bg-white px-6 py-4 dark:bg-gray-950">
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user?.full_name ?? user?.email}</span>
          </p>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
