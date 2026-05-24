import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Truck, ChevronRight, Upload } from "lucide-react";
import {
  useGetFacility, useGetFacilitySummary, useListDrivers, useListVehicles,
  useListCertificates, useListAccidents,
  useUploadCertificate, getListCertificatesQueryKey, getListDriversQueryKey, getListVehiclesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RiskBadge, CertBadge, StatCard } from "@/components/Layout";

function SeverityBadge({ severity }: { severity: string }) {
  const cfg: Record<string, string> = {
    minor: "bg-slate-100 text-slate-700", moderate: "bg-amber-100 text-amber-800",
    major: "bg-orange-100 text-orange-800", total_loss: "bg-red-100 text-red-900 font-bold",
  };
  const lbl: Record<string, string> = { minor: "Minor", moderate: "Moderate", major: "Major", total_loss: "Total Loss" };
  return <span className={`text-xs px-1.5 py-0.5 rounded ${cfg[severity] ?? ""}`}>{lbl[severity] ?? severity}</span>;
}

function CertUploadForm({ facilityId, onSuccess }: { facilityId: number; onSuccess: () => void }) {
  const [form, setForm] = useState({
    policyNumber: "", insurer: "", coverageType: "Commercial Auto Liability",
    coverageAmount: "", effectiveDate: "", expirationDate: "",
  });
  const { toast } = useToast();
  const upload = useUploadCertificate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upload.mutate({
      data: {
        facilityId,
        policyNumber: form.policyNumber,
        insurer: form.insurer,
        coverageType: form.coverageType,
        coverageAmount: parseFloat(form.coverageAmount),
        effectiveDate: form.effectiveDate,
        expirationDate: form.expirationDate,
      },
    }, {
      onSuccess: () => {
        toast({ title: "Certificate uploaded", description: "Certificate of Insurance has been recorded." });
        onSuccess();
      },
      onError: () => toast({ title: "Upload failed", description: "Please check your entries.", variant: "destructive" }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Upload className="w-4 h-4" /> Upload Certificate of Insurance
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Policy Number</Label>
          <Input data-testid="input-policy-number" className="h-8 text-sm mt-1" value={form.policyNumber}
            onChange={e => setForm(p => ({ ...p, policyNumber: e.target.value }))} required />
        </div>
        <div>
          <Label className="text-xs">Insurer Name</Label>
          <Input data-testid="input-insurer" className="h-8 text-sm mt-1" value={form.insurer}
            onChange={e => setForm(p => ({ ...p, insurer: e.target.value }))} required />
        </div>
        <div>
          <Label className="text-xs">Coverage Type</Label>
          <Input data-testid="input-coverage-type" className="h-8 text-sm mt-1" value={form.coverageType}
            onChange={e => setForm(p => ({ ...p, coverageType: e.target.value }))} required />
        </div>
        <div>
          <Label className="text-xs">Coverage Amount ($)</Label>
          <Input data-testid="input-coverage-amount" type="number" className="h-8 text-sm mt-1" value={form.coverageAmount}
            onChange={e => setForm(p => ({ ...p, coverageAmount: e.target.value }))} required />
        </div>
        <div>
          <Label className="text-xs">Effective Date</Label>
          <Input data-testid="input-effective-date" type="date" className="h-8 text-sm mt-1" value={form.effectiveDate}
            onChange={e => setForm(p => ({ ...p, effectiveDate: e.target.value }))} required />
        </div>
        <div>
          <Label className="text-xs">Expiration Date</Label>
          <Input data-testid="input-expiration-date" type="date" className="h-8 text-sm mt-1" value={form.expirationDate}
            onChange={e => setForm(p => ({ ...p, expirationDate: e.target.value }))} required />
        </div>
      </div>
      <Button data-testid="button-upload-certificate" type="submit" size="sm" disabled={upload.isPending}>
        {upload.isPending ? "Uploading..." : "Upload Certificate"}
      </Button>
    </form>
  );
}

export default function FacilityDetail({ params }: { params: { facilityId: string } }) {
  const facilityId = parseInt(params.facilityId);
  const qc = useQueryClient();
  const { data: facility, isLoading: facLoading } = useGetFacility(facilityId, { query: { enabled: !!facilityId, queryKey: ["getFacility", facilityId] } });
  const { data: summary, isLoading: sumLoading } = useGetFacilitySummary(facilityId, { query: { enabled: !!facilityId, queryKey: ["getFacilitySummary", facilityId] } });
  const { data: drivers, isLoading: drLoading } = useListDrivers({ facilityId }, { query: { enabled: !!facilityId, queryKey: getListDriversQueryKey({ facilityId }) } });
  const { data: vehicles, isLoading: vehLoading } = useListVehicles({ facilityId }, { query: { enabled: !!facilityId, queryKey: getListVehiclesQueryKey({ facilityId }) } });
  const { data: certs, isLoading: certLoading } = useListCertificates({ facilityId }, { query: { enabled: !!facilityId, queryKey: getListCertificatesQueryKey({ facilityId }) } });
  const { data: accidents, isLoading: accLoading } = useListAccidents({ facilityId }, { query: { enabled: !!facilityId, queryKey: ["listAccidents", facilityId] } });

  return (
    <div>
      <div className="border-b border-border bg-card px-6 py-4 flex items-center gap-3">
        <Link href="/facilities" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
          <Truck className="w-4 h-4 text-orange-600" />
        </div>
        <div className="flex-1">
          {facLoading ? <Skeleton className="h-5 w-48" /> : (
            <h1 className="text-lg font-semibold">{facility?.name}</h1>
          )}
          <p className="text-sm text-muted-foreground">{facility?.city}, {facility?.state} • Owner: {facility?.ownerName}</p>
        </div>
        {facility && <RiskBadge score={facility.riskScore} tier={facility.riskTier} />}
      </div>

      <div className="p-6 space-y-5">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sumLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />) : (
            <>
              <StatCard label="Risk Score" value={summary?.avgRiskScore ?? 0} />
              <StatCard label="Total Miles" value={(summary?.totalMiles ?? 0).toLocaleString()} />
              <StatCard label="Open Accidents" value={summary?.openAccidents ?? 0} color="text-red-600" />
              <StatCard label="Est. Premium" value={`$${((summary?.premiumEstimate ?? 0) / 1000).toFixed(0)}K`} />
            </>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {sumLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />) : (
            <>
              <StatCard label="Hard Braking Events" value={summary?.hardBrakingEvents ?? 0} color="text-orange-600" />
              <StatCard label="Speeding Events" value={summary?.speedingEvents ?? 0} color="text-orange-600" />
              <StatCard label="Harsh Acceleration" value={summary?.harshAccelerationEvents ?? 0} color="text-amber-600" />
            </>
          )}
        </div>

        <Tabs defaultValue="drivers">
          <TabsList className="h-8">
            <TabsTrigger value="drivers" className="text-xs">Drivers ({drivers?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="vehicles" className="text-xs">Vehicles ({vehicles?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="accidents" className="text-xs">Accidents ({accidents?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="certificates" className="text-xs">Certificates ({certs?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="drivers" className="mt-3">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Driver</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">License</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Risk Score</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Miles</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {drLoading ? Array.from({ length: 3 }).map((_, i) => <tr key={i}><td colSpan={6} className="p-3"><Skeleton className="h-5" /></td></tr>) :
                    drivers?.map((d) => (
                      <tr key={d.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{d.firstName} {d.lastName}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{d.licenseNumber}</td>
                        <td className="px-4 py-3"><RiskBadge score={d.riskScore} tier={d.riskTier} /></td>
                        <td className="px-4 py-3 font-mono text-xs">{d.totalMiles.toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{d.status}</span></td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/drivers/${d.id}`} className="text-primary text-xs hover:underline inline-flex items-center gap-0.5">
                            View <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="vehicles" className="mt-3">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Vehicle</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Plate</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Risk Score</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Driver</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vehLoading ? Array.from({ length: 3 }).map((_, i) => <tr key={i}><td colSpan={6} className="p-3"><Skeleton className="h-5" /></td></tr>) :
                    vehicles?.map((v) => (
                      <tr key={v.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{v.year} {v.make} {v.model}</td>
                        <td className="px-4 py-3 text-muted-foreground capitalize text-xs">{v.type.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 font-mono text-xs">{v.licensePlate}</td>
                        <td className="px-4 py-3"><RiskBadge score={v.riskScore} tier={v.riskTier} /></td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{v.assignedDriverName ?? "Unassigned"}</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/vehicles/${v.id}`} className="text-primary text-xs hover:underline inline-flex items-center gap-0.5">
                            View <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="accidents" className="mt-3">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Driver</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Severity</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Claim #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {accLoading ? Array.from({ length: 2 }).map((_, i) => <tr key={i}><td colSpan={5} className="p-3"><Skeleton className="h-5" /></td></tr>) :
                    accidents?.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(a.alertedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-medium">{a.driverName}</td>
                        <td className="px-4 py-3"><SeverityBadge severity={a.severity} /></td>
                        <td className="px-4 py-3 text-xs">{a.status.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.claimNumber ?? "—"}</td>
                      </tr>
                    ))}
                  {!accLoading && (accidents?.length ?? 0) === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No accidents recorded</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="certificates" className="mt-3 space-y-4">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Policy #</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Insurer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Coverage</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Expires</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {certLoading ? Array.from({ length: 2 }).map((_, i) => <tr key={i}><td colSpan={6} className="p-3"><Skeleton className="h-5" /></td></tr>) :
                    certs?.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">{c.policyNumber}</td>
                        <td className="px-4 py-3">{c.insurer}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{c.coverageType}</td>
                        <td className="px-4 py-3 font-mono text-xs">${c.coverageAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{c.expirationDate}</td>
                        <td className="px-4 py-3"><CertBadge status={c.status} /></td>
                      </tr>
                    ))}
                  {!certLoading && (certs?.length ?? 0) === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No certificates on file</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-card border border-border rounded-lg p-5">
              <CertUploadForm facilityId={facilityId} onSuccess={() => qc.invalidateQueries({ queryKey: getListCertificatesQueryKey({ facilityId }) })} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
