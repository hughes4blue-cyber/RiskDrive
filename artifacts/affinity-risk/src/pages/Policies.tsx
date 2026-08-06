import { useState, useEffect } from "react";
import { Link } from "wouter";
import { FileText, ChevronRight, Building2, CheckCircle2, Clock, AlertCircle, Plus, Shield } from "lucide-react";
import { PageHeader } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Submission {
  id: number;
  facilityId: number;
  facilityName: string | null;
  clubName: string | null;
  status: string;
  carrierName: string | null;
  notes: string | null;
  submittedAt: string | null;
  prequalifiedAt: string | null;
  quotedAt: string | null;
  boundAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Policy {
  id: number;
  facilityId: number;
  facilityName: string | null;
  clubName: string | null;
  policyNumber: string;
  carrier: string;
  coverageType: string;
  premiumAmount: number;
  deductible: number;
  coverageLimit: number;
  effectiveDate: string;
  expiryDate: string;
  status: string;
}

const STEPS = [
  { key: "draft", label: "Draft", icon: FileText },
  { key: "submitted", label: "Submitted to Markets", icon: ChevronRight },
  { key: "prequalified", label: "RiskDrive™ Assessed", icon: CheckCircle2 },
  { key: "quoted", label: "Quotes Received", icon: Clock },
  { key: "bound", label: "Policy Bound", icon: CheckCircle2 },
];

function SubmissionStepper({ status }: { status: string }) {
  const currentIdx = STEPS.findIndex(s => s.key === status);
  return (
    <div className="flex items-center gap-0.5">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${done ? "bg-emerald-500" : active ? "bg-primary" : "bg-muted-foreground/30"}`} />
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px ${done ? "bg-emerald-400" : "bg-muted-foreground/20"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700 border-gray-200" },
  submitted: { label: "Submitted to Markets", className: "bg-blue-100 text-blue-700 border-blue-200" },
  prequalified: { label: "RiskDrive™ Assessed", className: "bg-purple-100 text-purple-700 border-purple-200" },
  quoted: { label: "Quotes Received", className: "bg-amber-100 text-amber-700 border-amber-200" },
  bound: { label: "Policy Bound", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  active: { label: "Active", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  expired: { label: "Expired", className: "bg-red-100 text-red-700 border-red-200" },
};

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

export default function Policies() {
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [policies, setPolicies] = useState<Policy[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pipeline" | "policies">("pipeline");
  const [advancing, setAdvancing] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch("/api/submissions").then(r => r.json()),
      fetch("/api/policies").then(r => r.json()),
    ]).then(([s, p]) => {
      setSubmissions(s);
      setPolicies(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function advanceSubmission(id: number) {
    setAdvancing(id);
    const res = await fetch(`/api/submissions/${id}/advance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const updated = await res.json();
      setSubmissions(prev => prev?.map(s => s.id === id ? updated : s) ?? null);
      toast({ title: "Status advanced", description: `Submission moved to: ${updated.status}` });
    } else {
      toast({ title: "Cannot advance", description: "Submission is already at final stage", variant: "destructive" });
    }
    setAdvancing(null);
  }

  const pipelineByStatus = STEPS.reduce((acc, step) => {
    acc[step.key] = submissions?.filter(s => s.status === step.key) ?? [];
    return acc;
  }, {} as Record<string, Submission[]>);

  return (
    <div>
      <PageHeader
        title="Insurance Placement Pipeline"
        subtitle="Affinity Risk acts as your specialty broker — RiskDrive™ scores are submitted to multiple carrier markets to secure better coverage at lower premiums"
      >
        <div className="flex bg-muted rounded-md p-0.5">
          <button onClick={() => setTab("pipeline")} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${tab === "pipeline" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>
            Pipeline
          </button>
          <button onClick={() => setTab("policies")} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${tab === "policies" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>
            Active Policies
          </button>
        </div>
      </PageHeader>

      <div className="p-6 space-y-6">
        {tab === "pipeline" ? (
          <>
            {/* Affinity Risk broker role explainer */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-800 flex items-start gap-3">
              <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span><strong>Affinity Risk acts as your specialty broker — not the insurer.</strong> RiskDrive™ scores and telematics data are submitted to our panel of 8+ carrier markets simultaneously, creating competition for your business and broadening insurance availability. The pipeline below tracks each submission from draft through final policy binding.</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-5 gap-3">
              {STEPS.map(step => (
                <div key={step.key} className="bg-card border border-border rounded-lg p-3 text-center">
                  <div className="text-xs font-medium text-muted-foreground mb-1">{step.label}</div>
                  <div className="text-xl font-bold">{loading ? "—" : pipelineByStatus[step.key]?.length ?? 0}</div>
                </div>
              ))}
            </div>

            {/* Kanban columns */}
            <div className="grid grid-cols-5 gap-3">
              {STEPS.map(step => {
                const cfg = STATUS_CONFIG[step.key];
                const items = pipelineByStatus[step.key] ?? [];
                return (
                  <div key={step.key} className="space-y-2">
                    <div className={`px-2 py-1 rounded text-xs font-semibold border text-center ${cfg.className}`}>
                      {step.label}
                    </div>
                    {loading
                      ? <Skeleton className="h-24 rounded-lg" />
                      : items.length === 0
                      ? <div className="border border-dashed border-border rounded-lg p-3 text-center text-xs text-muted-foreground">None</div>
                      : items.map(s => (
                        <div key={s.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
                          <div className="font-medium text-xs leading-snug">{s.facilityName}</div>
                          {s.clubName && <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Building2 className="w-2.5 h-2.5" />{s.clubName}</div>}
                          {s.carrierName && <div className="text-[10px] text-primary font-medium">{s.carrierName}</div>}
                          <SubmissionStepper status={s.status} />
                          {s.status !== "bound" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-[10px] h-6 px-2"
                              disabled={advancing === s.id}
                              onClick={() => advanceSubmission(s.id)}
                            >
                              {advancing === s.id ? "..." : "Advance →"}
                            </Button>
                          )}
                          {s.status === "bound" && (
                            <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Bound
                            </div>
                          )}
                        </div>
                      ))
                    }
                  </div>
                );
              })}
            </div>

            {/* Submission table */}
            <div>
              <div className="text-sm font-semibold mb-3">All Submissions</div>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Facility</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Club</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Carrier</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pipeline</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Submitted</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading
                      ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>)
                      : (submissions ?? []).map(s => {
                        const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.draft;
                        return (
                          <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <Link href={`/facilities/${s.facilityId}`} className="font-medium text-primary hover:underline">
                                {s.facilityName}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{s.clubName}</td>
                            <td className="px-4 py-3 text-sm">{s.carrierName ?? <span className="text-muted-foreground">—</span>}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}>
                                {cfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3"><SubmissionStepper status={s.status} /></td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {s.status !== "bound" && (
                                <Button size="sm" variant="outline" className="text-xs h-7" disabled={advancing === s.id} onClick={() => advanceSubmission(s.id)}>
                                  {advancing === s.id ? "..." : "Advance"}
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
          </>
        ) : (
          /* Active Policies */
          <div>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Policy #</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Facility</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Carrier</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Coverage</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Premium</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Coverage Limit</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Effective</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expiry</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={9} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>)
                    : (policies ?? []).length === 0
                    ? <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No policies found</td></tr>
                    : (policies ?? []).map(p => {
                      const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.active;
                      const isExpiringSoon = new Date(p.expiryDate) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
                      return (
                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs font-semibold">{p.policyNumber}</td>
                          <td className="px-4 py-3">
                            <Link href={`/facilities/${p.facilityId}`} className="font-medium text-primary hover:underline">
                              {p.facilityName}
                            </Link>
                            {p.clubName && <div className="text-[10px] text-muted-foreground">{p.clubName}</div>}
                          </td>
                          <td className="px-4 py-3">{p.carrier}</td>
                          <td className="px-4 py-3 text-muted-foreground">{p.coverageType}</td>
                          <td className="px-4 py-3 font-semibold">{fmt(p.premiumAmount)}<div className="text-[10px] text-muted-foreground">Ded: {fmt(p.deductible)}</div></td>
                          <td className="px-4 py-3">{fmt(p.coverageLimit)}</td>
                          <td className="px-4 py-3 text-xs">{p.effectiveDate}</td>
                          <td className="px-4 py-3 text-xs">
                            <span className={isExpiringSoon ? "text-amber-600 font-semibold" : ""}>{p.expiryDate}</span>
                            {isExpiringSoon && <div className="text-[10px] text-amber-600 flex items-center gap-0.5"><AlertCircle className="w-2.5 h-2.5" /> Expiring soon</div>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}>
                              {cfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
