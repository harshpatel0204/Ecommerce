import {
  FolderTree,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  RotateCcw,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Tag,
  Users,
  Warehouse,
} from "lucide-react";
import { Suspense } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { logout as logoutApi } from "@/api/auth";
import { NotificationsBell } from "@/components/admin/NotificationsBell";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

/** Grouped nav so the sidebar reads as sections, not one long list. */
const NAV_GROUPS: {
  heading: string;
  items: { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean }[];
}[] = [
  {
    heading: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    heading: "Catalog",
    items: [
      { to: "/admin/products", label: "Products", icon: Package },
      { to: "/admin/categories", label: "Categories", icon: FolderTree },
      { to: "/admin/inventory", label: "Inventory", icon: Warehouse },
    ],
  },
  {
    heading: "Sales",
    items: [
      { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { to: "/admin/returns", label: "Returns", icon: RotateCcw },
      { to: "/admin/coupons", label: "Coupons", icon: Tag },
    ],
  },
  {
    heading: "Engagement",
    items: [
      { to: "/admin/reviews", label: "Reviews", icon: Star },
      { to: "/admin/users", label: "Customers", icon: Users },
      { to: "/admin/newsletter", label: "Newsletter", icon: Mail },
    ],
  },
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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
      isActive
        ? "bg-gradient-to-r from-amber-500/20 to-transparent text-amber-300 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.25)]"
        : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
    );

  return (
    <div className="admin-bg min-h-screen text-slate-200 lg:grid lg:grid-cols-[264px_1fr]">
      {/* ---------------------------------------------------------------- Sidebar */}
      <aside className="admin-glass-strong sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-white/5 px-4 lg:h-screen lg:flex-col lg:items-stretch lg:gap-0 lg:border-b-0 lg:border-r lg:px-0 lg:py-6">
        {/* Brand */}
        <NavLink to="/admin" className="flex items-center gap-2.5 px-1 lg:px-6 lg:pb-7">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero text-sm font-bold text-white shadow-glow">
            H
          </div>
          <div className="hidden lg:block">
            <div className="text-base font-bold leading-none text-white">Hariom<span className="text-gradient-gold">Coins</span></div>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-widest text-slate-500">Admin Console</div>
          </div>
        </NavLink>

        {/* Nav groups */}
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto lg:flex-col lg:items-stretch lg:gap-0.5 lg:overflow-y-auto lg:px-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.heading} className="contents lg:block lg:w-full">
              <p className="mb-1 mt-4 hidden px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600 lg:block">
                {group.heading}
              </p>
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={navLinkClass}>
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          "absolute left-0 top-1/2 hidden h-5 w-1 -translate-y-1/2 rounded-r-full bg-amber-400 transition-opacity lg:block",
                          isActive ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="hidden lg:block">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="hidden lg:mt-4 lg:block lg:space-y-1 lg:border-t lg:border-white/5 lg:px-3 lg:pt-4">
          <NavLink to="/admin/settings" className={navLinkClass}>
            <Settings className="h-4 w-4" />
            <span className="hidden lg:block">Settings</span>
          </NavLink>
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100"
          >
            <Store className="h-4 w-4" />
            View store
          </NavLink>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        {/* Mobile: quick sign-out */}
        <button onClick={onLogout} className="ml-auto text-slate-400 lg:hidden" aria-label="Sign out">
          <LogOut className="h-5 w-5" />
        </button>
      </aside>

      {/* ---------------------------------------------------------------- Content */}
      <main className="min-w-0">
        <div className="admin-glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-white/5 px-6 py-3.5">
          <div className="hidden sm:block">
            <p className="text-xs text-slate-500">Signed in as</p>
            <p className="text-sm font-semibold text-slate-100">{user?.full_name ?? user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsBell />
            <span className="hidden rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 sm:inline">
              Owner
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-hero text-sm font-bold text-white">
              {(user?.full_name ?? user?.email ?? "A")[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Keep the sidebar/header visible while an admin page chunk loads. */}
        <Suspense
          fallback={
            <div className="flex min-h-[70vh] items-center justify-center">
              <BrandLoader />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
