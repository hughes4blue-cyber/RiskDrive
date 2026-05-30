import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Trophy, Medal, Star, TrendingDown, Award, Zap, Shield } from "lucide-react";
import { PageHeader, RiskBar } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  rank: number;
  driverId: number;
  driverName: string;
  facilityName: string | null;
  riskScore: number;
  riskTier: string;
  safetyScore: number;
  totalMiles: number;
  completedModules: number;
  avgTrainingScore: number | null;
  badges: string[];
  status: string;
}

const BADGE_CFG: Record<string, { icon: React.ElementType; className: string }> = {
  "Safe Driver": { icon: Shield, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "Trained": { icon: Award, className: "bg-blue-50 text-blue-700 border-blue-200" },
  "Top Performer": { icon: Trophy, className: "bg-amber-50 text-amber-700 border-amber-200" },
  "High Mileage": { icon: Zap, className: "bg-purple-50 text-purple-700 border-purple-200" },
};

const TIER_CFG: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  moderate: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-amber-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">#{rank}</span>;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [tierFilter, setTierFilter] = useState("all");
  const [view, setView] = useState<"safety" | "training">("safety");

  useEffect(() => {
    fetch("/api/leaderboard").then(r => r.json()).then(setEntries);
  }, []);

  const filtered = entries?.filter(e => tierFilter === "all" || e.riskTier === tierFilter) ?? [];
  const sorted = view === "safety"
    ? [...filtered].sort((a, b) => b.safetyScore - a.safetyScore)
    : [...filtered].sort((a, b) => (b.avgTrainingScore ?? 0) - (a.avgTrainingScore ?? 0));

  const top3 = entries ? [...entries].sort((a, b) => b.safetyScore - a.safetyScore).slice(0, 3) : [];

  return (
    <div>
      <PageHeader
        title="Driver Safety Leaderboard"
        subtitle="Fleet-wide safety ranking driven by telematics scores, risk tiers, and training completion"
      />
      <div className="p-6 space-y-6">

        {/* Podium */}
        {entries && top3.length >= 3 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-6">
            <div className="text-sm font-semibold text-amber-800 mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Top Performers This Period
            </div>
            <div className="flex items-end justify-center gap-4">
              {/* 2nd */}
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-2">
                  <Medal className="w-7 h-7 text-slate-500" />
                </div>
                <Link href={`/drivers/${top3[1].driverId}`} className="text-sm font-semibold hover:underline block">{top3[1].driverName}</Link>
                <div className="text-xs text-muted-foreground">{top3[1].facilityName}</div>
                <div className="text-lg font-bold text-slate-600 mt-1">{top3[1].safetyScore}<span className="text-xs font-normal">/100</span></div>
                <div className="h-12 bg-slate-200 rounded-t-md w-16 mx-auto mt-2" />
              </div>
              {/* 1st */}
              <div className="text-center -translate-y-3">
                <div className="w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center mx-auto mb-2 ring-2 ring-amber-400">
                  <Trophy className="w-8 h-8 text-amber-600" />
                </div>
                <Link href={`/drivers/${top3[0].driverId}`} className="text-sm font-semibold hover:underline block">{top3[0].driverName}</Link>
                <div className="text-xs text-muted-foreground">{top3[0].facilityName}</div>
                <div className="text-xl font-bold text-amber-600 mt-1">{top3[0].safetyScore}<span className="text-xs font-normal">/100</span></div>
                <div className="h-16 bg-amber-300 rounded-t-md w-16 mx-auto mt-2" />
              </div>
              {/* 3rd */}
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
                  <Medal className="w-7 h-7 text-amber-700" />
                </div>
                <Link href={`/drivers/${top3[2].driverId}`} className="text-sm font-semibold hover:underline block">{top3[2].driverName}</Link>
                <div className="text-xs text-muted-foreground">{top3[2].facilityName}</div>
                <div className="text-lg font-bold text-amber-700 mt-1">{top3[2].safetyScore}<span className="text-xs font-normal">/100</span></div>
                <div className="h-8 bg-amber-200 rounded-t-md w-16 mx-auto mt-2" />
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <div className="flex bg-muted rounded-md p-0.5">
              <button onClick={() => setView("safety")} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${view === "safety" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>Safety Score</button>
              <button onClick={() => setView("training")} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${view === "training" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>Training Score</button>
            </div>
          </div>
          <div className="flex gap-2">
            {["all", "low", "moderate", "high", "critical"].map(t => (
              <button key={t} onClick={() => setTierFilter(t)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${tierFilter === t ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border"}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-12">Rank</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Driver</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Facility</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Risk Tier</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-36">Safety Score</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Training</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Miles</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Badges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!entries
                ? Array.from({ length: 8 }).map((_, i) => <tr key={i}><td colSpan={8} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>)
                : sorted.map((e, i) => {
                  const displayRank = i + 1;
                  return (
                    <tr key={e.driverId} className={`hover:bg-muted/30 transition-colors ${displayRank <= 3 ? "bg-amber-50/30" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <RankMedal rank={displayRank} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/drivers/${e.driverId}`} className="font-semibold text-primary hover:underline">{e.driverName}</Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{e.facilityName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${TIER_CFG[e.riskTier] ?? ""}`}>{e.riskTier}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className={`h-1.5 rounded-full overflow-hidden bg-muted`}>
                              <div className={`h-full rounded-full ${e.safetyScore >= 70 ? "bg-emerald-500" : e.safetyScore >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${e.safetyScore}%` }} />
                            </div>
                          </div>
                          <span className="text-xs font-bold w-8 text-right">{e.safetyScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-xs font-medium">{e.completedModules} modules</span>
                          {e.avgTrainingScore !== null && (
                            <span className="text-xs text-muted-foreground">· avg {Math.round(e.avgTrainingScore)}/100</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{(e.totalMiles / 1000).toFixed(1)}k mi</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {e.badges.map(b => {
                            const cfg = BADGE_CFG[b];
                            const Icon = cfg?.icon ?? Star;
                            return (
                              <span key={b} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${cfg?.className ?? "bg-gray-50 text-gray-700 border-gray-200"}`}>
                                <Icon className="w-2.5 h-2.5" />{b}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
