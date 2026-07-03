import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "@/store/authStore";

/**
 * UX-level guard only — the real security is the server's get_current_admin
 * dependency on every /api/admin/* route.
 */
export function AdminRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!user?.is_admin) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
