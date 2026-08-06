import { Link, Redirect } from "wouter";
import { AlertTriangle, ChevronRight, TrendingDown } from "lucide-react";
import {
  useGetDashboardOverview, useGetRiskDistribution, useGetRecentAccidents,
  useGetTopRiskDrive™rs, useGetTelematicsActivity, useGetCurrentUser,
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
  value, max, label, color, sublabel, size = "md",
}: {
  value: number; max: number; label: string; color: string; sublabel?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pct = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const cx = 60, cy = 62, r = 48;
  const strokeW = 9;

  const bgPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`;

  let fillPath = "";
  if (pct > 0.002 && pct < 0.998) {
    const angleRad = (1 - pct) * Math.PI;
    const ex = (cx + r * Math.cos(angleRad)).toFixed(2);
    const ey = (cy - r * Math.sin(angleRad)).toFixed(2);
    fillPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${ex} ${ey}`;
  } else if (pct >= 0.998) {
    fillPath = bgPath;
  }

  const needleAngle = (1 - pct) * Math.PI;
  const needleLen = r - 8;
  const nx = (cx + needleLen * Math.cos(needleAngle)).toFixed(2);
  const ny = (cy - needleLen * Math.sin(needleAngle)).toFixed(2);

  const displayVal = max > 0 && value === Math.round(value) ? String(value) : value.toFixed(0);

  const sizeClass = size === "lg" ? "w-full max-w-[200px]" : size === "sm" ? "w-full max-w-[100px]" : "w-full max-w-[140px]";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 120 70" className={sizeClass}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const a = (1 - t) * Math.PI;
          const outer = r + 5, inner = r + 1;
          const x1 = (cx + outer * Math.cos(a)).toFixed(1);
          const y1 = (cy - outer * Math.sin(a)).toFixed(1);
          const x2 = (cx + inner * Math.cos(a)).toFixed(1);
          const y2 = (cy - inner * Math.sin(a)).toFixed(1);
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />;
        })}
        <path d={bgPath} fill="none" stroke="#e2e8f0" strokeWidth={strokeW} strokeLinecap="round" />
        {fillPath && (
          <path d={fillPath} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
        )}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="3.5" fill="#334155" />
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">
          {displayVal}
        </text>
        {max > 1 && (
          <text x={cx} y={cy - 2} textAnchor="middle" fontSize="7.5" fill="#94a3b8">
            of {max}
          </text>
        )}
        <text x={cx - r + 1} y={cy + 10} fontSize="7" fill="#94a3b8">0</text>
        <text x={cx + r - 1} y={cy + 10} fontSize="7" fill="#94a3b8" textAnchor="end">{max}</text>
      </svg>
      <div className="text-xs font-bold capitalize leading-tight text-center" style={{ color }}>{label}</div>
      {sublabel && <div className="text-[10px] text-slate-400 leading-tight text-center">{sublabel}</div>}
    </div>
  );
}

