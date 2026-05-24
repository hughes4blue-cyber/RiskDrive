import { useState } from "react";
import { AlertTriangle, CheckCircle, FileText, Zap } from "lucide-react";
import { useListAccidents, useInitiateClaim, getListAccidentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/Layout";

const SEVERITY_CONFIG: Record<string, { label: string; className: string }> = {
  minor: { label: "Minor", className: "bg-slate-100 text-slate-700 border-slate-200" },
  moderate: { label: "Moderate", className: "bg-amber-100 text-amber-800 border-amber-200" },
  major: { label: "Major", className: "bg-orange-100 text-orange-800 border-orange-200" },
  total_loss: { label: "Total Loss", className: "bg-red-100 text-red-900 border-red-300 font-bold" },
};

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  alerted: { label: "Alerted", className: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500 animate-pulse" },
  claim_initiated: { label: "Claim Initiated", className: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  under_review: { label: "Under Review", className: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  resolved: { label: "Resolved", className: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
};

function ClaimDialog({ accidentId, onClose }: { accidentId: number; onClose: () => void }) {
  const [claimNumber, setClaimNumber] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();
  const initiate = useInitiateClaim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initiate.mutate({
      accidentId,
      data: { claimNumber },
    }, {
      onSuccess: () => {
        toast({ title: "FNOL Submitted", description: `Claim ${claimNumber} has been opened and reported to the carrier.` });
        qc.invalidateQueries({ queryKey: getListAccidentsQueryKey({}) });
        onClose();
      },
      onError: () => toast({ title: "Error", description: "Failed to submit FNOL", variant: "destructive" }),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3 py-2">
        <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
          Collision detection has triggered this FNOL. Submitting will report this incident to the carrier, Alliant, or your internal claims team. Telematics data will be attached automatically for faster adjudication.
        </div>
        <div>
          <Label className="text-xs">Claim / FNOL Reference Number</Label>
          <Input
            data-testid="input-claim-number"
            className="mt-1 h-8 text-sm"
            placeholder="e.g. CLM-2024-0001"
            value={claimNumber}
            onChange={(e) => setClaimNumber(e.target.value)}
            required
          />
        </div>
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button data-testid="button-confirm-claim" type="submit" size="sm" disabled={initiate.isPending}>
          {initiate.isPending ? "Submitting FNOL..." : "Submit First Notice of Loss"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function Accidents() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [claimAccidentId, setClaimAccidentId] = useState<number | null>(null);
  const { data: accidents, isLoading } = useListAccidents();

  const filtered = accidents?.filter((a) => statusFilter === "all" || a.status === statusFilter);
  const statuses = ["all", "alerted", "claim_initiated", "under_review", "resolved"];

  return (
    <div>
      <PageHeader
        title="Accident Alerts & FNOL"
        subtitle="Collision-detection alerts across the network — submit First Notice of Loss immediately from telematics data"
      />
      <div className="p-6 space-y-4">
        {/* Status filter */}
        <div className="flex gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              data-testid={`filter-status-${s}`}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                statusFilter === s
                  ? "bg-primary text-white border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s]?.label ?? s}
            </button>
          ))}
        </div>

        {/* Accidents list */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
          ) : filtered?.map((acc) => {
            const sev = SEVERITY_CONFIG[acc.severity] ?? SEVERITY_CONFIG.minor;
            const stat = STATUS_CONFIG[acc.status] ?? STATUS_CONFIG.alerted;
            return (
              <div key={acc.id} className="bg-card border border-border rounded-lg p-4" data-testid={`accident-${acc.id}`}>
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${acc.severity === "total_loss" || acc.severity === "major" ? "bg-red-100" : "bg-amber-100"}`}>
                    <AlertTriangle className={`w-4 h-4 ${acc.severity === "total_loss" || acc.severity === "major" ? "text-red-600" : "text-amber-600"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${stat.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
                        {stat.label}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${sev.className}`}>{sev.label}</span>
                      {acc.claimNumber && (
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {acc.claimNumber}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {acc.driverName ?? "Unknown Driver"} — {acc.vehiclePlate ?? "Unknown Vehicle"}
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {acc.facilityName} • {new Date(acc.alertedAt).toLocaleString()}
                      {acc.resolvedAt && ` → Resolved ${new Date(acc.resolvedAt).toLocaleDateString()}`}
                    </div>
                    {acc.description && (
                      <div className="text-xs text-muted-foreground italic">{acc.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1 font-mono">
                      Coords: {acc.latitude.toFixed(4)}, {acc.longitude.toFixed(4)}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {acc.status === "alerted" && (
                      <Button
                        data-testid={`button-initiate-claim-${acc.id}`}
                        size="sm"
                        onClick={() => setClaimAccidentId(acc.id)}
                        className="text-xs gap-1.5"
                      >
                        <Zap className="w-3 h-3" />
                        File FNOL
                      </Button>
                    )}
                    {acc.status === "resolved" && (
                      <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                        <CheckCircle className="w-4 h-4" /> Resolved
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {!isLoading && (filtered?.length ?? 0) === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No accidents matching the selected filter
            </div>
          )}
        </div>
      </div>

      <Dialog open={claimAccidentId !== null} onOpenChange={() => setClaimAccidentId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" /> First Notice of Loss (FNOL)
            </DialogTitle>
          </DialogHeader>
          {claimAccidentId !== null && (
            <ClaimDialog accidentId={claimAccidentId} onClose={() => setClaimAccidentId(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
