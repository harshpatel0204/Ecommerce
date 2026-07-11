import { useQuery } from "@tanstack/react-query";
import { Download, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { adminDownloadSubscribersCsv, adminListSubscribers } from "@/api/newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLoader } from "@/components/ui/BrandLoader";

export default function AdminNewsletterList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "newsletter", search, page],
    queryFn: () => adminListSubscribers({ search: search || undefined, page }),
  });

  const onExport = async () => {
    setDownloading(true);
    try {
      await adminDownloadSubscribersCsv();
    } catch {
      toast.error("Could not export subscribers.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="animate-fade-in-up px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Mail className="h-6 w-6 text-amber-400" /> Newsletter
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {data ? `${data.total} subscriber${data.total === 1 ? "" : "s"}` : "Storefront newsletter signups"}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 rounded-xl border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
          disabled={downloading || !data?.total}
          onClick={onExport}
        >
          <Download className="h-4 w-4" />
          {downloading ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      <Input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search by email…"
        className="mb-4 max-w-sm rounded-xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
      />

      {isLoading ? (
        <div className="admin-glass flex min-h-[30vh] items-center justify-center rounded-2xl p-8">
          <BrandLoader />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="admin-glass rounded-2xl py-16 text-center text-slate-400">No subscribers found.</div>
      ) : (
        <>
          <div className="admin-glass overflow-hidden rounded-2xl">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 text-right font-semibold">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s) => (
                  <tr key={s.id} className="border-t border-white/5 transition-colors hover:bg-white/5">
                    <td className="p-4 font-medium text-slate-100">{s.email}</td>
                    <td className="p-4 text-right text-slate-400">
                      {new Date(s.created_at).toLocaleDateString("en-IN")}
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
