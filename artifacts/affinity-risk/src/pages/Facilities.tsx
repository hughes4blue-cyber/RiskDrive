import { useState } from "react";
import { Link } from "wouter";
import { ChevronRight, Search } from "lucide-react";
import { useListFacilities } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { PageHeader, RiskBadge, CertBadge } from "@/components/Layout";

const TIERS = ["all", "low", "moderate", "high", "critical"];

export default function Facilities() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const { data: facilities, isLoading } = useListFacilities();

  const filtered = facilities?.filter((f) => {
    const matchSearch = !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      (f.clubName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "all" || f.riskTier === tierFilter;
    return matchSearch && matchTier;
  });

  return (
    <div>
      <PageHeader title="Towing Facilities" subtitle="All AAA towing contractor facilities across the network" />
      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              data-testid="input-facility-search"
              placeholder="Search facilities, owners, clubs..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {TIERS.map((t) => (
              <button
                key={t}
                data-testid={`filter-tier-${t}`}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                  tierFilter === t
                    ? "bg-primary text-white border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Facility</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Club</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Risk Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Drivers</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vehicles</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">COI Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={9} className="px-4 py-3"><Skeleton className="h-5" /></td></tr>
                ))
              ) : filtered?.map((f) => (
                <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{f.city}, {f.state}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{f.clubName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.ownerName}</td>
                  <td className="px-4 py-3"><RiskBadge score={f.riskScore} tier={f.riskTier} /></td>
                  <td className="px-4 py-3 font-mono text-foreground">{f.totalDrivers}</td>
                  <td className="px-4 py-3 font-mono text-foreground">{f.totalVehicles}</td>
                  <td className="px-4 py-3"><CertBadge status={f.certStatus ?? "unknown"} /></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.status === "active" ? "bg-emerald-100 text-emerald-800" : f.status === "suspended" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/facilities/${f.id}`}
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
            <div className="py-10 text-center text-sm text-muted-foreground">No facilities match your filters</div>
          )}
        </div>
      </div>
    </div>
  );
}
