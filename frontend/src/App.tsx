import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { getMe } from "@/api/auth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { AdminRoute } from "@/routes/AdminRoute";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";
import { BrandLoader } from "@/components/ui/BrandLoader";

// Route-level code splitting keeps the initial bundle small.
const Home = lazy(() => import("@/pages/Home"));
const ProductListing = lazy(() => import("@/pages/ProductListing"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Wishlist = lazy(() => import("@/pages/Wishlist"));
const OrderHistory = lazy(() => import("@/pages/OrderHistory"));
const OrderDetail = lazy(() => import("@/pages/OrderDetail"));
const Account = lazy(() => import("@/pages/Account"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminProductList = lazy(() => import("@/pages/admin/ProductList"));
const AdminProductForm = lazy(() => import("@/pages/admin/ProductForm"));
const AdminOrderList = lazy(() => import("@/pages/admin/OrderList"));
const AdminOrderDetail = lazy(() => import("@/pages/admin/OrderDetail"));
const AdminUserList = lazy(() => import("@/pages/admin/UserList"));
const AdminReviewList = lazy(() => import("@/pages/admin/ReviewList"));
const AdminCouponList = lazy(() => import("@/pages/admin/CouponList"));
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <BrandLoader />
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin login (separate from customer login, no guard) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin (sidebar shell — requires admin auth) */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProductList />} />
            <Route path="/admin/products/new" element={<AdminProductForm />} />
            <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
            <Route path="/admin/orders" element={<AdminOrderList />} />
            <Route path="/admin/orders/:orderId" element={<AdminOrderDetail />} />
            <Route path="/admin/users" element={<AdminUserList />} />
            <Route path="/admin/reviews" element={<AdminReviewList />} />
            <Route path="/admin/coupons" element={<AdminCouponList />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
