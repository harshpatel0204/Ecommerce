import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Heart, Home, KeyRound, LogOut, Package, Pencil, Plus, Shield, Star, Trash2, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
  type AddressPayload,
} from "@/api/addresses";
import { changePassword, logout as logoutApi, updateProfile } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import type { Address } from "@/types/order";

const LINKS = [
  { to: "/orders", label: "My Orders", desc: "Track and manage purchases", icon: Package },
  { to: "/wishlist", label: "Wishlist", desc: "Products you've saved", icon: Heart },
];

function apiError(err: unknown, fallback: string): string {
  return err instanceof AxiosError && err.response?.data?.detail
    ? String(err.response.data.detail)
    : fallback;
}

// ---------------------------------------------------------------- Profile
function ProfileSection() {
  const { user, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ full_name: string; phone: string }>({
    values: { full_name: user?.full_name ?? "", phone: user?.phone ?? "" },
  });

  const save = useMutation({
    mutationFn: (v: { full_name: string; phone: string }) =>
      updateProfile({ full_name: v.full_name.trim(), phone: v.phone.trim() }),
    onSuccess: (updated) => {
      setUser(updated);
      setEditing(false);
      toast.success("Profile updated");
    },
    onError: (e) => toast.error(apiError(e, "Could not update profile")),
  });

  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-card dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          <UserIcon className="h-4 w-4 text-primary" /> Profile
        </h2>
        {!editing && (
          <Button variant="outline" size="sm" className="gap-1.5 rounded-lg" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-hero text-2xl font-bold text-white">
          {(user?.full_name ?? user?.email ?? "?").charAt(0).toUpperCase()}
        </div>

        {editing ? (
          <form
            className="grid flex-1 gap-3 sm:grid-cols-2"
            onSubmit={handleSubmit((v) => save.mutate(v))}
          >
            <div className="space-y-1">
              <Label htmlFor="full_name" className="text-xs">Full name</Label>
              <Input id="full_name" className="h-10 rounded-lg" {...register("full_name", { required: true })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="profile_phone" className="text-xs">Phone</Label>
              <Input id="profile_phone" className="h-10 rounded-lg" placeholder="+919876543210" {...register("phone")} />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" size="sm" className="rounded-lg" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save changes"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-lg"
                onClick={() => {
                  reset();
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="min-w-0">
            <div className="truncate text-lg font-bold">{user?.full_name ?? "Customer"}</div>
            <div className="truncate text-sm text-muted-foreground">{user?.email}</div>
            {user?.phone && <div className="truncate text-sm text-muted-foreground">{user.phone}</div>}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------- Change password
function PasswordSection() {
  const setSession = useAuthStore((s) => s.setSession);
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<{ current: string; next: string; confirm: string }>();

  const change = useMutation({
    mutationFn: (v: { current: string; next: string }) => changePassword(v.current, v.next),
    onSuccess: (tokens) => {
      // Change-password revokes every other session and returns a fresh pair.
      setSession(tokens);
      reset();
      setOpen(false);
      toast.success("Password changed — other devices have been signed out.");
    },
    onError: (e) => toast.error(apiError(e, "Could not change password")),
  });

  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-card dark:bg-gray-900">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          <KeyRound className="h-4 w-4 text-primary" /> Password
        </h2>
        {!open && (
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setOpen(true)}>
            Change password
          </Button>
        )}
      </div>

      {open ? (
        <form
          className="mt-4 grid gap-3 sm:max-w-md"
          onSubmit={handleSubmit((v) => change.mutate({ current: v.current, next: v.next }))}
        >
          <div className="space-y-1">
            <Label className="text-xs">Current password</Label>
            <Input type="password" autoComplete="current-password" className="h-10 rounded-lg" {...register("current", { required: "Required" })} />
            {errors.current && <p className="text-xs text-destructive">{errors.current.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">New password</Label>
            <Input type="password" autoComplete="new-password" className="h-10 rounded-lg" {...register("next", { required: "Required", minLength: { value: 8, message: "At least 8 characters" } })} />
            {errors.next && <p className="text-xs text-destructive">{errors.next.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Confirm new password</Label>
            <Input type="password" autoComplete="new-password" className="h-10 rounded-lg" {...register("confirm", { validate: (v) => v === watch("next") || "Passwords do not match" })} />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="rounded-lg" disabled={change.isPending}>
              {change.isPending ? "Updating…" : "Update password"}
            </Button>
            <Button type="button" size="sm" variant="ghost" className="rounded-lg" onClick={() => { reset(); setOpen(false); }}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Changing your password signs you out of all other devices.
        </p>
      )}
    </section>
  );
}

// -------------------------------------------------------------- Address book
const EMPTY_ADDRESS: AddressPayload = {
  label: null,
  full_name: "",
  phone: "",
  line1: "",
  line2: null,
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

function AddressForm({
  initial,
  onCancel,
  onSave,
  saving,
}: {
  initial: AddressPayload;
  onCancel: () => void;
  onSave: (payload: AddressPayload) => void;
  saving: boolean;
}) {
  const { register, handleSubmit } = useForm<AddressPayload>({ defaultValues: initial });
  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={handleSubmit((v) => onSave({ ...v, line2: v.line2 || null, label: v.label || null }))}
    >
      <Input placeholder="Full name" className="rounded-lg" {...register("full_name", { required: true })} />
      <Input placeholder="Phone" className="rounded-lg" {...register("phone", { required: true })} />
      <Input className="col-span-2 rounded-lg" placeholder="Address line 1" {...register("line1", { required: true })} />
      <Input className="col-span-2 rounded-lg" placeholder="Address line 2 (optional)" {...register("line2")} />
      <Input placeholder="City" className="rounded-lg" {...register("city", { required: true })} />
      <Input placeholder="State" className="rounded-lg" {...register("state", { required: true })} />
      <Input placeholder="Pincode" className="rounded-lg" {...register("pincode", { required: true })} />
      <Input placeholder="Label (Home, Office…)" className="rounded-lg" {...register("label")} />
      <div className="col-span-2 flex gap-2">
        <Button type="submit" size="sm" className="rounded-lg" disabled={saving}>
          {saving ? "Saving…" : "Save address"}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="rounded-lg" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function AddressSection() {
  const qc = useQueryClient();
  const { data: addresses, isLoading } = useQuery({ queryKey: ["addresses"], queryFn: getAddresses });
  const [mode, setMode] = useState<"idle" | "new" | string>("idle"); // string = id being edited

  const invalidate = () => qc.invalidateQueries({ queryKey: ["addresses"] });

  const create = useMutation({
    mutationFn: createAddress,
    onSuccess: () => { invalidate(); setMode("idle"); toast.success("Address added"); },
    onError: (e) => toast.error(apiError(e, "Could not save address")),
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddressPayload }) => updateAddress(id, payload),
    onSuccess: () => { invalidate(); setMode("idle"); toast.success("Address updated"); },
    onError: (e) => toast.error(apiError(e, "Could not update address")),
  });
  const remove = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => { invalidate(); toast.success("Address removed"); },
    onError: (e) => toast.error(apiError(e, "Could not remove address")),
  });
  const makeDefault = useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => { invalidate(); toast.success("Default address set"); },
    onError: (e) => toast.error(apiError(e, "Could not set default")),
  });

  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-card dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          <Home className="h-4 w-4 text-primary" /> Saved Addresses
        </h2>
        {mode === "idle" && (
          <Button variant="outline" size="sm" className="gap-1.5 rounded-lg" onClick={() => setMode("new")}>
            <Plus className="h-3.5 w-3.5" /> Add address
          </Button>
        )}
      </div>

      {mode === "new" && (
        <div className="mb-4 rounded-xl border border-border p-4">
          <AddressForm
            initial={EMPTY_ADDRESS}
            saving={create.isPending}
            onCancel={() => setMode("idle")}
            onSave={(payload) => create.mutate(payload)}
          />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading addresses…</p>
      ) : !addresses || addresses.length === 0 ? (
        mode !== "new" && (
          <p className="text-sm text-muted-foreground">
            No saved addresses yet. Add one to speed up checkout.
          </p>
        )
      ) : (
        <div className="space-y-3">
          {addresses.map((a: Address) =>
            mode === a.id ? (
              <div key={a.id} className="rounded-xl border border-primary/40 p-4">
                <AddressForm
                  initial={{ ...a }}
                  saving={update.isPending}
                  onCancel={() => setMode("idle")}
                  onSave={(payload) => update.mutate({ id: a.id, payload })}
                />
              </div>
            ) : (
              <div key={a.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-4">
                <div className="min-w-0 text-sm">
                  <div className="flex flex-wrap items-center gap-2 font-semibold">
                    {a.full_name}
                    {a.label && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{a.label}</span>}
                    {a.is_default && (
                      <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        <Star className="h-3 w-3 fill-current" /> Default
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-muted-foreground">
                    {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} - {a.pincode}
                  </p>
                  <p className="text-muted-foreground">{a.phone}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!a.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg px-2 text-xs"
                      onClick={() => makeDefault.mutate(a.id)}
                    >
                      Set default
                    </Button>
                  )}
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => setMode(a.id)}
                    aria-label="Edit address"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive"
                    onClick={() => remove.mutate(a.id)}
                    aria-label="Delete address"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}

// ------------------------------------------------------------------- Page
export default function Account() {
  const navigate = useNavigate();
  const { user, refreshToken, clear } = useAuthStore();

  const onLogout = () => {
    if (refreshToken) {
      logoutApi(refreshToken).catch((err) => {
        console.error("Logout API error:", err);
      });
    }
    clear();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b border-border bg-white dark:bg-gray-950">
        <div className="container py-5">
          <h1 className="text-2xl font-bold">My Account</h1>
        </div>
      </div>

      <div className="container max-w-2xl space-y-6 py-8">
        <ProfileSection />

        <div className="grid gap-4 sm:grid-cols-2">
          {LINKS.map(({ to, label, desc, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-start gap-3 rounded-2xl border border-border bg-white p-5 shadow-card transition-all hover:shadow-card-hover dark:bg-gray-900"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold group-hover:text-primary">{label}</div>
                <div className="text-sm text-muted-foreground">{desc}</div>
              </div>
            </Link>
          ))}
          {user?.is_admin && (
            <Link
              to="/admin"
              className="group flex items-start gap-3 rounded-2xl border border-border bg-white p-5 shadow-card transition-all hover:shadow-card-hover dark:bg-gray-900"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold group-hover:text-primary">Admin Panel</div>
                <div className="text-sm text-muted-foreground">Manage store</div>
              </div>
            </Link>
          )}
        </div>

        <AddressSection />
        <PasswordSection />

        <div className="flex justify-end">
          <Button variant="outline" className="gap-2 rounded-xl text-destructive hover:bg-red-50 hover:text-destructive" onClick={onLogout}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
