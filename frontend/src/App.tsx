import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { getMe } from "@/api/auth";
import { StoreLayout } from "@/components/layout/StoreLayout";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import OrderDetail from "@/pages/OrderDetail";
import OrderHistory from "@/pages/OrderHistory";
import Placeholder from "@/pages/Placeholder";
import ProductDetail from "@/pages/ProductDetail";
import ProductListing from "@/pages/ProductListing";
import Register from "@/pages/Register";
import Wishlist from "@/pages/Wishlist";
import AdminProductForm from "@/pages/admin/ProductForm";
import AdminProductList from "@/pages/admin/ProductList";
import { AdminRoute } from "@/routes/AdminRoute";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";

export default function App() {
  const { refreshToken, accessToken, setUser, clear } = useAuthStore();

  // Restore the session on load: getMe() 401s, the client interceptor refreshes
  // the access token, then the retry returns the current user.
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
      {/* Storefront (shared navbar) */}
      <Route element={<StoreLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductListing />} />
        <Route path="/products/:slug" element={<ProductDetail />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/orders/:orderNumber" element={<OrderDetail />} />
          <Route path="/account" element={<Placeholder title="Account" />} />
        </Route>
      </Route>

      {/* Auth (no navbar) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin */}
      <Route element={<AdminRoute />}>
        <Route element={<StoreLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
          <Route path="/admin/products" element={<AdminProductList />} />
          <Route path="/admin/products/new" element={<AdminProductForm />} />
          <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
          <Route path="/admin/orders" element={<Placeholder title="Admin orders" />} />
          <Route path="/admin/users" element={<Placeholder title="Admin users" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
