import { Link } from "wouter";
import { ChevronRight, Building2, ArrowLeft } from "lucide-react";
import { useGetClub, useGetClubSummary, useListFacilities, getListFacilitiesQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, RiskBadge, StatCard, CertBadge } from "@/components/Layout";

export default function ClubDetail({ params }: { params: { clubId: string } }) {
  const clubId = parseInt(params.clubId);
  const { data: club, isLoading: clubLoading } = useGetClub(clubId, { query: { enabled: !!clubId, queryKey: ["getClub", clubId] } });
  const { data: summary, isLoading: sumLoading } = useGetClubSummary(clubId, { query: { enabled: !!clubId, queryKey: ["getClubSummary", clubId] } });
  const { data: facilities, isLoading: facLoading } = useListFacilities(
    { clubId },
    { query: { enabled: !!clubId, queryKey: getListFacilitiesQueryKey({ clubId }) } }
  );

  return (
    <div>
      <div className="border-b border-border bg-card px-6 py-4 flex items-center gap-3">
        <Link href="/clubs" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-primary" />
        </div>
        <div>
          {clubLoading ? <Skeleton className="h-5 w-40" /> : (
            <h1 className="text-lg font-semibold">{club?.name}</h1>
          )}
          <p className="text-sm text-muted-foreground">{club?.region} Region • {club?.state}</p>
        </div>
        {club && (
          <div className="ml-auto">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${club.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
              {club.status}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sumLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />) : (
            <>
              <StatCard label="Facilities" value={summary?.totalFacilities ?? 0} />
              <StatCard label="Drivers" value={summary?.totalDrivers ?? 0} />
              <StatCard label="Vehicles" value={summary?.totalVehicles ?? 0} />
              <StatCard label="Avg Risk Score" value={summary?.avgRiskScore ?? 0} />
            </>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {sumLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />) : (
            <>
              <StatCard label="High Risk Facilities" value={summary?.highRiskCount ?? 0} color="text-orange-600" />
              <StatCard label="Open Accidents" value={summary?.openAccidents ?? 0} color="text-red-600" />
              <StatCard label="Certs Expiring" value={summary?.certificatesExpiringSoon ?? 0} color="text-amber-600" />
            </>
          )}
        </div>

        {/* Contact info */}
        {club?.contactName && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Club Contact</div>
            <div className="text-sm font-medium">{club.contactName}</div>
            {club.contactEmail && <div className="text-sm text-muted-foreground">{club.contactEmail}</div>}
          </div>
        )}

        {/* Facilities table */}
        <div>
          <div className="text-sm font-semibold mb-3">Towing Facilities ({facilities?.length ?? 0})</div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Facility</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Owner</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Risk Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Drivers</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vehicles</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">COI Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {facLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-5" /></td></tr>
                  ))
                ) : facilities?.map((f) => (
                  <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{f.name}</div>
                      <div className="text-xs text-muted-foreground">{f.city}, {f.state}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{f.ownerName}</td>
                    <td className="px-4 py-3"><RiskBadge score={f.riskScore} tier={f.riskTier} /></td>
                    <td className="px-4 py-3 font-mono">{f.totalDrivers}</td>
                    <td className="px-4 py-3 font-mono">{f.totalVehicles}</td>
                    <td className="px-4 py-3"><CertBadge status={f.certStatus ?? "unknown"} /></td>
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
          </div>
        </div>
      </div>
    </div>
  );
}
