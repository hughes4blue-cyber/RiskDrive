import { Link } from "wouter";
import { ArrowLeft, Users, TrendingUp, TrendingDown, Minus, CheckCircle, ShieldCheck, ShieldAlert, ClipboardList, BookOpen, Clock, Award, PlayCircle } from "lucide-react";
import { useGetDriver, useGetDriverBehavior, useGetDriverRiskScore, useGetDriverSuggestions } from "@workspace/api-client-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge, StatCard } from "@/components/Layout";

interface TrainingAssignment {
  id: number;
  moduleTitle: string | null;
  moduleCategory: string | null;
  moduleDurationMinutes: number | null;
  status: string;
  score: number | null;
  assignedAt: string;
  completedAt: string | null;
}

const TRAINING_STATUS: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  assigned: { label: "Assigned", className: "bg-blue-100 text-blue-800 border-blue-200", icon: BookOpen },
  in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-800 border-amber-200", icon: PlayCircle },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle },
};

const CATEGORY_COLORS: Record<string, string> = {
  Safety: "bg-red-50 text-red-700 border-red-200",
  Compliance: "bg-purple-50 text-purple-700 border-purple-200",
  Efficiency: "bg-blue-50 text-blue-700 border-blue-200",
  Operations: "bg-slate-50 text-slate-700 border-slate-200",
};

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
  const [training, setTraining] = useState<TrainingAssignment[] | null>(null);

  useEffect(() => {
    if (!driverId) return;
    fetch(`/api/training/driver/${driverId}`).then(r => r.json()).then(setTraining).catch(() => {});
  }, [driverId]);

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

        {/* MVR Monitoring */}
        {driver && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-primary" />
              <div className="text-sm font-semibold">MVR Monitoring</div>
              <span className="text-xs text-muted-foreground ml-auto">Continuous CDL Status Tracking</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">License Number</div>
                <div className="font-mono text-sm font-medium">{driver.licenseNumber}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">License Class</div>
                <div className="text-sm font-medium">CDL Class A</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">MVR Status</div>
                <div className="flex items-center gap-1.5">
                  {driver.riskScore < 55 ? (
                    <><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /><span className="text-xs font-semibold text-emerald-700">Clear</span></>
                  ) : (
                    <><ShieldAlert className="w-3.5 h-3.5 text-amber-600" /><span className="text-xs font-semibold text-amber-700">Review Required</span></>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Last MVR Pull</div>
                <div className="text-sm text-muted-foreground">30 days ago</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-primary" />
              Continuous MVR monitoring active — violations and CDL status changes trigger automatic alerts via FleetLytics.
            </div>
          </div>
        )}

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

        {/* Training Assignments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Assigned Training Modules
            </div>
            <Link href="/training" className="text-xs text-primary hover:underline">View all training →</Link>
          </div>
          {training === null ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : training.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
              No training modules assigned yet
            </div>
          ) : (
            <div className="space-y-2">
              {training.map(t => {
                const cfg = TRAINING_STATUS[t.status] ?? TRAINING_STATUS.assigned;
                const Icon = cfg.icon;
                return (
                  <div key={t.id} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.moduleTitle}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {t.moduleCategory && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${CATEGORY_COLORS[t.moduleCategory] ?? "bg-gray-50 text-gray-700"}`}>
                            {t.moduleCategory}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {t.moduleDurationMinutes} min
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${cfg.className}`}>
                      <Icon className="w-3 h-3" /> {cfg.label}
                    </span>
                    {t.score !== null && (
                      <div className="flex items-center gap-1 text-xs flex-shrink-0">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-semibold">{Math.round(t.score)}</span>
                        <span className="text-muted-foreground">/100</span>
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground flex-shrink-0">
                      {t.completedAt
                        ? `Completed ${new Date(t.completedAt).toLocaleDateString()}`
                        : `Assigned ${new Date(t.assignedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
