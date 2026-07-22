import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { register as registerApi, loginWithGoogle, loginWithFirebasePhone } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/ui/otp-input";
import { useAuthStore } from "@/store/authStore";
import {
  auth,
  hasFirebaseConfig,
  createRecaptchaVerifier,
  firebaseAuthMessage,
} from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPhoneNumber, signInWithPopup } from "firebase/auth";

// Validation Schemas
const emailSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  countryCode: z.string().min(1),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return /^\d{8,11}$/.test(val.replace(/\s+/g, ""));
      },
      {
        message: "Enter a valid local phone number (e.g. 9876543210)",
      }
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type EmailFormValues = z.infer<typeof emailSchema>;

const otpRegisterSendSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  countryCode: z.string().min(1),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\d{8,11}$/, "Enter a valid local mobile number (e.g. 9876543210)"),
});
type OtpRegisterSendValues = z.infer<typeof otpRegisterSendSchema>;

const otpVerifySchema = z.object({
  code: z
    .string()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d+$/, "Verification code must contain only numbers"),
});
type OtpVerifyValues = z.infer<typeof otpVerifySchema>;

const BENEFITS = [
  "Certificate of authenticity with every purchase",
  "Early access to rare coin & note listings",
  "Insured shipping & tamper-proof packaging",
  "Easy order tracking & collection management",
];

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, setSession } = useAuthStore();

  // Common UI State
  const [loginMethod, setLoginMethod] = useState<"email" | "otp">("email");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login Step State
  const [otpStep, setOtpStep] = useState<"send" | "verify">("send");
  const [phoneSubmitted, setPhoneSubmitted] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // 1. Email Registration Form
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { countryCode: "+91", phone: "" },
  });

  // 2. OTP Send Form
  const {
    register: registerOtpSend,
    handleSubmit: handleOtpSendSubmit,
    formState: { errors: otpSendErrors },
    getValues: getOtpSendValues,
  } = useForm<OtpRegisterSendValues>({
    resolver: zodResolver(otpRegisterSendSchema),
    defaultValues: { countryCode: "+91", phone: "" },
  });

  // 3. OTP Verify Form
  const {
    handleSubmit: handleOtpVerifySubmit,
    formState: { errors: otpVerifyErrors },
    reset: resetOtpVerify,
    control: controlOtpVerify,
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

  // 1. Email Registration Submit
  const onEmailSubmit = async (values: EmailFormValues) => {
    setSubmitting(true);
    let formattedPhone = undefined;
    if (values.phone) {
      formattedPhone = `${values.countryCode}${values.phone.trim().replace(/\s+/g, "")}`;
    }
    
    try {
      const tokens = await registerApi({
        full_name: values.full_name,
        email: values.email,
        password: values.password,
        phone: formattedPhone || undefined,
      });
      setSession(tokens);
      toast.success("Account created! Welcome to HariomCoins 🎉");
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        err instanceof AxiosError && err.response?.data?.detail
          ? String(err.response.data.detail)
          : "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Google Registration (Acts as login/register)
  const handleGoogleLogin = async () => {
    setSubmitting(true);
    try {
      let idToken = "mock-google-token";

      if (hasFirebaseConfig && auth) {
        // Real Google sign-in via Firebase popup — same flow as the Login page.
        const result = await signInWithPopup(auth, new GoogleAuthProvider());
        const credential = GoogleAuthProvider.credentialFromResult(result);
        idToken = credential?.idToken ?? (await result.user.getIdToken());
      } else {
        toast.info("Google not configured — using development mock login.");
      }

      const tokens = await loginWithGoogle({ id_token: idToken });
      setSession(tokens);
      toast.success("Account linked with Google successfully!");
      navigate("/", { replace: true });
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        toast.error(firebaseAuthMessage(err, "Google authentication failed. Please try again."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Send OTP
  const onOtpSendSubmit = async (values: OtpRegisterSendValues) => {
    setSubmitting(true);
    const phone = `${values.countryCode}${values.phone.trim().replace(/\s+/g, "")}`;
    
    try {
      if (hasFirebaseConfig && auth) {
        const verifier = createRecaptchaVerifier();
        const result = await signInWithPhoneNumber(auth, phone, verifier);
        setConfirmationResult(result);
        toast.success("Verification SMS sent successfully!");
      } else {
        toast.success("[MOCK MODE] SMS Sent successfully! Use verification code: 123456");
        console.log(`[SMS OTP MOCK] Mock code sent to: ${phone} (Code: 123456)`);
      }
      setPhoneSubmitted(phone);
      setNameSubmitted(values.full_name);
      setOtpStep("verify");
      setResendTimer(60);
      resetOtpVerify(); // Reset code input
    } catch (err: any) {
      toast.error(firebaseAuthMessage(err, "Failed to send verification SMS. Try again."));
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Verify OTP
  const onOtpVerifySubmit = async (values: OtpVerifyValues) => {
    setSubmitting(true);
    const otpCode = values.code;
    try {
      let firebaseIdToken = "mock-firebase-token";

      if (hasFirebaseConfig && confirmationResult) {
        const userCredential = await confirmationResult.confirm(otpCode);
        firebaseIdToken = await userCredential.user.getIdToken();
      } else {
        if (otpCode !== "123456") {
          throw new Error("Invalid verification code. Please use 123456.");
        }
        firebaseIdToken = `mock-phone-${phoneSubmitted}`;
      }

      const tokens = await loginWithFirebasePhone({
        id_token: firebaseIdToken,
        full_name: nameSubmitted || "OTP User",
      });
      setSession(tokens);
      toast.success("Account verified with Mobile OTP successfully!");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(firebaseAuthMessage(err, "Invalid OTP code. Please check and try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="store-theme min-h-screen grid lg:grid-cols-2">
      {/* Left: Decorative panel */}
      <div className="hidden lg:flex flex-col justify-center relative overflow-hidden bg-gradient-hero p-12">
        <div className="absolute inset-0 opacity-80">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/25 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/10 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="h-9 w-9 rounded-xl bg-gradient-hero flex items-center justify-center">
              <span className="text-base font-bold text-white">🪙</span>
            </div>
            <span className="text-lg font-bold text-white">HariomCoins</span>
          </Link>

          <h2 className="text-3xl font-bold text-white mb-3">Start Your Collection Today</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Create your free account and discover rare coins & banknotes from around the world.
          </p>

          <div className="space-y-4">
            {BENEFITS.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 p-4 rounded-2xl bg-card/5 border border-white/10">
            <p className="text-xs text-gray-400 mb-2">Trusted by shoppers across India</p>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["#1f6b4d", "#b8860b", "#8b2f3a", "#2f6b52"].map((color, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-white/20 flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: color }}
                  >
                    {["A", "P", "R", "S"][i]}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-300 font-medium">+10,000 happy collectors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Multi-Authentication Registration Form */}
      <div className="flex items-center justify-center px-6 py-12 bg-background overflow-y-auto">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-gradient-hero flex items-center justify-center">
              <span className="text-base font-bold text-white">🪙</span>
            </div>
            <span className="text-lg font-bold">HariomCoins</span>
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Sign in instead →
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
              Email Setup
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
            /* Email Register Form */
            <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-sm font-medium">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    placeholder="Rahul Sharma"
                    className="pl-10 h-11 rounded-xl"
                    {...registerEmail("full_name")}
                  />
                </div>
                {emailErrors.full_name && (
                  <p className="text-sm text-destructive">{emailErrors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
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
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone number <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <div className="flex gap-2">
                  <select
                    className="h-11 px-3 border border-border rounded-xl bg-background text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...registerEmail("countryCode")}
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
                      {...registerEmail("phone")}
                    />
                  </div>
                </div>
                {emailErrors.phone && (
                  <p className="text-sm text-destructive">{emailErrors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
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
                className="w-full h-11 rounded-xl font-semibold text-base bg-primary hover:bg-primary/90 shadow-sm transition-all mt-2"
                disabled={submitting}
              >
                {submitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          ) : (
            /* OTP Form */
            <div className="space-y-5">
              {otpStep === "send" ? (
                /* OTP send form */
                <form onSubmit={handleOtpSendSubmit(onOtpSendSubmit)} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="otp_name" className="text-sm font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="otp_name"
                        placeholder="Rahul Sharma"
                        className="pl-10 h-11 rounded-xl"
                        {...registerOtpSend("full_name")}
                      />
                    </div>
                    {otpSendErrors.full_name && (
                      <p className="text-sm text-destructive">{otpSendErrors.full_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="otp_phone" className="text-sm font-medium">Mobile Phone Number</Label>
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
                          id="otp_phone"
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
                      <Label htmlFor="otp_code" className="text-sm font-medium">Enter 6-Digit OTP</Label>
                      <button
                        type="button"
                        onClick={() => setOtpStep("send")}
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        Change settings
                      </button>
                    </div>
                    <Controller
                      control={controlOtpVerify}
                      name="code"
                      render={({ field }) => (
                        <OtpInput
                          value={field.value || ""}
                          onChange={field.onChange}
                          error={!!otpVerifyErrors.code}
                        />
                      )}
                    />
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
                    {submitting ? "Verifying..." : "Verify & Setup Account"}
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
              <span className="bg-background px-3 text-muted-foreground">Or sign up with</span>
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
            Sign up with Google
          </Button>


          <p className="mt-6 text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{" "}
            <a href="#" className="underline hover:text-foreground">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
