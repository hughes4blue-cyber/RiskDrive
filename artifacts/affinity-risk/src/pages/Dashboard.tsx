import { Link } from "wouter";
import { AlertTriangle, ChevronRight } from "lucide-react";
import {
  useGetDashboardOverview, useGetRiskDistribution, useGetRecentAccidents,
  useGetTopRiskDrivers, useGetTelematicsActivity
} from "@workspace/api-client-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, RiskBadge, StatCard } from "@/components/Layout";

const RISK_COLORS = {
  low: "#10b981",
  moderate: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

/* ── SVG Fuel Gauge ─────────────────────────────────────────────── */
function FuelGauge({
  value, max, label, color, sublabel,
}: {
  value: number; max: number; label: string; color: string; sublabel?: string;
}) {
  const pct = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const cx = 60, cy = 62, r = 48;
  const strokeW = 9;

  // Arc sweeps 180° from left (180°) to right (0°) through the top
  const bgPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`;

  let fillPath = "";
  if (pct > 0.002 && pct < 0.998) {
    const angleRad = (1 - pct) * Math.PI; // 180°→0° maps to pct 0→1
    const ex = (cx + r * Math.cos(angleRad)).toFixed(2);
    const ey = (cy - r * Math.sin(angleRad)).toFixed(2);
    fillPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${ex} ${ey}`;
  } else if (pct >= 0.998) {
    fillPath = bgPath;
  }

  // Needle
  const needleAngle = (1 - pct) * Math.PI;
  const needleLen = r - 8;
  const nx = (cx + needleLen * Math.cos(needleAngle)).toFixed(2);
  const ny = (cy - needleLen * Math.sin(needleAngle)).toFixed(2);

  const displayVal = max > 0 && value === Math.round(value)
    ? String(value)
    : value.toFixed(0);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg viewBox="0 0 120 70" className="w-full max-w-[120px]">
        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const a = (1 - t) * Math.PI;
          const outer = r + 5;
          const inner = r + 1;
          const x1 = (cx + outer * Math.cos(a)).toFixed(1);
          const y1 = (cy - outer * Math.sin(a)).toFixed(1);
          const x2 = (cx + inner * Math.cos(a)).toFixed(1);
          const y2 = (cy - inner * Math.sin(a)).toFixed(1);
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />;
        })}
        {/* Background arc */}
        <path d={bgPath} fill="none" stroke="#e2e8f0" strokeWidth={strokeW} strokeLinecap="round" />
        {/* Coloured fill arc */}
        {fillPath && (
          <path d={fillPath} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
        )}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="3.5" fill="#334155" />
        {/* Value */}
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">
          {displayVal}
        </text>
        {max > 1 && (
          <text x={cx} y={cy - 2} textAnchor="middle" fontSize="7.5" fill="#94a3b8">
            of {max}
          </text>
        )}
        {/* Min / Max labels */}
        <text x={cx - r + 1} y={cy + 10} fontSize="7" fill="#94a3b8">0</text>
        <text x={cx + r - 1} y={cy + 10} fontSize="7" fill="#94a3b8" textAnchor="end">{max}</text>
      </svg>
      <div className="text-xs font-semibold capitalize leading-tight" style={{ color }}>{label}</div>
      {sublabel && <div className="text-[10px] text-slate-400 leading-tight">{sublabel}</div>}
    </div>
  );
}

