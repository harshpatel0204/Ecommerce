import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { adminGetUsers, adminToggleUserActive } from "@/api/adminOps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLoader } from "@/components/ui/BrandLoader";

export default function AdminUserList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search, page],
    queryFn: () => adminGetUsers({ search: search || undefined, page }),
  });

  const toggle = useMutation({
    mutationFn: adminToggleUserActive,
    onSuccess: () => {
      toast.success("Customer updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e) =>
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Update failed"),
  });

  return (
    <div className="animate-fade-in-up px-6 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
        <Users className="h-6 w-6 text-amber-400" /> Customers
      </h1>

      <Input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search by name or email…"
        className="mb-4 max-w-sm rounded-xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
      />

      {isLoading ? (
        <div className="admin-glass flex min-h-[30vh] items-center justify-center rounded-2xl p-8">
          <BrandLoader />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="admin-glass rounded-2xl py-16 text-center text-slate-400">No customers found.</div>
      ) : (
        <>
          <div className="admin-glass overflow-hidden rounded-2xl">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Joined</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="border-t border-white/5 transition-colors hover:bg-white/5">
                    <td className="p-4 font-medium">
                      <Link to={`/admin/users/${u.id}`} className="text-amber-300 hover:underline">
                        {u.full_name ?? "—"}
                      </Link>
                      {u.is_admin && <Badge className="ml-2">Admin</Badge>}
                    </td>
                    <td className="p-4 text-slate-400">{u.email}</td>
                    <td className="p-4 text-slate-400">{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="p-4">
                      <Badge variant={u.is_active ? "success" : "secondary"}>
                        {u.is_active ? "Active" : "Deactivated"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      {!u.is_admin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
                          disabled={toggle.isPending}
                          onClick={() => toggle.mutate(u.id)}
                        >
                          {u.is_active ? "Deactivate" : "Reactivate"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-slate-400">
                Page {data.page} of {data.pages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
