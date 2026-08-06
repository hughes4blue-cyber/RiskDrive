import { useState, useEffect } from "react";
import { Link } from "wouter";
import { CheckCircle2, Circle, AlertCircle, Building2, ChevronRight, User } from "lucide-react";
import { PageHeader } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Checklist {
  id: number;
  facilityId: number;
  facilityName: string | null;
  clubName: string | null;
  status: string;
  completedCount: number;
  totalCount: number;
  progressPct: number;
  coiSubmitted: boolean;
  coiVerified: boolean;
  contractSigned: boolean;
  taxStatusVerified: boolean;
  articlesOfIncorporationVerified: boolean;
  driversLicenseRequirementsVerified: boolean;
  vehicleInspectionComplete: boolean;
  telematicsAgreementSigned: boolean;
  telematicsDeviceInstalled: boolean;
  backgroundChecksPassed: boolean;
  notes: string | null;
  assignedRepName: string | null;
  completedAt: string | null;
}

const CHECKLIST_ITEMS: { key: keyof Checklist; label: string; description: string; category: string }[] = [
  { key: "coiSubmitted", label: "COI Submitted", description: "Certificate of Insurance received from hauler", category: "Insurance" },
  { key: "coiVerified", label: "COI Verified", description: "COI reviewed and meets AAA contract requirements", category: "Insurance" },
  { key: "contractSigned", label: "Contract Signed", description: "AAA tow operator contract executed by all parties", category: "Legal" },
  { key: "taxStatusVerified", label: "Tax Status Verified", description: "EIN / W-9 and tax standing confirmed", category: "Legal" },
  { key: "articlesOfIncorporationVerified", label: "Articles of Incorporation", description: "Business entity formation documents reviewed", category: "Legal" },
  { key: "driversLicenseRequirementsVerified", label: "CDL Requirements Verified", description: "All drivers hold valid CDL for vehicle class", category: "Compliance" },
  { key: "backgroundChecksPassed", label: "Background Checks Passed", description: "MVR and criminal background checks cleared for all drivers", category: "Compliance" },
  { key: "vehicleInspectionComplete", label: "Vehicle Inspection Complete", description: "All tow vehicles inspected and meet FMCSA standards", category: "Operations" },
  { key: "telematicsAgreementSigned", label: "Telematics Agreement Signed", description: "Hauler consented to telematics data sharing for insurance", category: "Telematics" },
  { key: "telematicsDeviceInstalled", label: "Telematics Device Installed", description: "Affinity RiskDrive™-compatible device installed in all vehicles", category: "Telematics" },
];

const STATUS_CFG: Record<string, { label: string; className: string; dot: string }> = {
  complete: { label: "Complete", className: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  pending: { label: "Pending", className: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-400" },
};

const CATEGORY_COLORS: Record<string, string> = {
  Insurance: "text-blue-700",
  Legal: "text-purple-700",
  Compliance: "text-orange-700",
  Operations: "text-slate-700",
  Telematics: "text-teal-700",
};

export default function Onboarding() {
  const [checklists, setChecklists] = useState<Checklist[] | null>(null);
  const [selected, setSelected] = useState<Checklist | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/onboarding").then(r => r.json()).then(data => {
      setChecklists(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    });
  }, []);

  async function toggle(facilityId: number, field: string, current: boolean) {
    setSaving(field);
    const res = await fetch(`/api/onboarding/${facilityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !current }),
    });
    if (res.ok) {
      const updated = await res.json();
      setChecklists(prev => prev?.map(c => c.facilityId === facilityId ? updated : c) ?? null);
      setSelected(prev => prev?.facilityId === facilityId ? updated : prev);
      if (updated.status === "complete") toast({ title: "Onboarding Complete!", description: `${updated.facilityName} is fully onboarded.` });
    }
    setSaving(null);
  }

  const filtered = checklists?.filter(c => statusFilter === "all" || c.status === statusFilter) ?? [];

  return (
    <div>
      <PageHeader
        title="Hauler Onboarding & Compliance"
        subtitle="Automated onboarding checklist for AAA contracted tow operators — COI, contract, CDL, and telematics requirements"
      />
      <div className="p-6 flex gap-6 h-[calc(100vh-120px)]">
        {/* Left panel — list */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          <div className="flex gap-1.5">
            {["all", "pending", "in_progress", "complete"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`flex-1 px-2 py-1 rounded text-[10px] font-medium border transition-colors ${statusFilter === s ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border"}`}>
                {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {!checklists
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
              : filtered.map(c => {
                const cfg = STATUS_CFG[c.status] ?? STATUS_CFG.pending;
                const isSelected = selected?.facilityId === c.facilityId;
                return (
                  <button key={c.facilityId} onClick={() => setSelected(c)} className={`w-full text-left bg-card border rounded-lg p-3 transition-colors ${isSelected ? "border-primary ring-1 ring-primary/20" : "border-border hover:bg-muted/30"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-semibold truncate">{c.facilityName}</div>
                      <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 mb-2"><Building2 className="w-2.5 h-2.5" />{c.clubName}</div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{c.completedCount}/{c.totalCount}</span>
                    </div>
                    <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${c.status === "complete" ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${c.progressPct}%` }} />
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Right panel — checklist */}
        {selected ? (
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold">{selected.facilityName}</h2>
                <div className="text-sm text-muted-foreground">{selected.clubName}</div>
                {selected.assignedRepName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1"><User className="w-3 h-3" /> Rep: {selected.assignedRepName}</div>
                )}
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_CFG[selected.status]?.className}`}>
                  {selected.completedCount}/{selected.totalCount} Complete
                </div>
                <div className="mt-1 w-32 h-2 bg-muted rounded-full overflow-hidden ml-auto">
                  <div className={`h-full rounded-full ${selected.status === "complete" ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${selected.progressPct}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{selected.progressPct}% complete</div>
              </div>
            </div>

            {selected.status === "complete" && (
              <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-emerald-700 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> Fully onboarded — this hauler is cleared for AAA network service
                {selected.completedAt && <span className="text-xs font-normal ml-auto">Completed {new Date(selected.completedAt).toLocaleDateString()}</span>}
              </div>
            )}

            <div className="space-y-3">
              {Object.entries(
                CHECKLIST_ITEMS.reduce((acc, item) => {
                  if (!acc[item.category]) acc[item.category] = [];
                  acc[item.category].push(item);
                  return acc;
                }, {} as Record<string, typeof CHECKLIST_ITEMS>)
              ).map(([cat, items]) => (
                <div key={cat} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className={`px-4 py-2 border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wider ${CATEGORY_COLORS[cat] ?? "text-foreground"}`}>
                    {cat}
                  </div>
                  <div className="divide-y divide-border">
                    {items.map(item => {
                      const done = !!selected[item.key];
                      return (
                        <div key={item.key} className="flex items-center gap-3 px-4 py-3">
                          <button
                            disabled={saving === item.key}
                            onClick={() => toggle(selected.facilityId, item.key, done)}
                            className="flex-shrink-0 transition-colors"
                          >
                            {done
                              ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              : <Circle className="w-5 h-5 text-muted-foreground/40 hover:text-muted-foreground" />}
                          </button>
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>{item.label}</div>
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          </div>
                          {done
                            ? <span className="text-[10px] text-emerald-600 font-medium">Verified</span>
                            : <span className="text-[10px] text-amber-600 font-medium">Pending</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Select a facility to view its onboarding checklist</div>
        )}
      </div>
    </div>
  );
}
