import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Eye, EyeOff, Mail, Lock, Phone, Key } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { login, loginWithGoogle, loginWithFirebasePhone } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { auth, hasFirebaseConfig } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Validation Schemas
const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type EmailFormValues = z.infer<typeof emailSchema>;

const otpSendSchema = z.object({
  countryCode: z.string().min(1),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\d{8,11}$/, "Enter a valid local mobile number (e.g. 9876543210)"),
});
type OtpSendValues = z.infer<typeof otpSendSchema>;

const otpVerifySchema = z.object({
  code: z
    .string()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d+$/, "Verification code must contain only numbers"),
});
type OtpVerifyValues = z.infer<typeof otpVerifySchema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, setSession } = useAuthStore();

  // Common UI State
  const [loginMethod, setLoginMethod] = useState<"email" | "otp">("email");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login Step State
  const [otpStep, setOtpStep] = useState<"send" | "verify">("send");
  const [phoneSubmitted, setPhoneSubmitted] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // 1. Email Form Hook
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) });

  // 2. OTP Send Form Hook
  const {
    register: registerOtpSend,
    handleSubmit: handleOtpSendSubmit,
    formState: { errors: otpSendErrors },
    getValues: getOtpSendValues,
  } = useForm<OtpSendValues>({
    resolver: zodResolver(otpSendSchema),
    defaultValues: { countryCode: "+91", phone: "" },
  });

  // 3. OTP Verify Form Hook
  const {
    register: registerOtpVerify,
    handleSubmit: handleOtpVerifySubmit,
    formState: { errors: otpVerifyErrors },
    reset: resetOtpVerify,
  } = useForm<OtpVerifyValues>({ resolver: zodResolver(otpVerifySchema) });

  // Handle countdown for resending OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Redirect helper after successful login
  const handleRedirect = () => {
    const next =
      searchParams.get("next") ??
      (location.state as { from?: string } | null)?.from ??
      "/";
    navigate(next, { replace: true });
  };

  // 1. Email Login Submit Handler
  const onEmailSubmit = async (values: EmailFormValues) => {
    setSubmitting(true);
    try {
      const tokens = await login(values);
      setSession(tokens);
      toast.success("Welcome back!");
      handleRedirect();
    } catch (err) {
      const message =
        err instanceof AxiosError && err.response?.data?.detail
          ? String(err.response.data.detail)
          : "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Google Login Submit Handler
  const handleGoogleLogin = async () => {
    setSubmitting(true);
    try {
      let idToken = "mock-google-token";
      
      if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        toast.info("Connecting to Google...");
      } else {
        toast.info("Operating in development mock Google login mode");
      }

      const tokens = await loginWithGoogle({ id_token: idToken });
      setSession(tokens);
      toast.success("Logged in with Google successfully!");
      handleRedirect();
    } catch (err) {
      toast.error("Google authentication failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Send OTP Submit Handler
  const onOtpSendSubmit = async (values: OtpSendValues) => {
    setSubmitting(true);
    const phone = `${values.countryCode}${values.phone.trim().replace(/\s+/g, "")}`;
    
    try {
      if (hasFirebaseConfig && auth) {
        // Ensure recaptcha container exists in body
        let recaptchaContainer = document.getElementById("recaptcha-container");
        if (!recaptchaContainer) {
          recaptchaContainer = document.createElement("div");
          recaptchaContainer.id = "recaptcha-container";
          document.body.appendChild(recaptchaContainer);
        }

        const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });

        const result = await signInWithPhoneNumber(auth, phone, verifier);
        setConfirmationResult(result);
        toast.success("Verification SMS sent successfully!");
      } else {
        // Simulated Mock OTP Mode
        toast.success("[MOCK MODE] SMS Sent successfully! Use verification code: 123456");
        console.log(`[SMS OTP MOCK] Mock code sent to: ${phone} (Code: 123456)`);
      }
      setPhoneSubmitted(phone);
      setOtpStep("verify");
      setResendTimer(60);
      resetOtpVerify(); // Reset verification input field
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification SMS. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Verify OTP Submit Handler
  const onOtpVerifySubmit = async (values: OtpVerifyValues) => {
    setSubmitting(true);
    const otpCode = values.code;
    try {
      let firebaseIdToken = "mock-firebase-token";

      if (hasFirebaseConfig && confirmationResult) {
        // Real Firebase OTP Verification
        const userCredential = await confirmationResult.confirm(otpCode);
        firebaseIdToken = await userCredential.user.getIdToken();
      } else {
        // Mock OTP Verification Checks
        if (otpCode !== "123456") {
          throw new Error("Invalid verification code. Please use 123456.");
        }
        firebaseIdToken = `mock-phone-${phoneSubmitted}`;
      }

      // Send ID token to our own FastAPI server for app session generation
      const tokens = await loginWithFirebasePhone({ id_token: firebaseIdToken });
      setSession(tokens);
      toast.success("Logged in with Mobile OTP successfully!");
      handleRedirect();
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP code. Please check and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Decorative panel */}
      <div className="hidden lg:flex flex-col items-center justify-center relative overflow-hidden bg-gradient-hero p-12">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-white blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative text-center text-white">
          <div className="h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-white/30">
            <span className="text-4xl font-bold">🪙</span>
          </div>
          <h2 className="text-3xl font-bold mb-3">Welcome Back, Collector!</h2>
          <p className="text-white/80 max-w-xs text-base leading-relaxed">
            Sign in to access your collection, wishlist, and exclusive finds on HariomCoins.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-center">
            {[
              { value: "5K+", label: "Collectors" },
              { value: "800+", label: "Coins & Notes" },
              { value: "4.9★", label: "Rating" },
              { value: "100%", label: "Authentic" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-white/70 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Multi-Authentication Login Form */}
      <div className="flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-gradient-hero flex items-center justify-center">
              <span className="text-base font-bold text-white">🪙</span>
            </div>
            <span className="text-lg font-bold">HariomCoins</span>
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Sign in to your account</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Create one free →
              </Link>
            </p>
          </div>

          {/* Authentication tabs */}
          <div className="flex border-b border-border mb-6">
            <button
              type="button"
              onClick={() => setLoginMethod("email")}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
                loginMethod === "email" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Email Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod("otp")}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
                loginMethod === "otp" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Mobile OTP
            </button>
          </div>

          {/* Form Content */}
          {loginMethod === "email" ? (
            /* Email Form */
            <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="pl-10 h-11 rounded-xl"
                    {...registerEmail("email")}
                  />
                </div>
                {emailErrors.email && (
                  <p className="text-sm text-destructive">{emailErrors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <button type="button" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 rounded-xl"
                    {...registerEmail("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {emailErrors.password && (
                  <p className="text-sm text-destructive">{emailErrors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold text-base bg-primary hover:bg-primary/90 shadow-sm hover:shadow-glow transition-all"
                disabled={submitting}
              >
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          ) : (
            /* OTP Form */
            <div className="space-y-5">
              {otpStep === "send" ? (
                /* OTP send form */
                <form onSubmit={handleOtpSendSubmit(onOtpSendSubmit)} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm font-medium">Mobile Phone Number</Label>
                    <div className="flex gap-2">
                      <select
                        className="h-11 px-3 border border-border rounded-xl bg-background text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        {...registerOtpSend("countryCode")}
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+65">🇸🇬 +65</option>
                      </select>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="9876543210"
                          className="pl-10 h-11 rounded-xl"
                          {...registerOtpSend("phone")}
                        />
                      </div>
                    </div>
                    {otpSendErrors.phone && (
                      <p className="text-sm text-destructive">{otpSendErrors.phone.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl font-semibold text-base bg-primary hover:bg-primary/90 shadow-sm transition-all"
                    disabled={submitting}
                  >
                    {submitting ? "Sending SMS..." : "Send Verification OTP"}
                  </Button>
                </form>
              ) : (
                /* OTP verify form */
                <form onSubmit={handleOtpVerifySubmit(onOtpVerifySubmit)} className="space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="otp" className="text-sm font-medium">Enter 6-Digit OTP</Label>
                      <button
                        type="button"
                        onClick={() => setOtpStep("send")}
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        Change number
                      </button>
                    </div>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="otp"
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        className="pl-10 h-11 rounded-xl tracking-widest font-mono text-center"
                        {...registerOtpVerify("code")}
                      />
                    </div>
                    {otpVerifyErrors.code && (
                      <p className="text-sm text-destructive">{otpVerifyErrors.code.message}</p>
                    )}
                    <div className="flex justify-between items-center text-xs pt-1 text-muted-foreground">
                      <span>Sent to {phoneSubmitted}</span>
                      {resendTimer > 0 ? (
                        <span>Resend in {resendTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOtpSendSubmit(getOtpSendValues())}
                          className="text-primary hover:underline font-semibold"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl font-semibold text-base bg-primary hover:bg-primary/90 shadow-sm transition-all"
                    disabled={submitting}
                  >
                    {submitting ? "Verifying..." : "Verify & Sign In"}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Social Sign-In */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">Or login with</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-11 rounded-xl flex items-center justify-center gap-2 border-border hover:bg-muted font-medium"
            disabled={submitting}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.76 14.93 1 12 1 7.35 1 3.39 3.65 1.41 7.5l3.86 3C6.18 7.35 8.87 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.97 3.7-8.62z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.26c-.25-.75-.39-1.56-.39-2.39s.14-1.64.39-2.39L1.41 6.48C.51 8.12 0 9.99 0 12s.51 3.88 1.41 5.52l3.86-3.26z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.12.75-2.54 1.2-4.23 1.2-3.13 0-5.82-2.31-6.73-5.46L1.41 16.2C3.39 20.05 7.35 23 12 23z"
              />
            </svg>
            Sign in with Google
          </Button>

          {/* Recaptcha hidden anchor for Firebase Verify */}
          <div id="recaptcha-container" className="hidden" />

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <a href="#" className="underline hover:text-foreground">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
