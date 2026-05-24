import { Link } from "wouter";
import { ArrowLeft, Users, TrendingUp, TrendingDown, Minus, CheckCircle } from "lucide-react";
import { useGetDriver, useGetDriverBehavior, useGetDriverRiskScore, useGetDriverSuggestions } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge, StatCard } from "@/components/Layout";

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === "improving") return <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><TrendingDown className="w-3.5 h-3.5" /> Improving</div>;
  if (trend === "worsening") return <div className="flex items-center gap-1 text-red-600 text-xs font-medium"><TrendingUp className="w-3.5 h-3.5" /> Worsening</div>;
  return <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium"><Minus className="w-3.5 h-3.5" /> Stable</div>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg: Record<string, string> = {
    low: "bg-slate-100 text-slate-700 border-slate-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    urgent: "bg-red-100 text-red-800 border-red-200",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${cfg[priority] ?? ""}`}>{priority}</span>;
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, string> = {
    speeding: "🚗", braking: "⚡", acceleration: "🔄",
    phone_usage: "📵", fatigue: "😴", route_planning: "🗺️",
  };
  return <span className="text-lg">{icons[category] ?? "⚠️"}</span>;
}

export default function DriverDetail({ params }: { params: { driverId: string } }) {
  const driverId = parseInt(params.driverId);
  const { data: driver, isLoading: drvLoading } = useGetDriver(driverId, { query: { enabled: !!driverId, queryKey: ["getDriver", driverId] } });
  const { data: behavior, isLoading: bLoading } = useGetDriverBehavior(driverId, { query: { enabled: !!driverId, queryKey: ["getDriverBehavior", driverId] } });
  const { data: riskScore } = useGetDriverRiskScore(driverId, { query: { enabled: !!driverId, queryKey: ["getDriverRiskScore", driverId] } });
  const { data: suggestions, isLoading: sugLoading } = useGetDriverSuggestions(driverId, { query: { enabled: !!driverId, queryKey: ["getDriverSuggestions", driverId] } });

  return (
    <div>
      <div className="border-b border-border bg-card px-6 py-4 flex items-center gap-3">
        <Link href="/drivers" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          {drvLoading ? <Skeleton className="h-5 w-36" /> : (
            <h1 className="text-lg font-semibold">{driver?.firstName} {driver?.lastName}</h1>
          )}
          <p className="text-sm text-muted-foreground">
            {driver?.facilityName} • License: {driver?.licenseNumber}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {behavior && <TrendIcon trend={behavior.trend} />}
          {driver && <RiskBadge score={driver.riskScore} tier={driver.riskTier} />}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {bLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />) : (
            <>
              <StatCard label="Total Miles" value={(behavior?.totalMiles ?? 0).toLocaleString()} />
              <StatCard label="Avg Speed" value={`${behavior?.avgSpeed ?? 0} mph`} />
              <StatCard label="Max Speed" value={`${behavior?.maxSpeed ?? 0} mph`} />
              <StatCard label="Night Driving" value={`${behavior?.nightDrivingHours ?? 0}h`} />
            </>
          )}
        </div>

        {/* Behavior Events */}
        <div>
          <div className="text-sm font-semibold mb-3">Behavior Events (Telematics)</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {bLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />) : (
              <>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Hard Braking</div>
                  <div className={`text-2xl font-bold ${(behavior?.hardBrakingCount ?? 0) > 5 ? "text-red-600" : (behavior?.hardBrakingCount ?? 0) > 2 ? "text-orange-600" : "text-foreground"}`}>
                    {behavior?.hardBrakingCount ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground">events recorded</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Speeding</div>
                  <div className={`text-2xl font-bold ${(behavior?.speedingCount ?? 0) > 3 ? "text-red-600" : (behavior?.speedingCount ?? 0) > 1 ? "text-orange-600" : "text-foreground"}`}>
                    {behavior?.speedingCount ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground">violations</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Phone Usage</div>
                  <div className={`text-2xl font-bold ${(behavior?.phoneUsageCount ?? 0) > 0 ? "text-red-600" : "text-foreground"}`}>
                    {behavior?.phoneUsageCount ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground">incidents</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Harsh Accel.</div>
                  <div className={`text-2xl font-bold ${(behavior?.harshAccelerationCount ?? 0) > 5 ? "text-orange-600" : "text-foreground"}`}>
                    {behavior?.harshAccelerationCount ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground">events</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Risk Factors */}
        {riskScore?.factors && (
          <div>
            <div className="text-sm font-semibold mb-3">Risk Factor Breakdown</div>
            <div className="space-y-2">
              {riskScore.factors.map((f, i) => (
                <div key={i} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${f.impact === "high" ? "bg-red-500" : f.impact === "medium" ? "bg-amber-500" : "bg-emerald-500"}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{f.description}</div>
                  </div>
                  <div className="text-sm font-mono text-right">{f.value}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${f.impact === "high" ? "bg-red-100 text-red-800" : f.impact === "medium" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{f.impact}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Behavior Modification Suggestions */}
        <div>
          <div className="text-sm font-semibold mb-3">Behavior Modification Suggestions</div>
          <div className="space-y-3">
            {sugLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />) :
              suggestions?.map((s) => (
                <div key={s.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CategoryIcon category={s.category} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-sm font-semibold">{s.title}</div>
                        <PriorityBadge priority={s.priority} />
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">{s.description}</div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                        <CheckCircle className="w-3 h-3" />
                        {s.expectedImpact}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
