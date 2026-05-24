import { Link } from "wouter";
import { AlertTriangle, ChevronRight } from "lucide-react";
import {
  useGetDashboardOverview, useGetRiskDistribution, useGetRecentAccidents,
  useGetTopRiskDrivers, useGetTelematicsActivity
} from "@workspace/api-client-react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, RiskBadge, StatCard } from "@/components/Layout";

const RISK_COLORS = { low: "#10b981", moderate: "#f59e0b", high: "#f97316", critical: "#ef4444" };

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
  return <span className={`text-xs px-1.5 py-0.5 rounded ${config[severity] ?? ""}`}>{labels[severity] ?? severity}</span>;
}

export default function Dashboard() {
  const { data: overview, isLoading: ovLoading } = useGetDashboardOverview();
  const { data: distribution, isLoading: distLoading } = useGetRiskDistribution();
  const { data: accidents, isLoading: accLoading } = useGetRecentAccidents();
  const { data: topDrivers, isLoading: drLoading } = useGetTopRiskDrivers();
  const { data: activity, isLoading: actLoading } = useGetTelematicsActivity();

  const activitySlice = activity?.slice(-14) ?? [];

  return (
    <div>
      <PageHeader title="Platform Dashboard" subtitle="Affinity Risk Solutions — AAA Towing Network Overview" />
      <div className="p-6 space-y-6">

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ovLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
          ) : (
            <>
              <StatCard label="AAA Clubs" value={overview?.totalClubs ?? 0} sub="Active regions" />
              <StatCard label="Facilities" value={overview?.totalFacilities ?? 0} sub={`${overview?.highRiskFacilities ?? 0} high risk`} />
              <StatCard label="Drivers" value={overview?.totalDrivers ?? 0} sub="Under telematics" />
              <StatCard label="Vehicles" value={overview?.totalVehicles ?? 0} sub="Monitored fleet" />
              <StatCard label="Avg Risk Score" value={overview?.avgPlatformRiskScore ?? 0} sub="Platform-wide" color={
                (overview?.avgPlatformRiskScore ?? 0) < 30 ? "text-emerald-600" :
                (overview?.avgPlatformRiskScore ?? 0) < 55 ? "text-amber-600" :
                (overview?.avgPlatformRiskScore ?? 0) < 75 ? "text-orange-600" : "text-red-600"
              } />
            </>
          )}
        </div>

        {/* Second KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ovLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
          ) : (
            <>
              <StatCard label="Open Accidents" value={overview?.openAccidents ?? 0} sub="Pending action" color="text-red-600" />
              <StatCard label="Certs Expiring" value={overview?.certificatesExpiringSoon ?? 0} sub="Need renewal" color="text-amber-600" />
              <StatCard label="Miles Monitored" value={(overview?.totalMilesMonitored ?? 0).toLocaleString()} sub="Fleet total" />
              <StatCard label="Premium at Risk" value={`$${((overview?.premiumAtRisk ?? 0) / 1000).toFixed(0)}K`} sub="High/critical facilities" color="text-orange-600" />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Risk Distribution */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-semibold mb-3">Risk Distribution</div>
            {distLoading ? <Skeleton className="h-40" /> : (
              <div>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={distribution} dataKey="count" nameKey="tier" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                      {distribution?.map((entry, i) => (
                        <Cell key={i} fill={RISK_COLORS[entry.tier as keyof typeof RISK_COLORS] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, name) => [`${v} facilities`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {distribution?.map((d) => (
                    <div key={d.tier} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: RISK_COLORS[d.tier as keyof typeof RISK_COLORS] }} />
                      <span className="capitalize text-muted-foreground">{d.tier}</span>
                      <span className="ml-auto font-semibold">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Telematics Activity */}
          <div className="bg-card border border-border rounded-lg p-4 md:col-span-2">
            <div className="text-sm font-semibold mb-3">Telematics Activity (Last 14 Days)</div>
            {actLoading ? <Skeleton className="h-40" /> : (
              <ResponsiveContainer width="100%" height={155}>
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
                    <div className="text-xs text-muted-foreground truncate">{acc.facilityName} • {new Date(acc.alertedAt).toLocaleDateString()}</div>
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
                    <div className="text-xs text-muted-foreground truncate">{d.facilityName} • {d.topIssue}</div>
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
