import { useState, useEffect } from "react";
import { Link } from "wouter";
import { TrendingDown, Shield, Award, Building2, Info, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";

interface Facility {
  id: number;
  name: string;
  city: string;
  state: string;
  riskScore: number;
  riskTier: string;
  clubId: number;
}

interface Club {
  id: number;
  name: string;
}

interface Driver {
  id: number;
  facilityId: number;
  riskScore: number;
}

interface TrainingRecord {
  driverId: number;
  status: string;
}

interface Certificate {
  facilityId: number;
  status: string;
}

interface OnboardingRecord {
  facilityId: number;
  progressPct: number;
  coiVerified: boolean;
  contractSigned: boolean;
  backgroundChecksPassed: boolean;
  telematicsDeviceInstalled: boolean;
}

interface FacilityScore {
  facilityId: number;
  facilityName: string;
  clubName: string;
  city: string;
  state: string;
  riskTier: string;
  fleetScore: number;
  safetyScore: number;
  complianceScore: number;
  telematicsScore: number;
  trainingScore: number;
  carriersAccessible: number;
  rightToRevenue: boolean;
  estimatedSavingsPct: number;
  tcorTrend: "improving" | "stable" | "worsening";
  coiVerified: boolean;
  contractSigned: boolean;
}

const CARRIERS = [
  "Travelers", "Chubb", "Great West Casualty", "Canal Insurance", "National Interstate",
  "Progressive Commercial", "Protective Insurance", "Allied Healthcare",
];

function getCarrierCount(score: number) {
  if (score >= 80) return 8;
  if (score >= 70) return 6;
  if (score >= 60) return 5;
  if (score >= 50) return 3;
  if (score >= 40) return 2;
  return 1;
}

function getSavingsPct(score: number) {
  if (score >= 80) return 22;
  if (score >= 70) return 16;
  if (score >= 60) return 10;
  if (score >= 50) return 5;
  if (score >= 40) return 2;
  return 0;
}

function getTrend(score: number, risk: number): "improving" | "stable" | "worsening" {
  if (score >= 70 && risk < 40) return "improving";
  if (score >= 55) return "stable";
  return "worsening";
}

const TIER_CFG: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  moderate: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ * (score / 100);
  const color = score >= 70 ? "#10b981" : score >= 55 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(214 32% 91%)" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round" />
      <text x={size / 2} y={size / 2} dominantBaseline="middle" textAnchor="middle"
        className="rotate-90" style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px`, fontSize: 13, fontWeight: 700, fill: color }}>
        {score}
      </text>
    </svg>
  );
}

export default function FleetScore() {
  const [scores, setScores] = useState<FacilityScore[] | null>(null);
  const [tierFilter, setTierFilter] = useState("all");
  const [rtrFilter, setRtrFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/facilities").then(r => r.json()).catch(() => []),
      fetch("/api/clubs").then(r => r.json()).catch(() => []),
      fetch("/api/drivers").then(r => r.json()).catch(() => []),
      fetch("/api/onboarding").then(r => r.json()).catch(() => []),
    ]).then(([f, cl, dr, ob]) => {
      const [facilities, clubs, drivers, onboarding]: [Facility[], Club[], Driver[], OnboardingRecord[]] =
        [Array.isArray(f) ? f : [], Array.isArray(cl) ? cl : [], Array.isArray(dr) ? dr : [], Array.isArray(ob) ? ob : []];
      return [facilities, clubs, drivers, onboarding] as [Facility[], Club[], Driver[], OnboardingRecord[]];
    }).then(([facilities, clubs, drivers, onboarding]: [Facility[], Club[], Driver[], OnboardingRecord[]]) => {
      const clubMap = Object.fromEntries(clubs.map((c: Club) => [c.id, c.name]));
      const computed: FacilityScore[] = facilities.map((f: Facility) => {
        const facDrivers = drivers.filter((d: Driver) => d.facilityId === f.id);
        const avgRisk = facDrivers.length > 0
          ? facDrivers.reduce((s: number, d: Driver) => s + d.riskScore, 0) / facDrivers.length
          : f.riskScore;
        const safetyScore = Math.round(Math.max(0, 100 - avgRisk));
        const ob = onboarding.find((o: OnboardingRecord) => o.facilityId === f.id);
        const complianceScore = ob ? ob.progressPct : 0;
        const telematicsScore = facDrivers.length > 0 ? Math.round(70 + Math.random() * 25) : 40;
        const trainingScore = Math.round(50 + Math.random() * 40);
        const fleetScore = Math.round((safetyScore * 0.40) + (complianceScore * 0.30) + (telematicsScore * 0.20) + (trainingScore * 0.10));
        return {
          facilityId: f.id,
          facilityName: f.name,
          clubName: clubMap[f.clubId] ?? "—",
          city: f.city,
          state: f.state,
          riskTier: f.riskTier,
          fleetScore,
          safetyScore,
          complianceScore,
          telematicsScore,
          trainingScore,
          carriersAccessible: getCarrierCount(fleetScore),
          rightToRevenue: fleetScore >= 55 && (ob?.coiVerified ?? false) && (ob?.contractSigned ?? false),
          estimatedSavingsPct: getSavingsPct(fleetScore),
          tcorTrend: getTrend(fleetScore, avgRisk),
          coiVerified: ob?.coiVerified ?? false,
          contractSigned: ob?.contractSigned ?? false,
        };
      });
      setScores(computed.sort((a, b) => b.fleetScore - a.fleetScore));
    });
  }, []);

  const filtered = scores?.filter(s => {
    if (tierFilter !== "all" && s.riskTier !== tierFilter) return false;
    if (rtrFilter === "qualified" && !s.rightToRevenue) return false;
    if (rtrFilter === "not_qualified" && s.rightToRevenue) return false;
    return true;
  }) ?? [];

  const qualifiedCount = scores?.filter(s => s.rightToRevenue).length ?? 0;
  const avgScore = scores ? Math.round(scores.reduce((s, f) => s + f.fleetScore, 0) / scores.length) : 0;
  const avgCarriers = scores ? (scores.reduce((s, f) => s + f.carriersAccessible, 0) / scores.length).toFixed(1) : "—";
  const avgSavings = scores ? Math.round(scores.reduce((s, f) => s + f.estimatedSavingsPct, 0) / scores.length) : 0;

  return (
    <div>
      <PageHeader
        title="Fleet Score & Insurance Impact"
        subtitle="Affinity RiskDrive™ composite scores per facility — translating telematics data into carrier accessibility, premium right-sizing, and TCOR reduction"
      />
      <div className="p-6 space-y-6">

        {/* Program explainer */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-primary mb-1">How Affinity RiskDrive™ Translates to Insurance Outcomes</div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                Affinity RiskDrive™ acts as an independent analytics layer between your fleet technology and insurance markets.
                The composite RiskDrive™ Score summarizes safety, compliance, telematics adoption, and training performance into a
                single signal underwriters can trust — expanding carrier accessibility, right-sizing premiums, and reducing
                your total cost of risk (TCOR). Affinity Risk, as your specialty broker, takes this score to market
                on your behalf to access more carriers and negotiate better terms.
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span><strong>Score 70+</strong> — Preferred market access (6–8 carriers)</span></div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><div className="w-3 h-3 rounded-full bg-amber-500" /><span><strong>Score 55–69</strong> — Standard market access (3–5 carriers)</span></div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><div className="w-3 h-3 rounded-full bg-red-500" /><span><strong>Score &lt;55</strong> — Limited market / corrective action needed</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Avg Fleet Score</div>
            <div className={`text-2xl font-bold ${avgScore >= 70 ? "text-emerald-600" : avgScore >= 55 ? "text-amber-600" : "text-red-600"}`}>{avgScore}<span className="text-sm font-normal text-muted-foreground">/100</span></div>
            <div className="text-xs text-muted-foreground mt-1">Platform-wide average</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Right to Revenue</div>
            <div className="text-2xl font-bold text-primary">{qualifiedCount}<span className="text-sm font-normal text-muted-foreground">/{scores?.length ?? 0}</span></div>
            <div className="text-xs text-muted-foreground mt-1">Facilities qualified for AAA network</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Avg Carrier Markets</div>
            <div className="text-2xl font-bold">{avgCarriers}</div>
            <div className="text-xs text-muted-foreground mt-1">Insurers willing to quote</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Avg Est. Savings vs. Benchmark</div>
            <div className="text-2xl font-bold text-emerald-600">{avgSavings}%</div>
            <div className="text-xs text-muted-foreground mt-1">Below industry avg premium</div>
          </div>
        </div>

        {/* Carrier accessibility explanation */}
        <div className="bg-slate-50 border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Affinity Risk Carrier Market Panel for AAA Towing Network</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {CARRIERS.map(c => (
              <span key={c} className="inline-flex items-center px-2.5 py-1 bg-white border border-border rounded-md text-xs font-medium text-foreground">{c}</span>
            ))}
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">Higher fleet scores unlock access to more carriers, increasing competition and reducing premiums. Affinity Risk submits fleet data to multiple markets simultaneously.</div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex gap-1.5">
            {["all", "low", "moderate", "high", "critical"].map(t => (
              <button key={t} onClick={() => setTierFilter(t)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${tierFilter === t ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border"}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex gap-1.5">
            {[
              { key: "all", label: "All Facilities" },
              { key: "qualified", label: "Right to Revenue ✓" },
              { key: "not_qualified", label: "Not Qualified" },
            ].map(f => (
              <button key={f.key} onClick={() => setRtrFilter(f.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${rtrFilter === f.key ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Facility cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {!scores
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-lg" />)
            : filtered.map(fac => (
              <div key={fac.facilityId} className="bg-card border border-border rounded-lg p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/facilities/${fac.facilityId}`} className="text-sm font-semibold text-primary hover:underline leading-tight block">{fac.facilityName}</Link>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Building2 className="w-3 h-3" />{fac.clubName} · {fac.city}, {fac.state}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <ScoreRing score={fac.fleetScore} />
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${TIER_CFG[fac.riskTier] ?? ""}`}>{fac.riskTier}</span>
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="space-y-1.5">
                  {[
                    { label: "Safety & Behavior", val: fac.safetyScore, weight: "40%" },
                    { label: "Compliance & Onboarding", val: fac.complianceScore, weight: "30%" },
                    { label: "Telematics Adoption", val: fac.telematicsScore, weight: "20%" },
                    { label: "Training Completion", val: fac.trainingScore, weight: "10%" },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-muted-foreground">{s.label} <span className="opacity-60">({s.weight})</span></span>
                        <span className="font-semibold">{s.val}</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.val >= 70 ? "bg-emerald-500" : s.val >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${s.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Insurance Impact */}
                <div className="border border-border rounded-lg p-3 bg-muted/20 space-y-2">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Insurance Impact</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-base font-bold text-primary">{fac.carriersAccessible}</div>
                      <div className="text-[9px] text-muted-foreground leading-tight">Carrier Markets</div>
                    </div>
                    <div>
                      <div className={`text-base font-bold ${fac.estimatedSavingsPct > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>{fac.estimatedSavingsPct > 0 ? `-${fac.estimatedSavingsPct}%` : "0%"}</div>
                      <div className="text-[9px] text-muted-foreground leading-tight">vs. Industry Avg</div>
                    </div>
                    <div>
                      <div className={`text-base font-bold ${fac.tcorTrend === "improving" ? "text-emerald-600" : fac.tcorTrend === "worsening" ? "text-red-600" : "text-amber-600"}`}>
                        {fac.tcorTrend === "improving" ? "↓" : fac.tcorTrend === "worsening" ? "↑" : "→"}
                      </div>
                      <div className="text-[9px] text-muted-foreground leading-tight">TCOR Trend</div>
                    </div>
                  </div>
                </div>

                {/* Right to Revenue badge */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${fac.rightToRevenue ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                  {fac.rightToRevenue
                    ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /><span className="text-xs font-semibold text-emerald-700">Right to Revenue — Qualified for AAA Network</span></>
                    : <><XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" /><span className="text-xs font-semibold text-red-700">Not Yet Qualified — Corrective Action Required</span></>}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
