import { useState, useEffect } from "react";
import { Link } from "wouter";
import { DollarSign, TrendingDown, Building2, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";

interface SettlementRecord {
  id: number;
  facilityId: number;
  facilityName: string | null;
  clubName: string | null;
  periodMonth: string;
  grossSettlement: number;
  insurancePremiumDeduction: number;
  premiumFinanceInstallment: number;
  otherDeductions: number;
  netPayout: number;
  status: string;
  paidAt: string | null;
}

interface Summary {
  totalGross: number;
  totalPremium: number;
  totalNet: number;
  pending: number;
  processed: number;
  totalRecords: number;
}

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

function pct(part: number, total: number) {
  return total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "0%";
}

const MONTHS = ["2026-05", "2026-04", "2026-03", "2026-02", "2026-01"];

export default function Settlement() {
  const [records, setRecords] = useState<SettlementRecord[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [periodFilter, setPeriodFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/settlements").then(r => r.json()),
      fetch("/api/settlements/summary").then(r => r.json()),
    ]).then(([r, s]) => { setRecords(r); setSummary(s); });
  }, []);

  const filtered = records?.filter(r => periodFilter === "all" || r.periodMonth === periodFilter) ?? [];

  // Group by facility for the facility summary view
  const byFacility = filtered.reduce((acc, r) => {
    if (!acc[r.facilityId]) acc[r.facilityId] = { facilityName: r.facilityName, clubName: r.clubName, facilityId: r.facilityId, records: [] };
    acc[r.facilityId].records.push(r);
    return acc;
  }, {} as Record<number, { facilityId: number; facilityName: string | null; clubName: string | null; records: SettlementRecord[] }>);

  return (
    <div>
      <PageHeader
        title="Settlement & Premium Deduction"
        subtitle="Monthly insurance premium deductions from AAA hauler settlements — net payout tracking per facility"
      />
      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Gross Settlements", value: summary ? fmt(summary.totalGross) : "—", icon: DollarSign, color: "text-foreground" },
            { label: "Total Premium Deducted", value: summary ? fmt(summary.totalPremium) : "—", icon: TrendingDown, color: "text-orange-600" },
            { label: "Total Net Payout", value: summary ? fmt(summary.totalNet) : "—", icon: DollarSign, color: "text-emerald-600" },
            { label: "Pending", value: summary?.pending ?? "—", icon: Clock, color: "text-amber-600" },
            { label: "Processed", value: summary?.processed ?? "—", icon: CheckCircle2, color: "text-emerald-600" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-4 h-4 text-muted-foreground" />
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</div>
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="text-xs font-semibold text-blue-800 mb-2">How Settlement Deduction Works</div>
          <div className="grid grid-cols-3 gap-4 text-xs text-blue-700">
            <div className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span><span>AAA Club collects the gross service settlement from the tow operator at the end of each period</span></div>
            <div className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span><span>Insurance premium installment is deducted automatically — no separate invoice needed</span></div>
            <div className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span><span>Net payout is disbursed to the hauler — Affinity RiskDrive provides a full audit trail per period</span></div>
          </div>
        </div>

        {/* Period filter */}
        <div className="flex gap-2 flex-wrap">
          {["all", ...MONTHS].map(m => (
            <button key={m} onClick={() => setPeriodFilter(m)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${periodFilter === m ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>
              {m === "all" ? "All Periods" : m}
            </button>
          ))}
        </div>

        {/* Facility breakdown */}
        <div className="space-y-4">
          {!records
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
            : Object.values(byFacility).map(fac => {
              const totGross = fac.records.reduce((s, r) => s + r.grossSettlement, 0);
              const totPremium = fac.records.reduce((s, r) => s + r.insurancePremiumDeduction, 0);
              const totFinance = fac.records.reduce((s, r) => s + r.premiumFinanceInstallment, 0);
              const totNet = fac.records.reduce((s, r) => s + r.netPayout, 0);
              return (
                <div key={fac.facilityId} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                    <div>
                      <Link href={`/facilities/${fac.facilityId}`} className="font-semibold text-sm text-primary hover:underline">{fac.facilityName}</Link>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Building2 className="w-3 h-3" />{fac.clubName}</div>
                    </div>
                    <div className="flex gap-6 text-right">
                      <div><div className="text-[10px] text-muted-foreground">Gross</div><div className="text-sm font-semibold">{fmt(totGross)}</div></div>
                      <div><div className="text-[10px] text-muted-foreground">Premium Deducted</div><div className="text-sm font-semibold text-orange-600">-{fmt(totPremium)}</div></div>
                      {totFinance > 0 && <div><div className="text-[10px] text-muted-foreground">Finance</div><div className="text-sm font-semibold text-orange-400">-{fmt(totFinance)}</div></div>}
                      <div><div className="text-[10px] text-muted-foreground">Net Payout</div><div className="text-sm font-bold text-emerald-600">{fmt(totNet)}</div></div>
                      <div><div className="text-[10px] text-muted-foreground">Deduction Rate</div><div className="text-sm font-semibold">{pct(totPremium + totFinance, totGross)}</div></div>
                    </div>
                  </div>
                  <table className="w-full text-xs">
                    <thead className="bg-muted/20 border-b border-border">
                      <tr>
                        {["Period", "Gross Settlement", "Insurance Premium", "Finance Installment", "Other", "Net Payout", "Status"].map(h => (
                          <th key={h} className="text-left px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {fac.records.map(r => (
                        <tr key={r.id} className="hover:bg-muted/20">
                          <td className="px-4 py-2.5 font-medium">{r.periodMonth}</td>
                          <td className="px-4 py-2.5 font-semibold">{fmt(r.grossSettlement)}</td>
                          <td className="px-4 py-2.5 text-orange-600 font-medium">-{fmt(r.insurancePremiumDeduction)}</td>
                          <td className="px-4 py-2.5 text-orange-500">{r.premiumFinanceInstallment > 0 ? `-${fmt(r.premiumFinanceInstallment)}` : "—"}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{r.otherDeductions > 0 ? `-${fmt(r.otherDeductions)}` : "—"}</td>
                          <td className="px-4 py-2.5 font-bold text-emerald-600">{fmt(r.netPayout)}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${r.status === "processed" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"}`}>
                              {r.status === "processed" ? <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> : <Clock className="w-2.5 h-2.5 mr-1" />}
                              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
