import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileCheck,
  AlertCircle,
  Upload,
  Loader2,
  CheckCircle2,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import {
  useListCertificates,
  useListFacilities,
  useCreateInsuranceDocument,
  useExtractInsuranceDocument,
  useConfirmInsuranceDocument,
  useListInsuranceDocuments,
  getListInsuranceDocumentsQueryKey,
  getListCertificatesQueryKey,
} from "@workspace/api-client-react";
import type { InsuranceDocument, ExtractedDocumentData } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, CertBadge } from "@/components/Layout";
import { useUpload } from "@workspace/object-storage-web";
import { useToast } from "@/hooks/use-toast";

const DOC_TYPE_OPTIONS = [
  { value: "wc_coi", label: "WC Certificate of Insurance", description: "Prior Workers Comp COI / ACORD 25" },
  { value: "liability_coi", label: "Liability Certificate of Insurance", description: "GL/Auto COI / ACORD 25" },
  { value: "loss_run", label: "Loss Run Report", description: "5-year claims history from prior carrier" },
  { value: "liability_deck", label: "Liability Declarations Page", description: "Policy declarations / deck page" },
] as const;

type DocType = (typeof DOC_TYPE_OPTIONS)[number]["value"];

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.webp";

function statusBadge(status: InsuranceDocument["status"]) {
  const map: Record<string, string> = {
    uploaded: "bg-slate-100 text-slate-700",
    extracting: "bg-blue-100 text-blue-700",
    extracted: "bg-amber-100 text-amber-700",
    confirmed: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    uploaded: "Uploaded",
    extracting: "Analyzing…",
    extracted: "Awaiting Review",
    confirmed: "Confirmed",
    error: "Error",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function FieldRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <input
        className="w-full text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ReviewPanel({
  doc,
  onConfirmed,
  onClose,
}: {
  doc: InsuranceDocument;
  onConfirmed: () => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const confirm = useConfirmInsuranceDocument();
  const extract = useExtractInsuranceDocument();

  const raw = (doc.extractedData ?? {}) as ExtractedDocumentData;
  const [fields, setFields] = useState({
    policyNumber: raw.policyNumber ?? "",
    insurer: raw.insurer ?? "",
    insuredName: raw.insuredName ?? "",
    coverageType: raw.coverageType ?? "",
    effectiveDate: raw.effectiveDate ?? "",
    expirationDate: raw.expirationDate ?? "",
    coverageAmount: String(raw.coverageAmount ?? ""),
  });

  const isCOI = doc.documentType === "wc_coi" || doc.documentType === "liability_coi";

  const handleReExtract = () => {
    extract.mutate(
      { documentId: doc.id },
      {
        onSuccess: (data) => {
          const d = data as ExtractedDocumentData;
          setFields({
            policyNumber: d.policyNumber ?? "",
            insurer: d.insurer ?? "",
            insuredName: d.insuredName ?? "",
            coverageType: d.coverageType ?? "",
            effectiveDate: d.effectiveDate ?? "",
            expirationDate: d.expirationDate ?? "",
            coverageAmount: String(d.coverageAmount ?? ""),
          });
        },
      },
    );
  };

  const handleConfirm = () => {
    confirm.mutate(
      {
        documentId: doc.id,
        data: {
          extractedData: {
            policyNumber: fields.policyNumber || null,
            insurer: fields.insurer || null,
            insuredName: fields.insuredName || null,
            coverageType: fields.coverageType || null,
            effectiveDate: fields.effectiveDate || null,
            expirationDate: fields.expirationDate || null,
            coverageAmount: fields.coverageAmount ? Number(fields.coverageAmount) : null,
            confidence: raw.confidence ?? null,
            rawSummary: raw.rawSummary ?? null,
            claimsCount: raw.claimsCount ?? null,
          },
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCertificatesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListInsuranceDocumentsQueryKey({ facilityId: doc.facilityId }) });
          toast({ title: isCOI ? "Certificate created" : "Document confirmed", description: isCOI ? "COI has been added to the certificates list." : "Document saved successfully." });
          onConfirmed();
        },
        onError: () => toast({ title: "Error", description: "Failed to confirm document.", variant: "destructive" }),
      },
    );
  };

  const confidence = raw.confidence;

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-amber-50/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-900">AI-Extracted Fields — Review & Confirm</span>
          {confidence && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              confidence === "high" ? "bg-green-100 text-green-700" :
              confidence === "medium" ? "bg-amber-100 text-amber-700" :
              "bg-red-100 text-red-700"
            }`}>
              {confidence} confidence
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {raw.rawSummary && (
        <div className="px-4 py-2 bg-blue-50/50 border-b border-border text-xs text-blue-700 italic">
          {raw.rawSummary}
        </div>
      )}

      <div className="p-4 grid grid-cols-2 gap-3">
        <FieldRow label="Policy Number" value={fields.policyNumber} onChange={(v) => setFields((f) => ({ ...f, policyNumber: v }))} />
        <FieldRow label="Insurer / Carrier" value={fields.insurer} onChange={(v) => setFields((f) => ({ ...f, insurer: v }))} />
        <FieldRow label="Insured Name" value={fields.insuredName} onChange={(v) => setFields((f) => ({ ...f, insuredName: v }))} />
        <FieldRow label="Coverage Type" value={fields.coverageType} onChange={(v) => setFields((f) => ({ ...f, coverageType: v }))} />
        <FieldRow label="Effective Date (YYYY-MM-DD)" value={fields.effectiveDate} onChange={(v) => setFields((f) => ({ ...f, effectiveDate: v }))} />
        <FieldRow label="Expiration Date (YYYY-MM-DD)" value={fields.expirationDate} onChange={(v) => setFields((f) => ({ ...f, expirationDate: v }))} />
        <FieldRow label="Coverage Amount ($)" value={fields.coverageAmount} onChange={(v) => setFields((f) => ({ ...f, coverageAmount: v }))} />
        {raw.claimsCount != null && (
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Claims Count</label>
            <div className="text-sm border border-border rounded-md px-3 py-1.5 bg-muted/30">{raw.claimsCount}</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <button
          onClick={handleReExtract}
          disabled={extract.isPending}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
        >
          {extract.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Re-analyze document
        </button>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted/50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirm.isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {confirm.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            {isCOI ? "Confirm & Create Certificate" : "Confirm Document"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadPanel({ onDone }: { onDone: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: facilities } = useListFacilities();
  const createDoc = useCreateInsuranceDocument();
  const extractDoc = useExtractInsuranceDocument();

  const [facilityId, setFacilityId] = useState<number | "">("");
  const [docType, setDocType] = useState<DocType>("wc_coi");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "extracting" | "review">("idle");
  const [reviewDoc, setReviewDoc] = useState<InsuranceDocument | null>(null);

  const { uploadFile, isUploading, progress } = useUpload({
    onError: (err) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setPhase("idle");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setSelectedFile(f);
  };

  const handleUpload = async () => {
    if (!selectedFile || facilityId === "") {
      toast({ title: "Missing info", description: "Select a facility and file first.", variant: "destructive" });
      return;
    }

    setPhase("uploading");

    const result = await uploadFile(selectedFile);
    if (!result) {
      setPhase("idle");
      return;
    }

    setPhase("extracting");

    createDoc.mutate(
      {
        data: {
          facilityId: Number(facilityId),
          documentType: docType,
          fileName: selectedFile.name,
          fileKey: result.objectPath,
          contentType: selectedFile.type || "application/octet-stream",
        },
      },
      {
        onSuccess: (doc) => {
          queryClient.invalidateQueries({ queryKey: getListInsuranceDocumentsQueryKey({ facilityId: Number(facilityId) }) });
          extractDoc.mutate(
            { documentId: doc.id },
            {
              onSuccess: (extracted) => {
                setReviewDoc({ ...doc, extractedData: extracted as ExtractedDocumentData, status: "extracted" });
                setPhase("review");
              },
              onError: () => {
                toast({ title: "AI extraction failed", description: "Document saved. You can retry extraction from the documents list.", variant: "destructive" });
                setPhase("idle");
                onDone();
              },
            },
          );
        },
        onError: () => {
          toast({ title: "Error saving document", variant: "destructive" });
          setPhase("idle");
        },
      },
    );
  };

  if (phase === "review" && reviewDoc) {
    return (
      <ReviewPanel
        doc={reviewDoc}
        onConfirmed={() => { setPhase("idle"); setSelectedFile(null); onDone(); }}
        onClose={() => { setPhase("idle"); setSelectedFile(null); onDone(); }}
      />
    );
  }

  const busy = phase === "uploading" || phase === "extracting";

  return (
    <div className="border border-border rounded-lg bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Upload className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">Upload Insurance Document</h2>
        <span className="text-xs text-muted-foreground">PDF, JPEG, PNG, or WebP — AI will extract the fields for you</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Facility */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Facility</label>
          <select
            className="w-full text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value ? Number(e.target.value) : "")}
            disabled={busy}
          >
            <option value="">Select facility…</option>
            {facilities?.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Document type */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Document Type</label>
          <select
            className="w-full text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
            disabled={busy}
          >
            {DOC_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            {DOC_TYPE_OPTIONS.find((o) => o.value === docType)?.description}
          </p>
        </div>
      </div>

      {/* File drop zone */}
      <div
        onClick={() => !busy && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          busy ? "opacity-50 cursor-not-allowed border-border" :
          selectedFile ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={handleFileChange}
          disabled={busy}
        />
        {selectedFile ? (
          <div className="flex items-center justify-center gap-2 text-sm">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-medium">{selectedFile.name}</span>
            <span className="text-muted-foreground">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
            {!busy && (
              <button
                className="ml-2 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground/60" />
            Click to select or drag a file here
            <div className="text-xs mt-1">PDF, JPEG, PNG, or WebP</div>
          </div>
        )}
      </div>

      {/* Progress / status */}
      {phase === "uploading" && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading…</span><span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {phase === "extracting" && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>AI is reading your document and extracting fields…</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || facilityId === "" || busy}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {isUploading ? "Uploading…" : phase === "extracting" ? "Analyzing…" : "Upload & Extract"}
        </button>
      </div>
    </div>
  );
}

function DocumentHistoryRows({ facilityId }: { facilityId: number }) {
  const { data: docs, isLoading } = useListInsuranceDocuments({ facilityId });
  return (
    <div className="border-t border-border divide-y divide-border">
      {isLoading ? (
        <div className="px-4 py-3"><Skeleton className="h-4 w-48" /></div>
      ) : !docs?.length ? (
        <div className="px-4 py-4 text-sm text-muted-foreground">No documents uploaded yet.</div>
      ) : docs.map((d) => (
        <div key={d.id} className="px-4 py-3 flex items-center justify-between text-sm">
          <div>
            <span className="font-medium">{d.fileName}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {DOC_TYPE_OPTIONS.find((o) => o.value === d.documentType)?.label ?? d.documentType}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{new Date(d.uploadedAt).toLocaleDateString()}</span>
            {statusBadge(d.status)}
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentHistory({ facilityId }: { facilityId: number | null }) {
  const [open, setOpen] = useState(false);

  if (!facilityId) return null;

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          Uploaded Document History
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <DocumentHistoryRows facilityId={facilityId} />}
    </div>
  );
}

export default function Certificates() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [historyFacilityId, setHistoryFacilityId] = useState<number | null>(null);
  const { data: certs, isLoading } = useListCertificates();
  const { data: facilities } = useListFacilities();

  const filtered = certs?.filter((c) => statusFilter === "all" || c.status === statusFilter);
  const statuses = ["all", "current", "expiring_soon", "expired"];
  const statusLabels: Record<string, string> = { all: "All", current: "Current", expiring_soon: "Expiring Soon", expired: "Expired" };

  const expiredCount = certs?.filter((c) => c.status === "expired").length ?? 0;
  const expiringCount = certs?.filter((c) => c.status === "expiring_soon").length ?? 0;

  return (
    <div>
      <PageHeader
        title="Certificates of Insurance"
        subtitle="COI tracking across all towing facilities"
      >
        <button
          onClick={() => setShowUpload((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Document
        </button>
      </PageHeader>
      <div className="p-6 space-y-4">

        {/* Upload panel */}
        {showUpload && (
          <UploadPanel onDone={() => setShowUpload(false)} />
        )}

        {/* Alert banners */}
        {(expiredCount > 0 || expiringCount > 0) && !isLoading && (
          <div className="space-y-2">
            {expiredCount > 0 && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <span className="font-semibold">{expiredCount} certificate{expiredCount > 1 ? "s" : ""} expired</span> — immediate renewal required to maintain coverage compliance.
                </div>
              </div>
            )}
            {expiringCount > 0 && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <span className="font-semibold">{expiringCount} certificate{expiringCount > 1 ? "s" : ""} expiring within 30 days</span> — contact facilities to initiate renewal.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {statuses.map((s) => (
              <button
                key={s}
                data-testid={`filter-cert-${s}`}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-white border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>

          {/* Document history facility selector */}
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              className="text-xs border border-border rounded-md px-2 py-1 bg-background focus:outline-none"
              value={historyFacilityId ?? ""}
              onChange={(e) => setHistoryFacilityId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">View document history…</option>
              {facilities?.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Document history */}
        {historyFacilityId && (
          <DocumentHistory facilityId={historyFacilityId} />
        )}

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Facility</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Policy Number</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Insurer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Coverage Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Effective</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expires</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><Skeleton className="h-5" /></td></tr>
                ))
              ) : filtered?.map((c) => (
                <tr key={c.id} className={`hover:bg-muted/30 transition-colors ${c.status === "expired" ? "bg-red-50/30" : c.status === "expiring_soon" ? "bg-amber-50/30" : ""}`} data-testid={`cert-row-${c.id}`}>
                  <td className="px-4 py-3 font-medium">{c.facilityName ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.policyNumber}</td>
                  <td className="px-4 py-3">{c.insurer}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{c.coverageType}</td>
                  <td className="px-4 py-3 font-mono text-xs">${c.coverageAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.effectiveDate}</td>
                  <td className={`px-4 py-3 text-xs font-medium ${c.status === "expired" ? "text-red-700" : c.status === "expiring_soon" ? "text-amber-700" : "text-muted-foreground"}`}>
                    {c.expirationDate}
                  </td>
                  <td className="px-4 py-3"><CertBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && (filtered?.length ?? 0) === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No certificates match the selected filter</div>
          )}
        </div>
      </div>
    </div>
  );
}
