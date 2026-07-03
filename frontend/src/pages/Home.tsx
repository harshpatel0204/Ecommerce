import { Link } from "react-router-dom";
import { toast } from "sonner";

import { logout as logoutApi } from "@/api/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

/** Placeholder storefront home — the catalog UI arrives in Phase 2. */
export default function Home() {
  const { isAuthenticated, user, refreshToken, clear } = useAuthStore();

  const handleLogout = async () => {
    try {
      if (refreshToken) await logoutApi(refreshToken);
    } finally {
      clear();
      toast.success("Signed out");
    }
  };

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">BharatShop</h1>
        <p className="mt-2 text-muted-foreground">Your D2C store — catalog coming in Phase 2.</p>
      </div>

      {isAuthenticated ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm">
            Signed in as <span className="font-medium">{user?.full_name ?? user?.email}</span>
            {user?.is_admin && " (admin)"}
          </p>
          <div className="flex gap-3">
            {user?.is_admin && (
              <Link to="/admin" className={buttonVariants({ variant: "outline" })}>
                Admin
              </Link>
            )}
            <Button variant="secondary" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link to="/login" className={buttonVariants()}>
            Sign in
          </Link>
          <Link to="/register" className={buttonVariants({ variant: "outline" })}>
            Create account
          </Link>
        </div>
      )}
    </div>
  );
}
