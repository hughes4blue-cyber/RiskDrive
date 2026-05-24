import { useState } from "react";
import { Link } from "wouter";
import { ChevronRight, Search } from "lucide-react";
import { useListDrivers } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { PageHeader, RiskBadge } from "@/components/Layout";

export default function Drivers() {
  const [search, setSearch] = useState("");
  const { data: drivers, isLoading } = useListDrivers();

  const filtered = drivers?.filter((d) => {
    const name = `${d.firstName} ${d.lastName}`.toLowerCase();
    const s = search.toLowerCase();
    return !search || name.includes(s) || (d.facilityName ?? "").toLowerCase().includes(s) || d.licenseNumber.toLowerCase().includes(s);
  });

  return (
    <div>
      <PageHeader title="Drivers" subtitle="All drivers in the AAA towing network under telematics monitoring" />
      <div className="p-6 space-y-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            data-testid="input-driver-search"
            placeholder="Search drivers, facilities..."
            className="pl-8 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Driver</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Facility</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">License #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Risk Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Miles</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trips</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><Skeleton className="h-5" /></td></tr>
                ))
              ) : filtered?.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-driver-${d.id}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{d.firstName} {d.lastName}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{d.facilityName ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.licenseNumber}</td>
                  <td className="px-4 py-3"><RiskBadge score={d.riskScore} tier={d.riskTier} /></td>
                  <td className="px-4 py-3 font-mono text-xs">{d.totalMiles.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-xs">{d.totalTrips.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.status === "active" ? "bg-emerald-100 text-emerald-800" : d.status === "suspended" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/drivers/${d.id}`}
                      className="text-primary text-xs hover:underline inline-flex items-center gap-0.5"
                    >
                      View <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && (filtered?.length ?? 0) === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No drivers found</div>
          )}
        </div>
      </div>
    </div>
  );
}
