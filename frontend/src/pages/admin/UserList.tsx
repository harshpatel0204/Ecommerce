import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { adminGetUsers, adminToggleUserActive } from "@/api/adminOps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="px-6 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Users className="h-6 w-6 text-primary" /> Customers
      </h1>

      <Input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search by name or email…"
        className="mb-4 max-w-sm rounded-xl"
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="shimmer h-14 rounded-xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white py-16 text-center text-muted-foreground dark:bg-gray-900">
          No customers found.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card dark:bg-gray-900">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
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
                  <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-4 font-medium">
                      {u.full_name ?? "—"}
                      {u.is_admin && <Badge className="ml-2">Admin</Badge>}
                    </td>
                    <td className="p-4 text-muted-foreground">{u.email}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("en-IN")}
                    </td>
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
                          className="rounded-lg"
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
              <span className="text-sm text-muted-foreground">
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
