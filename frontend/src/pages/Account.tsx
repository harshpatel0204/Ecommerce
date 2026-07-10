import { Heart, LogOut, Package, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { logout as logoutApi } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

const LINKS = [
  { to: "/orders", label: "My Orders", desc: "Track and manage purchases", icon: Package },
  { to: "/wishlist", label: "Wishlist", desc: "Products you've saved", icon: Heart },
];

export default function Account() {
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
    <div className="min-h-screen bg-muted/20">
      <div className="border-b border-border bg-white dark:bg-gray-950">
        <div className="container py-5">
          <h1 className="text-2xl font-bold">My Account</h1>
        </div>
      </div>

      <div className="container max-w-2xl py-8">
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-white p-6 shadow-card dark:bg-gray-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-hero text-2xl font-bold text-white">
            {(user?.full_name ?? user?.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-bold">{user?.full_name ?? "Customer"}</div>
            <div className="truncate text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {LINKS.map(({ to, label, desc, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-start gap-3 rounded-2xl border border-border bg-white p-5 shadow-card transition-all hover:shadow-card-hover dark:bg-gray-900"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold group-hover:text-primary">{label}</div>
                <div className="text-sm text-muted-foreground">{desc}</div>
              </div>
            </Link>
          ))}
          {user?.is_admin && (
            <Link
              to="/admin"
              className="group flex items-start gap-3 rounded-2xl border border-border bg-white p-5 shadow-card transition-all hover:shadow-card-hover dark:bg-gray-900"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold group-hover:text-primary">Admin Panel</div>
                <div className="text-sm text-muted-foreground">Manage store</div>
              </div>
            </Link>
          )}
        </div>

        <Button variant="outline" className="mt-6 gap-2 rounded-xl" onClick={onLogout}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}
