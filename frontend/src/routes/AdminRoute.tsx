import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "@/store/authStore";

/**
 * UX-level guard only — the real security is the server's get_current_admin
 * dependency on every /api/admin/* route.
 *
 * Unauthenticated or non-admin users are redirected to the dedicated
 * admin login page at /admin/login (not the customer /login).
 */
export function AdminRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user?.is_admin) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}
