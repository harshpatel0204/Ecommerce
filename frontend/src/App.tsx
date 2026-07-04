import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { getMe } from "@/api/auth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { AdminRoute } from "@/routes/AdminRoute";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";

// Route-level code splitting keeps the initial bundle small.
const Home = lazy(() => import("@/pages/Home"));
const ProductListing = lazy(() => import("@/pages/ProductListing"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Wishlist = lazy(() => import("@/pages/Wishlist"));
const OrderHistory = lazy(() => import("@/pages/OrderHistory"));
const OrderDetail = lazy(() => import("@/pages/OrderDetail"));
const Account = lazy(() => import("@/pages/Account"));
const Placeholder = lazy(() => import("@/pages/Placeholder"));
const AdminProductList = lazy(() => import("@/pages/admin/ProductList"));
const AdminProductForm = lazy(() => import("@/pages/admin/ProductForm"));

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

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
    <Suspense fallback={<PageFallback />}>
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
            <Route path="/account" element={<Account />} />
          </Route>
        </Route>

        {/* Auth (no navbar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin (sidebar shell) */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Placeholder title="Dashboard" />} />
            <Route path="/admin/products" element={<AdminProductList />} />
            <Route path="/admin/products/new" element={<AdminProductForm />} />
            <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
            <Route path="/admin/orders" element={<Placeholder title="Orders" />} />
            <Route path="/admin/users" element={<Placeholder title="Customers" />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
