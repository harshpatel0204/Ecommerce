import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { forgotPassword } from "@/api/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await forgotPassword(values.email);
      // Backend always returns the same message whether or not the email
      // exists, so the success state is unconditional.
      setSentTo(values.email);
    } catch {
      toast.error("Could not send the reset email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm animate-fade-in-up">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-hero flex items-center justify-center">
            <span className="text-base font-bold text-white">🪙</span>
          </div>
          <span className="text-lg font-bold">HariomCoins</span>
        </Link>

        {sentTo ? (
          <div className="text-center">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              If an account exists for <span className="font-semibold">{sentTo}</span>, we've
              sent a password reset link. It expires in 1 hour.
            </p>
            <Link
              to="/login"
              className={buttonVariants({ variant: "outline", className: "mt-6 h-11 rounded-xl w-full" })}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
              <p className="text-muted-foreground mt-1.5 text-sm">
                Enter your email and we'll send you a link to reset it.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold text-base bg-primary hover:bg-primary/90 shadow-sm transition-all"
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send reset link"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Remembered it?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
