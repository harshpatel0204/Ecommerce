import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Eye, EyeOff, Mail, Lock, Shield, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { login } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { BrandLoader } from "@/components/ui/BrandLoader";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, user, setSession } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (submitting) {
    return <BrandLoader fullScreen />;
  }

  // Already authenticated as admin — go straight to dashboard
  if (isAuthenticated && user?.is_admin) {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const tokens = await login(values);

      // Reject non-admin users
      if (!tokens.user.is_admin) {
        toast.error("Access denied. This login is for administrators only.");
        return;
      }

      setSession(tokens);
      toast.success("Welcome back, Admin!");
      navigate("/admin", { replace: true });
    } catch (err) {
      const message =
        err instanceof AxiosError && err.response?.data?.detail
          ? String(err.response.data.detail)
          : "Login failed. Please check your credentials.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-950">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Login card */}
      <div className="relative w-full max-w-md mx-4 animate-fade-in-up">
        {/* Top badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium backdrop-blur-sm">
            <Shield className="h-4 w-4" />
            Admin Portal
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="h-11 w-11 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
                <span className="text-xl font-bold text-white">🪙</span>
              </div>
              <span className="text-xl font-bold text-white">
                Hariom<span className="text-gradient">Coins</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-white mt-4">Admin Sign In</h1>
            <p className="text-sm text-gray-400 mt-2">
              Enter your admin credentials to access the dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-sm font-medium text-gray-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@hariomcoins.in"
                  className="pl-10 h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-primary focus:bg-white/15 transition-all"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-sm font-medium text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-primary focus:bg-white/15 transition-all"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-gradient-hero text-white font-semibold hover:opacity-90 transition-all shadow-glow hover:shadow-lg disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <span className="flex items-center gap-2">
                  Sign in to Dashboard <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-gray-500">
              This area is restricted to authorized administrators only.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors mt-2"
            >
              ← Back to storefront
            </Link>
          </div>
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-4 mt-6 text-gray-600">
          <div className="flex items-center gap-1.5 text-xs">
            <Shield className="h-3.5 w-3.5" /> SSL Encrypted
          </div>
          <div className="h-3 w-px bg-gray-700" />
          <div className="flex items-center gap-1.5 text-xs">
            <Lock className="h-3.5 w-3.5" /> Secure Access
          </div>
        </div>
      </div>
    </div>
  );
}
