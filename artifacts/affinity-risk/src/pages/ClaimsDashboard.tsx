import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Scale, AlertCircle, CheckCircle2, Clock, ChevronRight, Gavel, FileSearch } from "lucide-react";
import { PageHeader } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Claim {
  id: number;
  accidentId: number | null;
  facilityId: number;
  facilityName: string | null;
  clubName: string | null;
  driverId: number | null;
  driverName: string | null;
  claimNumber: string;
  tpaName: string;
  status: string;
  severity: string;
  description: string | null;
  exonerationStatus: string | null;
  settlementAmount: number | null;
  reserveAmount: number | null;
  isLitigated: boolean;
  adjusterName: string | null;
  fnolReceivedAt: string;
  assignedAt: string | null;
  investigationStartedAt: string | null;
  adjudicatedAt: string | null;
  closedAt: string | null;
}

interface Summary {
  total: number;
  open: number;
  litigated: number;
  exonerated: number;
  exonerationRate: number;
  totalReserve: number;
  totalSettled: number;
}

const STEPS = [
  { key: "fnol_received", label: "FNOL Received", icon: FileSearch },
  { key: "assigned", label: "Assigned", icon: ChevronRight },
  { key: "under_investigation", label: "Investigation", icon: Clock },
  { key: "adjudication", label: "Adjudication", icon: Scale },
  { key: "closed", label: "Closed", icon: CheckCircle2 },
];

