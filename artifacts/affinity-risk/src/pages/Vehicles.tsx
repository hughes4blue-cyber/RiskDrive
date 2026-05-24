import { useState } from "react";
import { Link } from "wouter";
import { ChevronRight, Search } from "lucide-react";
import { useListVehicles } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { PageHeader, RiskBadge } from "@/components/Layout";

const TYPE_LABELS: Record<string, string> = {
  flatbed: "Flatbed", wheel_lift: "Wheel Lift", integrated: "Integrated",
  rotator: "Rotator", heavy_duty: "Heavy Duty",
};

export default function Vehicles() {
  const [search, setSearch] = useState("");
  const { data: vehicles, isLoading } = useListVehicles();

  const filtered = vehicles?.filter((v) => {
    const s = search.toLowerCase();
    return !search ||
      `${v.make} ${v.model}`.toLowerCase().includes(s) ||
      v.licensePlate.toLowerCase().includes(s) ||
      (v.facilityName ?? "").toLowerCase().includes(s) ||
      (v.assignedDriverName ?? "").toLowerCase().includes(s);
  });

  return (
    <div>
      <PageHeader title="Vehicles" subtitle="Fleet vehicles under telematics monitoring across all facilities" />
      <div className="p-6 space-y-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            data-testid="input-vehicle-search"
            placeholder="Search by vehicle, plate, facility..."
            className="pl-8 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vehicle</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plate / VIN</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Facility</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Risk Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Miles</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Driver</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={9} className="px-4 py-3"><Skeleton className="h-5" /></td></tr>
                ))
              ) : filtered?.map((v) => (
                <tr key={v.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-vehicle-${v.id}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{v.year} {v.make} {v.model}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{TYPE_LABELS[v.type] ?? v.type}</td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs">{v.licensePlate}</div>
                    <div className="font-mono text-[10px] text-muted-foreground truncate max-w-24">{v.vin}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{v.facilityName ?? "—"}</td>
                  <td className="px-4 py-3"><RiskBadge score={v.riskScore} tier={v.riskTier} /></td>
                  <td className="px-4 py-3 font-mono text-xs">{v.totalMiles.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{v.assignedDriverName ?? "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.status === "active" ? "bg-emerald-100 text-emerald-800" : v.status === "maintenance" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/vehicles/${v.id}`}
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
            <div className="py-10 text-center text-sm text-muted-foreground">No vehicles found</div>
          )}
        </div>
      </div>
    </div>
  );
}
