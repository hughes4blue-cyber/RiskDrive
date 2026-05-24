import { Link } from "wouter";
import { ChevronRight, Building2 } from "lucide-react";
import { useListClubs } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, RiskBadge } from "@/components/Layout";

export default function Clubs() {
  const { data: clubs, isLoading } = useListClubs();

  return (
    <div>
      <PageHeader title="AAA Clubs" subtitle="Parent organization hierarchy for towing facility management" />
      <div className="p-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Club Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Region</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">State</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Facilities</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Avg Risk</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><Skeleton className="h-5" /></td></tr>
                ))
              ) : clubs?.map((club) => (
                <tr key={club.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{club.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{club.region}</td>
                  <td className="px-4 py-3 text-muted-foreground">{club.state}</td>
                  <td className="px-4 py-3 font-mono text-foreground">{club.totalFacilities}</td>
                  <td className="px-4 py-3"><RiskBadge score={club.avgRiskScore} /></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{club.contactName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${club.status === "active" ? "bg-emerald-100 text-emerald-800" : club.status === "review" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                      {club.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/clubs/${club.id}`}
                      className="text-primary hover:underline inline-flex items-center gap-0.5 text-xs"
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
  );
}
