import { CreditCard, KeyRound, Mail, Settings as SettingsIcon, Truck, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { changePassword, updateProfile } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";

const inputClass = "rounded-xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500";

/** Integration status is informational — actual secrets live in server env vars. */
const INTEGRATIONS = [
  { icon: CreditCard, name: "Razorpay", desc: "Payments — configured via RAZORPAY_* env vars" },
  { icon: Truck, name: "Shiprocket", desc: "Shipping — configured via SHIPROCKET_* env vars" },
  { icon: Mail, name: "Resend", desc: "Transactional email — configured via RESEND_API_KEY" },
];

export default function AdminSettings() {
  const { user, setUser, setSession } = useAuthStore();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateProfile({ full_name: fullName, phone: phone || undefined });
      setUser(updated);
      toast.success("Profile updated");
    } catch {
      toast.error("Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    setSavingPw(true);
    try {
      const tokens = await changePassword(currentPw, newPw);
      setSession(tokens);
      toast.success("Password changed");
      setCurrentPw("");
      setNewPw("");
    } catch {
      toast.error("Could not change password. Check your current password.");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="animate-fade-in-up px-6 py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <SettingsIcon className="h-6 w-6 text-amber-400" /> Settings
        </h1>
        <p className="mt-1 text-sm text-slate-400">Manage your admin profile, security, and integrations.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <form onSubmit={onSaveProfile} className="admin-glass rounded-2xl p-6">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-white">
            <UserIcon className="h-4 w-4 text-amber-400" /> Profile
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Email</Label>
              <Input value={user?.email ?? ""} disabled className={`${inputClass} opacity-60`} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" className={inputClass} />
            </div>
            <Button type="submit" disabled={savingProfile} className="w-full rounded-xl">
              {savingProfile ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>

        {/* Security */}
        <form onSubmit={onChangePassword} className="admin-glass rounded-2xl p-6">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-white">
            <KeyRound className="h-4 w-4 text-amber-400" /> Change password
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Current password</Label>
              <Input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">New password</Label>
              <Input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 8 characters"
                className={inputClass}
              />
            </div>
            <Button type="submit" disabled={savingPw} className="w-full rounded-xl">
              {savingPw ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>

        {/* Integrations */}
        <div className="admin-glass rounded-2xl p-6 lg:col-span-2">
          <h2 className="mb-4 font-bold text-white">Integrations</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {INTEGRATIONS.map((i) => (
              <div key={i.name} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
                    <i.icon className="h-4 w-4" />
                  </span>
                  <span className="font-semibold text-slate-100">{i.name}</span>
                </div>
                <p className="text-xs text-slate-500">{i.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-600">
            Secrets are managed as environment variables on the server for security — they are never exposed to the admin UI.
          </p>
        </div>
      </div>
    </div>
  );
}
