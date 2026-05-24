import { Link } from "wouter";
import { ArrowLeft, Car, Wifi } from "lucide-react";
import { useGetVehicle, useGetVehicleTelematics, useGetVehicleRiskScore } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge, StatCard } from "@/components/Layout";

const TYPE_LABELS: Record<string, string> = {
  flatbed: "Flatbed", wheel_lift: "Wheel Lift", integrated: "Integrated",
  rotator: "Rotator", heavy_duty: "Heavy Duty",
};

const EVENT_LABELS: Record<string, string> = {
  hard_braking: "Hard Braking", harsh_acceleration: "Harsh Accel", speeding: "Speeding",
  phone_usage: "Phone Use", sharp_turn: "Sharp Turn", fatigue_detected: "Fatigue", accident: "Accident",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700", medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800",
};

export default function VehicleDetail({ params }: { params: { vehicleId: string } }) {
  const vehicleId = parseInt(params.vehicleId);
  const { data: vehicle, isLoading: vLoading } = useGetVehicle(vehicleId, { query: { enabled: !!vehicleId, queryKey: ["getVehicle", vehicleId] } });
  const { data: telematics, isLoading: telLoading } = useGetVehicleTelematics(vehicleId, { query: { enabled: !!vehicleId, queryKey: ["getVehicleTelematics", vehicleId] } });
  const { data: riskScore } = useGetVehicleRiskScore(vehicleId, { query: { enabled: !!vehicleId, queryKey: ["getVehicleRiskScore", vehicleId] } });

  return (
    <div>
      <div className="border-b border-border bg-card px-6 py-4 flex items-center gap-3">
        <Link href="/vehicles" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Car className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          {vLoading ? <Skeleton className="h-5 w-48" /> : (
            <h1 className="text-lg font-semibold">{vehicle?.year} {vehicle?.make} {vehicle?.model}</h1>
          )}
          <p className="text-sm text-muted-foreground">
            {vehicle?.licensePlate} • {TYPE_LABELS[vehicle?.type ?? ""] ?? vehicle?.type} • {vehicle?.facilityName}
          </p>
        </div>
        {vehicle && <RiskBadge score={vehicle.riskScore} tier={vehicle.riskTier} />}
      </div>

      <div className="p-6 space-y-5">
        {/* Vehicle Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {vLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />) : (
            <>
              <StatCard label="Risk Score" value={vehicle?.riskScore ?? 0} />
              <StatCard label="Total Miles" value={(vehicle?.totalMiles ?? 0).toLocaleString()} />
              <StatCard label="Assigned Driver" value={vehicle?.assignedDriverName ?? "None"} />
              <StatCard label="Telematics ID" value={vehicle?.telematicsDeviceId ?? "—"} />
            </>
          )}
        </div>

        {/* VIN and Details */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Vehicle Details</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">VIN</div>
              <div className="font-mono text-xs">{vehicle?.vin}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Status</div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${vehicle?.status === "active" ? "bg-emerald-100 text-emerald-800" : vehicle?.status === "maintenance" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"}`}>
                {vehicle?.status}
              </span>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Facility</div>
              <div className="font-medium">{vehicle?.facilityName}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Type</div>
              <div>{TYPE_LABELS[vehicle?.type ?? ""] ?? vehicle?.type}</div>
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        {riskScore?.factors && riskScore.factors.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-3">Risk Factors</div>
            <div className="space-y-2">
              {riskScore.factors.map((f, i) => (
                <div key={i} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${f.impact === "high" ? "bg-red-500" : f.impact === "medium" ? "bg-amber-500" : "bg-emerald-500"}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{f.description}</div>
                  </div>
                  <div className="text-sm font-mono">{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Telematics Events */}
        <div>
          <div className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-primary" />
            Telematics Event Log ({telematics?.length ?? 0} events)
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Timestamp</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Event Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Severity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Speed</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {telLoading ? Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={6} className="p-3"><Skeleton className="h-5" /></td></tr>) :
                  telematics?.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{new Date(t.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{EVENT_LABELS[t.eventType] ?? t.eventType}</span></td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${SEVERITY_COLORS[t.severity] ?? ""}`}>{t.severity}</span></td>
                      <td className="px-4 py-3 font-mono text-xs">{Math.round(t.speed)} mph</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.latitude.toFixed(4)}, {t.longitude.toFixed(4)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{t.notes ?? "—"}</td>
                    </tr>
                  ))}
                {!telLoading && (telematics?.length ?? 0) === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No telematics events recorded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