/* ── Risk Gauge Panel ────────────────────────────────────────────── */
function RiskGauges({ distribution, loading }: {
  distribution?: { tier: string; count: number; percentage: number }[];
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-48" />;
  const tiers = ["low", "moderate", "high", "critical"] as const;
  const total = distribution?.reduce((s, d) => s + d.count, 0) ?? 0;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {tiers.map((tier) => {
          const d = distribution?.find(x => x.tier === tier);
          const count = d?.count ?? 0;
          return (
            <FuelGauge
              key={tier}
              value={count}
              max={total}
              label={tier}
              color={RISK_COLORS[tier]}
              sublabel={total > 0 ? `${((count / total) * 100).toFixed(0)}% of fleet` : undefined}
            />
          );
        })}
      </div>
      {total > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span>Total facilities: <span className="font-semibold text-slate-600">{total}</span></span>
          <span className="text-emerald-600 font-medium">
            {distribution?.find(d => d.tier === "low")?.count ?? 0} low risk
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Badges ──────────────────────────────────────────────────────── */
function AccidentStatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    alerted: "bg-red-100 text-red-800 border-red-200",
    claim_initiated: "bg-blue-100 text-blue-800 border-blue-200",
    under_review: "bg-amber-100 text-amber-800 border-amber-200",
    resolved: "bg-green-100 text-green-800 border-green-200",
  };
  const labels: Record<string, string> = {
    alerted: "Alerted",
    claim_initiated: "Claim Initiated",
    under_review: "Under Review",
    resolved: "Resolved",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${config[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, string> = {
    minor: "bg-slate-100 text-slate-700",
    moderate: "bg-amber-100 text-amber-800",
    major: "bg-orange-100 text-orange-800",
    total_loss: "bg-red-100 text-red-800 font-bold",
  };
  const labels: Record<string, string> = {
    minor: "Minor",
    moderate: "Moderate",
    major: "Major",
    total_loss: "Total Loss",
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${config[severity] ?? ""}`}>
      {labels[severity] ?? severity}
    </span>
  );
}

/* ── Dashboard ───────────────────────────────────────────────────── */
export default function Dashboard() {
  const { data: overview, isLoading: ovLoading } = useGetDashboardOverview();
  const { data: distribution, isLoading: distLoading } = useGetRiskDistribution();
  const { data: accidents, isLoading: accLoading } = useGetRecentAccidents();
  const { data: topDrivers, isLoading: drLoading } = useGetTopRiskDrivers();
  const { data: activity, isLoading: actLoading } = useGetTelematicsActivity();

  const activitySlice = activity?.slice(-14) ?? [];
  const avgScore = overview?.avgPlatformRiskScore ?? 0;

  return (
    <div>
      <PageHeader
        title="Affinity RiskDrive™ Dashboard"
        subtitle="Affinity Risk Solutions — real telematics, real data, right-sized premiums for AAA towing networks"
      />
      <div className="p-6 space-y-6">

        {/* RiskDrive Value Banner */}
        <div className="bg-gradient-to-r from-primary/5 via-primary/8 to-primary/5 border border-primary/20 rounded-xl px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Carrier Markets Accessible", value: "8", sub: "Competing for AAA network business", color: "text-primary" },
            { label: "Est. Premium Savings vs. Benchmark", value: "14%", sub: "Based on actual telematics scores", color: "text-emerald-600" },
            { label: "Claim Exoneration Rate", value: "25%", sub: "Powered by dashcam & telematics data", color: "text-primary" },
            { label: "TCOR Trend", value: "↓ Improving", sub: "90-day rolling fleet performance", color: "text-emerald-600" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{s.label}</div>
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ovLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
          ) : (
            <>
              <StatCard label="AAA Clubs" value={overview?.totalClubs ?? 0} sub="Active regions" />
              <StatCard label="Tow Operators" value={overview?.totalFacilities ?? 0} sub={`${overview?.highRiskFacilities ?? 0} need intervention`} />
              <StatCard label="Drivers" value={overview?.totalDrivers ?? 0} sub="Under telematics" />
              <StatCard label="Vehicles" value={overview?.totalVehicles ?? 0} sub="Monitored fleet" />
              <StatCard
                label="Avg Fleet Risk Score"
                value={overview?.avgPlatformRiskScore ?? 0}
                sub="Lower is better"
                color={avgScore < 30 ? "text-emerald-600" : avgScore < 55 ? "text-amber-600" : avgScore < 75 ? "text-orange-600" : "text-red-600"}
              />
            </>
          )}
        </div>

        {/* Second KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ovLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
          ) : (
            <>
              <StatCard label="Open FNOL / Claims" value={overview?.openAccidents ?? 0} sub="Pending TPA action" color="text-red-600" />
              <StatCard label="COIs Expiring" value={overview?.certificatesExpiringSoon ?? 0} sub="Need renewal" color="text-amber-600" />
              <StatCard label="Miles Monitored" value={(overview?.totalMilesMonitored ?? 0).toLocaleString()} sub="Real-time telematics" />
              <StatCard label="TCOR Exposure" value={`$${((overview?.premiumAtRisk ?? 0) / 1000).toFixed(0)}K`} sub="High/critical operators" color="text-orange-600" />
            </>
          )}
        </div>

        {/* Charts Row — Fuel Gauges + Telematics Activity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Fleet Risk Gauges (replaces pie chart) */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-semibold">Fleet Risk Gauges</div>
              {!distLoading && (
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">By Facility</span>
              )}
            </div>

            {/* Fleet health fuel gauge — overall risk score */}
            {ovLoading ? (
              <Skeleton className="h-24 mb-3" />
            ) : (
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                <div className="flex-shrink-0 w-28">
                  <FuelGauge
                    value={Math.round(avgScore)}
                    max={100}
                    label="Fleet Health"
                    color={avgScore < 30 ? "#10b981" : avgScore < 55 ? "#f59e0b" : avgScore < 75 ? "#f97316" : "#ef4444"}
                    sublabel="Avg risk score"
                  />
                </div>
                <div className="flex-1 text-xs text-slate-500 leading-relaxed">
                  <div className="font-semibold text-slate-700 mb-0.5">
                    {avgScore < 30 ? "Excellent" : avgScore < 55 ? "Moderate" : avgScore < 75 ? "Needs Attention" : "Critical"} Fleet Performance
                  </div>
                  Score 0–30 = preferred markets · 30–55 = standard · 55+ = substandard
                </div>
              </div>
            )}

            <RiskGauges distribution={distribution} loading={distLoading} />
          </div>

          {/* Telematics Activity — area chart */}
          <div className="bg-card border border-border rounded-lg p-4 md:col-span-2">
            <div className="text-sm font-semibold mb-3">Telematics Activity (Last 14 Days)</div>
            {actLoading ? <Skeleton className="h-40" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={activitySlice} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="evtGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={(v) => `Date: ${v}`} />
                  <Area type="monotone" dataKey="events" name="Events" stroke="#3b82f6" fill="url(#evtGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="trips" name="Trips" stroke="#10b981" fill="transparent" strokeWidth={1.5} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Accidents */}
          <div className="bg-card border border-border rounded-lg">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Recent Accident Alerts
              </div>
              <Link href="/accidents" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {accLoading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-3"><Skeleton className="h-8" /></div>)
              ) : accidents?.slice(0, 5).map((acc) => (
                <div key={acc.id} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{acc.driverName ?? "Unknown Driver"}</div>
                    <div className="text-xs text-muted-foreground truncate">{acc.facilityName} · {new Date(acc.alertedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <SeverityBadge severity={acc.severity} />
                    <AccidentStatusBadge status={acc.status} />
                  </div>
                </div>
              ))}
              {!accLoading && (accidents?.length ?? 0) === 0 && (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">No recent accidents</div>
              )}
            </div>
          </div>

          {/* Top Risk Drivers */}
          <div className="bg-card border border-border rounded-lg">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="text-sm font-semibold">Top Risk Drivers</div>
              <Link href="/drivers" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {drLoading ? (
                Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-3"><Skeleton className="h-8" /></div>)
              ) : topDrivers?.slice(0, 6).map((d) => (
                <Link
                  key={d.driverId}
                  href={`/drivers/${d.driverId}`}
                  className="px-4 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground">{d.driverName}</div>
                    <div className="text-xs text-muted-foreground truncate">{d.facilityName} · {d.topIssue}</div>
                  </div>
                  <RiskBadge score={d.riskScore} tier={d.riskTier} />
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