const STATUS_CFG: Record<string, { label: string; className: string }> = {
  fnol_received: { label: "FNOL Received", className: "bg-blue-100 text-blue-800 border-blue-200" },
  assigned: { label: "Assigned", className: "bg-purple-100 text-purple-800 border-purple-200" },
  under_investigation: { label: "Under Investigation", className: "bg-amber-100 text-amber-800 border-amber-200" },
  adjudication: { label: "Adjudication", className: "bg-orange-100 text-orange-800 border-orange-200" },
  closed: { label: "Closed", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

const SEV_CFG: Record<string, string> = {
  minor: "bg-slate-100 text-slate-700 border-slate-200",
  moderate: "bg-amber-100 text-amber-800 border-amber-200",
  major: "bg-orange-100 text-orange-800 border-orange-200",
  total_loss: "bg-red-100 text-red-800 border-red-200",
};

const EXON_CFG: Record<string, string> = {
  exonerated: "text-emerald-700 bg-emerald-50 border-emerald-200",
  partial: "text-amber-700 bg-amber-50 border-amber-200",
  not_exonerated: "text-red-700 bg-red-50 border-red-200",
  pending: "text-gray-600 bg-gray-50 border-gray-200",
};

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

function ClaimStepper({ status }: { status: string }) {
  const idx = STEPS.findIndex(s => s.key === status);
  return (
    <div className="flex items-center gap-0.5">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className={`w-2 h-2 rounded-full ${i < idx ? "bg-emerald-500" : i === idx ? "bg-primary" : "bg-muted-foreground/25"}`} />
          {i < STEPS.length - 1 && <div className={`w-4 h-px ${i < idx ? "bg-emerald-400" : "bg-muted-foreground/20"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function ClaimsDashboard() {
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [advancing, setAdvancing] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch("/api/claims").then(r => r.json()),
      fetch("/api/claims/summary").then(r => r.json()),
    ]).then(([c, s]) => { setClaims(c); setSummary(s); });
  }, []);

  const filtered = claims?.filter(c => statusFilter === "all" || c.status === statusFilter) ?? [];

  async function advance(id: number) {
    setAdvancing(id);
    const res = await fetch(`/api/claims/${id}/advance`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exonerationStatus: "exonerated" }) });
    if (res.ok) {
      const updated = await res.json();
      setClaims(prev => prev?.map(c => c.id === id ? updated : c) ?? null);
      const [s] = await Promise.all([fetch("/api/claims/summary").then(r => r.json())]);
      setSummary(s);
      toast({ title: "Claim advanced", description: `Status: ${updated.status}` });
    }
    setAdvancing(null);
  }

  return (
    <div>
      <PageHeader
        title="Claims TPA Dashboard"
        subtitle="FNOL receipt through adjudication and closure — powered by telematics data for faster exoneration"
      />
      <div className="p-6 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {[
            { label: "Total Claims", value: summary?.total ?? "—", color: "" },
            { label: "Open", value: summary?.open ?? "—", color: "text-amber-600" },
            { label: "Litigated", value: summary?.litigated ?? "—", color: "text-red-600" },
            { label: "Exonerated", value: summary?.exonerated ?? "—", color: "text-emerald-600" },
            { label: "Exoneration Rate", value: summary ? `${summary.exonerationRate}%` : "—", color: "text-primary" },
            { label: "Total Reserve", value: summary ? fmt(summary.totalReserve) : "—", color: "" },
            { label: "Total Settled", value: summary ? fmt(summary.totalSettled) : "—", color: "" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-3">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">{s.label}</div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Pipeline view */}
        <div>
          <div className="text-sm font-semibold mb-3">Claims Pipeline</div>
          <div className="grid grid-cols-5 gap-3">
            {STEPS.map(step => {
              const items = claims?.filter(c => c.status === step.key) ?? [];
              const cfg = STATUS_CFG[step.key];
              return (
                <div key={step.key} className="space-y-2">
                  <div className={`px-2 py-1 rounded text-xs font-semibold border text-center ${cfg.className}`}>
                    {step.label} <span className="opacity-70">({items.length})</span>
                  </div>
                  {items.length === 0
                    ? <div className="border border-dashed border-border rounded-lg p-3 text-center text-xs text-muted-foreground">None</div>
                    : items.map(c => (
                      <div key={c.id} className="bg-card border border-border rounded-lg p-3 space-y-1.5">
                        <div className="font-mono text-[10px] text-primary font-semibold">{c.claimNumber}</div>
                        <div className="text-xs font-medium leading-snug">{c.facilityName}</div>
                        {c.driverName && <div className="text-[10px] text-muted-foreground">{c.driverName}</div>}
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${SEV_CFG[c.severity] ?? ""}`}>{c.severity.replace("_", " ")}</span>
                        {c.isLitigated && <div className="flex items-center gap-0.5 text-[10px] text-red-600 font-semibold"><Gavel className="w-2.5 h-2.5" /> Litigated</div>}
                        <ClaimStepper status={c.status} />
                        {c.status !== "closed" && (
                          <Button size="sm" variant="outline" className="w-full text-[10px] h-6" disabled={advancing === c.id} onClick={() => advance(c.id)}>
                            {advancing === c.id ? "..." : "Advance →"}
                          </Button>
                        )}
                        {c.exonerationStatus && c.status === "closed" && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border capitalize ${EXON_CFG[c.exonerationStatus] ?? ""}`}>
                            {c.exonerationStatus.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Claims table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">All Claims</div>
            <div className="flex gap-2">
              {["all", ...STEPS.map(s => s.key)].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${statusFilter === s ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>
                  {s === "all" ? "All" : STATUS_CFG[s]?.label ?? s}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {["Claim #", "Facility", "Driver", "Severity", "Status", "Pipeline", "Reserve", "Exoneration", "FNOL Date", ""].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!claims
                  ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={10} className="px-3 py-3"><Skeleton className="h-4 w-full" /></td></tr>)
                  : filtered.map(c => {
                    const cfg = STATUS_CFG[c.status] ?? STATUS_CFG.fnol_received;
                    return (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-3 font-mono text-xs font-semibold text-primary">{c.claimNumber}</td>
                        <td className="px-3 py-3">
                          <Link href={`/facilities/${c.facilityId}`} className="text-primary hover:underline font-medium text-xs">{c.facilityName}</Link>
                          <div className="text-[10px] text-muted-foreground">{c.clubName}</div>
                        </td>
                        <td className="px-3 py-3 text-xs">{c.driverName ?? "—"}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${SEV_CFG[c.severity] ?? ""}`}>{c.severity.replace("_", " ")}</span>
                          {c.isLitigated && <div className="flex items-center gap-0.5 text-[10px] text-red-600 mt-0.5"><Gavel className="w-2.5 h-2.5" /> Litigated</div>}
                        </td>
                        <td className="px-3 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}>{cfg.label}</span></td>
                        <td className="px-3 py-3"><ClaimStepper status={c.status} /></td>
                        <td className="px-3 py-3 text-xs font-medium">{c.reserveAmount ? fmt(c.reserveAmount) : "—"}</td>
                        <td className="px-3 py-3">
                          {c.exonerationStatus
                            ? <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${EXON_CFG[c.exonerationStatus] ?? ""}`}>{c.exonerationStatus.replace("_", " ")}</span>
                            : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">{new Date(c.fnolReceivedAt).toLocaleDateString()}</td>
                        <td className="px-3 py-3">
                          {c.status !== "closed" && (
                            <Button size="sm" variant="outline" className="text-xs h-7" disabled={advancing === c.id} onClick={() => advance(c.id)}>
                              {advancing === c.id ? "..." : "Advance"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
