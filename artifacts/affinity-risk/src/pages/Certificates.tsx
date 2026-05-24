import { useState } from "react";
import { FileCheck, AlertCircle } from "lucide-react";
import { useListCertificates } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, CertBadge } from "@/components/Layout";

export default function Certificates() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: certs, isLoading } = useListCertificates();

  const filtered = certs?.filter((c) => statusFilter === "all" || c.status === statusFilter);
  const statuses = ["all", "current", "expiring_soon", "expired"];
  const statusLabels: Record<string, string> = { all: "All", current: "Current", expiring_soon: "Expiring Soon", expired: "Expired" };

  const expiredCount = certs?.filter((c) => c.status === "expired").length ?? 0;
  const expiringCount = certs?.filter((c) => c.status === "expiring_soon").length ?? 0;

  return (
    <div>
      <PageHeader title="Certificates of Insurance" subtitle="COI tracking across all towing facilities" />
      <div className="p-6 space-y-4">
        {/* Alert banners */}
        {(expiredCount > 0 || expiringCount > 0) && !isLoading && (
          <div className="space-y-2">
            {expiredCount > 0 && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <span className="font-semibold">{expiredCount} certificate{expiredCount > 1 ? "s" : ""} expired</span> — immediate renewal required to maintain coverage compliance.
                </div>
              </div>
            )}
            {expiringCount > 0 && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <span className="font-semibold">{expiringCount} certificate{expiringCount > 1 ? "s" : ""} expiring within 30 days</span> — contact facilities to initiate renewal.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              data-testid={`filter-cert-${s}`}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? "bg-primary text-white border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Facility</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Policy Number</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Insurer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Coverage Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Effective</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expires</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><Skeleton className="h-5" /></td></tr>
                ))
              ) : filtered?.map((c) => (
                <tr key={c.id} className={`hover:bg-muted/30 transition-colors ${c.status === "expired" ? "bg-red-50/30" : c.status === "expiring_soon" ? "bg-amber-50/30" : ""}`} data-testid={`cert-row-${c.id}`}>
                  <td className="px-4 py-3 font-medium">{c.facilityName ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.policyNumber}</td>
                  <td className="px-4 py-3">{c.insurer}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{c.coverageType}</td>
                  <td className="px-4 py-3 font-mono text-xs">${c.coverageAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.effectiveDate}</td>
                  <td className={`px-4 py-3 text-xs font-medium ${c.status === "expired" ? "text-red-700" : c.status === "expiring_soon" ? "text-amber-700" : "text-muted-foreground"}`}>
                    {c.expirationDate}
                  </td>
                  <td className="px-4 py-3"><CertBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && (filtered?.length ?? 0) === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No certificates match the selected filter</div>
          )}
        </div>
      </div>
    </div>
  );
}