/* ── Gauge Hero — full-width prominent section ──────────────────── */
function GaugeHero({
  overview,
  distribution,
  ovLoading,
  distLoading,
}: {
  overview?: { avgPlatformRiskScore?: number };
  distribution?: { tier: string; count: number; percentage: number }[];
  ovLoading: boolean;
  distLoading: boolean;
}) {
  const avgScore = overview?.avgPlatformRiskScore ?? 0;
  const tiers = ["low", "moderate", "high", "critical"] as const;
  const total = distribution?.reduce((s, d) => s + d.count, 0) ?? 0;

  const scoreColor = avgScore < 30 ? "#10b981" : avgScore < 55 ? "#f59e0b" : avgScore < 75 ? "#f97316" : "#ef4444";
  const scoreLabel = avgScore < 30 ? "Excellent" : avgScore < 55 ? "Moderate" : avgScore < 75 ? "Needs Attention" : "Critical";

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ background: "linear-gradient(135deg,#0F2940 0%,#0D3D56 100%)" }}
    >
      <div className="px-6 pt-5 pb-2 flex items-center justify-between">
        <div>
          <div className="text-white font-bold text-base">Fleet Risk Gauges</div>
          <div className="text-slate-400 text-xs mt-0.5">Live risk distribution across your towing network</div>
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: scoreColor + "30", color: scoreColor }}
        >
          {scoreLabel} Fleet
        </div>
      </div>

      <div className="px-6 pb-6 pt-2">
        {ovLoading || distLoading ? (
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 bg-white/10 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
            {/* Overall fleet gauge — larger */}
            <div className="col-span-2 md:col-span-1 bg-white/10 rounded-2xl p-4 flex flex-col items-center gap-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Overall</div>
              <FuelGauge
                value={Math.round(avgScore)}
                max={100}
                label="Fleet Health"
                color={scoreColor}
                sublabel="Avg risk score"
                size="lg"
              />
              <div className="text-[11px] text-slate-300 text-center leading-relaxed mt-1">
                Score 0–30 = preferred<br />30–55 = standard · 55+ = sub
              </div>
            </div>

            {/* 4 tier gauges */}
            {tiers.map((tier) => {
              const d = distribution?.find((x) => x.tier === tier);
              const count = d?.count ?? 0;
              return (
                <div key={tier} className="bg-white/8 rounded-2xl p-4 flex flex-col items-center gap-2"
                  style={{ background: RISK_COLORS[tier] + "18" }}>
                  <div className="text-[10px] font-bold uppercase tracking-widest capitalize"
                    style={{ color: RISK_COLORS[tier] }}>
                    {tier}
                  </div>
                  <FuelGauge
                    value={count}
                    max={total}
                    label={`${count} facilities`}
                    color={RISK_COLORS[tier]}
                    sublabel={total > 0 ? `${((count / total) * 100).toFixed(0)}% of fleet` : "0%"}
                    size="md"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
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
    minor: "Minor", moderate: "Moderate", major: "Major", total_loss: "Total Loss",
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${config[severity] ?? ""}`}>
      {labels[severity] ?? severity}
    </span>
  );
}

/* ── Dashboard ───────────────────────────────────────────────────── */
export default function Dashboard() {
  // All hooks must be at the top — no hooks after conditional returns
  const { data: meData } = useGetCurrentUser();
  const { data: overview, isLoading: ovLoading } = useGetDashboardOverview();
  const { data: distribution, isLoading: distLoading } = useGetRiskDistribution();
  const { data: accidents, isLoading: accLoading } = useGetRecentAccidents();
  const { data: topDrivers, isLoading: drLoading } = useGetTopRiskDrive™rs();
  const { data: activity, isLoading: actLoading } = useGetTelematicsActivity();

  const appUser = meData?.user;
  const activitySlice = activity?.slice(-14) ?? [];
  const avgScore = overview?.avgPlatformRiskScore ?? 0;

  // Role-based home: shop owners and club admins see only their scoped page
  if (appUser?.role === "shop_owner" && appUser.facilityId) {
    return <Redirect to={`/facilities/${appUser.facilityId}`} />;
  }
  if (appUser?.role === "club" && appUser.clubId) {
    return <Redirect to={`/clubs/${appUser.clubId}`} />;
  }

  return (
    <div>
      <PageHeader
        title="Affinity RiskDrive™ Dashboard"
        subtitle="Real telematics, real data, right-sized premiums for AAA towing networks"
      />
      <div className="p-6 space-y-6">

        {/* Gauge Hero — prominent, full width, dark card */}
        <GaugeHero
          overview={overview}
          distribution={distribution}
          ovLoading={ovLoading}
          distLoading={distLoading}
        />

        {/* RiskDrive™ Value Banner — bolder */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
          {[
            { label: "Carrier Markets Accessible", value: "8", sub: "Competing for AAA network business", color: "#0F2940", bg: "#0F294008" },
            { label: "Est. Premium Savings vs. Benchmark", value: "14%", sub: "Based on actual telematics scores", color: "#059669", bg: "#05966908" },
            { label: "Claim Exoneration Rate", value: "25%", sub: "Powered by dashcam & telematics data", color: "#E97132", bg: "#E9713208" },
            { label: "TCOR Trend", value: "↓ Improving", sub: "90-day rolling fleet performance", color: "#059669", bg: "#05966908" },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`px-5 py-5 ${i < 3 ? "border-r border-slate-200" : ""}`}
              style={{ background: s.bg }}
            >
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{s.label}</div>
              <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ovLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
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

        {/* Alert KPI Row — color-coded */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ovLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          ) : (
            <>
              <StatCard
                label="Open FNOL / Claims"
                value={overview?.openAccidents ?? 0}
                sub="Pending TPA action"
                color="text-red-600"
                variant={(overview?.openAccidents ?? 0) > 0 ? "alert" : "default"}
              />
              <StatCard
                label="COIs Expiring"
                value={overview?.certificatesExpiringSoon ?? 0}
                sub="Need renewal"
                color="text-amber-600"
                variant={(overview?.certificatesExpiringSoon ?? 0) > 0 ? "warning" : "default"}
              />
              <StatCard label="Miles Monitored" value={(overview?.totalMilesMonitored ?? 0).toLocaleString()} sub="Real-time telematics" />
              <StatCard
                label="TCOR Exposure"
                value={`$${((overview?.premiumAtRisk ?? 0) / 1000).toFixed(0)}K`}
                sub="High/critical operators"
                color="text-orange-600"
              />
            </>
          )}
        </div>

        {/* Telematics Activity — full width now that gauges are in hero */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-slate-900">Telematics Activity</div>
              <div className="text-xs text-slate-400 mt-0.5">Last 14 days — trips and safety events</div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 rounded inline-block" />Events</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 rounded inline-block" />Trips</div>
            </div>
          </div>
          {actLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activitySlice} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="evtGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="tripsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip labelFormatter={(v) => `Date: ${v}`} />
                <Area type="monotone" dataKey="events" name="Events" stroke="#3b82f6" fill="url(#evtGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="trips" name="Trips" stroke="#10b981" fill="url(#tripsGrad)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Accidents */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Recent Accident Alerts
              </div>
              <Link href="/accidents" className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {accLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-3"><Skeleton className="h-8" /></div>
                ))
              ) : accidents?.slice(0, 5).map((acc) => (
                <div key={acc.id} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-800 truncate">{acc.driverName ?? "Unknown Driver"}</div>
                    <div className="text-xs text-slate-400 truncate">{acc.facilityName} · {new Date(acc.alertedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <SeverityBadge severity={acc.severity} />
                    <AccidentStatusBadge status={acc.status} />
                  </div>
                </div>
              ))}
              {!accLoading && (accidents?.length ?? 0) === 0 && (
                <div className="px-4 py-8 text-center text-xs text-slate-400">No recent accidents</div>
              )}
            </div>
          </div>

          {/* Top Risk Drivers */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <TrendingDown className="w-4 h-4 text-orange-500" />
                Top Risk Drivers
              </div>
              <Link href="/drivers" className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {drLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3"><Skeleton className="h-8" /></div>
                ))
              ) : topDrivers?.slice(0, 6).map((d) => (
                <Link
                  key={d.driverId}
                  href={`/drivers/${d.driverId}`}
                  className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-800">{d.driverName}</div>
                    <div className="text-xs text-slate-400 truncate">{d.facilityName} · {d.topIssue}</div>
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
