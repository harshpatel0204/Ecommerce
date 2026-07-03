import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { getMe } from "@/api/auth";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Placeholder from "@/pages/Placeholder";
import Register from "@/pages/Register";
import { AdminRoute } from "@/routes/AdminRoute";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";

export default function App() {
  const { refreshToken, accessToken, setUser, clear } = useAuthStore();

  // On load, if a refresh token was persisted but we have no access token yet,
  // restore the session. getMe() 401s, the client interceptor refreshes the
  // access token, then the retry returns the current user.
  useEffect(() => {
    if (refreshToken && !accessToken) {
      getMe()
        .then(setUser)
        .catch(() => clear());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/products" element={<Placeholder title="Product listing" />} />
      <Route path="/products/:slug" element={<Placeholder title="Product detail" />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/cart" element={<Placeholder title="Cart" />} />
        <Route path="/checkout" element={<Placeholder title="Checkout" />} />
        <Route path="/orders" element={<Placeholder title="Order history" />} />
        <Route path="/orders/:orderNumber" element={<Placeholder title="Order detail" />} />
        <Route path="/account" element={<Placeholder title="Account" />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<Placeholder title="Admin dashboard" />} />
        <Route path="/admin/products" element={<Placeholder title="Admin products" />} />
        <Route path="/admin/orders" element={<Placeholder title="Admin orders" />} />
        <Route path="/admin/users" element={<Placeholder title="Admin users" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
