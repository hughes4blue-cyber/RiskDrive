import { useState } from "react";
import { HardHat, ChevronRight, ChevronLeft, CheckCircle2, Bot, AlertCircle, Info, Shield, TrendingDown, Building2 } from "lucide-react";
import { PageHeader } from "@/components/Layout";
import { Link } from "wouter";

const CLASS_CODES = [
  { code: "7380", desc: "Chauffeurs & Messengers — Commercial", rate: 4.82 },
  { code: "7382", desc: "Auto Service & Repair — Towing", rate: 6.14 },
  { code: "7383", desc: "Towing — Emergency Roadside", rate: 7.29 },
  { code: "8742", desc: "Salespersons — Outside", rate: 0.97 },
  { code: "8810", desc: "Clerical Office Employees", rate: 0.28 },
];

const STEPS = ["Operator Info", "Payroll & Class Codes", "Loss History", "Telematics Credit", "Review & Submit"];

interface PayrollLine {
  classCode: string;
  desc: string;
  payroll: string;
}

interface FormData {
  companyName: string;
  fein: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  ownerName: string;
  ownerTitle: string;
  yearsInBusiness: string;
  numDrivers: string;
  payrollLines: PayrollLine[];
  priorCarrier: string;
  priorPremium: string;
  modFactor: string;
  lossYears: { year: string; claims: string; paid: string }[];
  hasTelematics: boolean;
  riskdriveScore: string;
  criticalAlerts: string;
  warningAlerts: string;
  exonerationRate: string;
}

const INITIAL: FormData = {
  companyName: "", fein: "", address: "", city: "", state: "TX", zip: "",
  ownerName: "", ownerTitle: "Owner", yearsInBusiness: "", numDrivers: "",
  payrollLines: [{ classCode: "7383", desc: "Towing — Emergency Roadside", payroll: "" }],
  priorCarrier: "", priorPremium: "", modFactor: "1.00",
  lossYears: [
    { year: "2023", claims: "", paid: "" },
    { year: "2024", claims: "", paid: "" },
    { year: "2025", claims: "", paid: "" },
  ],
  hasTelematics: true,
  riskdriveScore: "", criticalAlerts: "", warningAlerts: "", exonerationRate: "",
};

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            i < step ? "bg-emerald-100 text-emerald-700" :
            i === step ? "bg-blue-600 text-white shadow-sm" :
            "bg-gray-100 text-gray-400"
          }`}>
            {i < step ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-4 text-center">{i + 1}</span>}
            <span className="hidden md:inline">{label}</span>
          </div>
          {i < total - 1 && <div className={`w-6 h-0.5 ${i < step ? "bg-emerald-300" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );
}

function FinnTip({ text }: { text: string }) {
  return (
    <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
        <Bot className="w-3 h-3 text-white" />
      </div>
      <p className="text-xs text-amber-800 leading-relaxed">{text}</p>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
        {hint && (
          <span className="group relative">
            <Info className="w-3 h-3 text-gray-400 cursor-help" />
            <span className="absolute left-5 top-0 z-10 hidden group-hover:block w-48 bg-gray-800 text-white text-[10px] rounded-lg px-2 py-1.5 leading-relaxed shadow-lg">{hint}</span>
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-white transition-colors"
    />
  );
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white">
      {children}
    </select>
  );
}

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

// Demo pre-fill from "RiskDrive" data
const DEMO_PREFILL = {
  riskdriveScore: "74",
  criticalAlerts: "4",
  warningAlerts: "14",
  exonerationRate: "25",
};

function computeEstimate(form: FormData): { gross: number; credit: number; net: number; mod: number } {
  const mod = parseFloat(form.modFactor) || 1.0;
  let gross = 0;
  for (const line of form.payrollLines) {
    const cc = CLASS_CODES.find(c => c.code === line.classCode);
    const payroll = parseFloat(line.payroll.replace(/,/g, "")) || 0;
    if (cc) gross += (payroll / 100) * cc.rate;
  }
  gross *= mod;
  const score = parseFloat(form.riskdriveScore) || 0;
  const creditPct = score >= 80 ? 0.18 : score >= 70 ? 0.14 : score >= 60 ? 0.08 : 0;
  const credit = gross * creditPct;
  return { gross: Math.round(gross), credit: Math.round(credit), net: Math.round(gross - credit), mod };
}

export default function WCQuote() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function prefillFromRiskDrive() {
    setForm(prev => ({
      ...prev,
      ...DEMO_PREFILL,
      companyName: prev.companyName || "Metro Towing & Recovery",
      fein: prev.fein || "82-4391027",
      numDrivers: prev.numDrivers || "6",
      yearsInBusiness: prev.yearsInBusiness || "8",
      city: prev.city || "Dallas",
      state: "TX",
      ownerName: prev.ownerName || "Marcus Johnson",
    }));
  }

  const estimate = computeEstimate(form);

  if (submitted) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Workers Comp Quote" subtitle="Affinity Risk — telematics-based Workers Compensation for tow operators" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quote Request Submitted</h2>
              <p className="text-sm text-gray-500 mt-1">Your Affinity Risk representative will follow up within 1 business day.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-left space-y-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preliminary Estimate</div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Gross Manual Premium</span>
                <span className="font-semibold">${estimate.gross.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Experience Mod ({form.modFactor}×)</span>
                <span className="font-semibold">{estimate.mod < 1 ? "Credit" : "Debit"}</span>
              </div>
              {estimate.credit > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Affinity RiskDrive Credit</span>
                  <span className="font-semibold">−${estimate.credit.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Estimated Net Premium</span>
                <span className="font-bold text-blue-600 text-lg">${estimate.net.toLocaleString()}</span>
              </div>
            </div>
            <FinnTip text="Your RiskDrive score qualified you for a telematics credit. Your broker will confirm final pricing after reviewing your loss runs and completing market submissions." />
            <div className="flex gap-3">
              <Link href="/policies" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium text-center hover:bg-blue-700 transition-colors">
                View Liability Placement →
              </Link>
              <Link href="/finn" className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium text-center hover:bg-gray-50 transition-colors">
                Ask Finn
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Workers Comp Quote"
        subtitle="Affinity Risk — telematics-based Workers Compensation for tow operators"
      />

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Step indicator */}
          <div className="overflow-x-auto">
            <StepIndicator step={step} total={STEPS.length} />
          </div>

          {/* Banner */}
          {step === 0 && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl px-5 py-4 text-white">
              <div className="flex items-center gap-3 mb-2">
                <HardHat className="w-5 h-5 text-blue-200" />
                <span className="font-bold">Workers Comp for Tow Operators</span>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed">
                Traditional WC is rated on guesses. Affinity RiskDrive rates on <strong>actual telematics data</strong> — your real driving behavior, incident rates, and coaching outcomes. Operators with strong data typically save 8–22% vs. standard market rates.
              </p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: "Avg. Savings", value: "14%" },
                  { label: "Markets", value: "6+" },
                  { label: "Turnaround", value: "24h" },
                ].map(s => (
                  <div key={s.label} className="bg-white/10 rounded-lg px-3 py-2 text-center">
                    <div className="font-bold text-lg">{s.value}</div>
                    <div className="text-blue-200 text-[10px] uppercase tracking-wide">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Step {step + 1}: {STEPS[step]}</h2>
              <span className="text-xs text-gray-400">{step + 1} of {STEPS.length}</span>
            </div>

            <div className="p-5 space-y-5">
              {/* Step 0 — Operator Info */}
              {step === 0 && (
                <>
                  <FinnTip text="Finn tip: I can pre-fill your company info from your RiskDrive profile. Click 'Pre-fill from RiskDrive' to import what we already know about your operation." />
                  <button onClick={prefillFromRiskDrive}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors">
                    <Bot className="w-4 h-4" />
                    Pre-fill from Affinity RiskDrive
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Legal Business Name" required><Input value={form.companyName} onChange={v => set("companyName", v)} placeholder="Metro Towing & Recovery LLC" /></Field>
                    <Field label="Federal EIN" required hint="9-digit employer identification number from IRS"><Input value={form.fein} onChange={v => set("fein", v)} placeholder="XX-XXXXXXX" /></Field>
                    <Field label="Owner / Principal Name" required><Input value={form.ownerName} onChange={v => set("ownerName", v)} placeholder="Jane Smith" /></Field>
                    <Field label="Title">
                      <Select value={form.ownerTitle} onChange={v => set("ownerTitle", v)}>
                        {["Owner", "President", "CEO", "Partner", "Manager"].map(t => <option key={t}>{t}</option>)}
                      </Select>
                    </Field>
                    <Field label="Years in Business" required><Input value={form.yearsInBusiness} onChange={v => set("yearsInBusiness", v)} placeholder="8" type="number" /></Field>
                    <Field label="Number of Drivers / Contractors" required hint="Count 1099 contractors who regularly perform towing services"><Input value={form.numDrivers} onChange={v => set("numDrivers", v)} placeholder="6" type="number" /></Field>
                    <Field label="Business Address"><Input value={form.address} onChange={v => set("address", v)} placeholder="1234 Main St" /></Field>
                    <Field label="City"><Input value={form.city} onChange={v => set("city", v)} placeholder="Dallas" /></Field>
                    <Field label="State">
                      <Select value={form.state} onChange={v => set("state", v)}>
                        {US_STATES.map(s => <option key={s}>{s}</option>)}
                      </Select>
                    </Field>
                    <Field label="ZIP Code"><Input value={form.zip} onChange={v => set("zip", v)} placeholder="75201" /></Field>
                  </div>
                </>
              )}

              {/* Step 1 — Payroll & Class Codes */}
              {step === 1 && (
                <>
                  <FinnTip text="Finn tip: Tow operators typically use class code 7383 (Emergency Roadside Towing) for drivers, and 8810 (Clerical) for office staff. Payroll for 1099 contractors is based on the amount paid to them — not just wages." />
                  <div className="space-y-3">
                    {form.payrollLines.map((line, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600">Payroll Line {i + 1}</span>
                          {form.payrollLines.length > 1 && (
                            <button onClick={() => set("payrollLines", form.payrollLines.filter((_, j) => j !== i))}
                              className="text-[10px] text-red-500 hover:text-red-700">Remove</button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Field label="Class Code">
                            <Select value={line.classCode} onChange={v => {
                              const cc = CLASS_CODES.find(c => c.code === v);
                              const updated = [...form.payrollLines];
                              updated[i] = { ...line, classCode: v, desc: cc?.desc ?? "" };
                              set("payrollLines", updated);
                            }}>
                              {CLASS_CODES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.desc}</option>)}
                            </Select>
                          </Field>
                          <Field label="Annual Payroll ($)" hint="Total payroll paid to workers in this class code during the policy year">
                            <Input value={line.payroll} onChange={v => {
                              const updated = [...form.payrollLines];
                              updated[i] = { ...line, payroll: v };
                              set("payrollLines", updated);
                            }} placeholder="240,000" />
                          </Field>
                          <Field label="Rate per $100">
                            <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 font-mono">
                              ${CLASS_CODES.find(c => c.code === line.classCode)?.rate.toFixed(2) ?? "—"}
                            </div>
                          </Field>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => set("payrollLines", [...form.payrollLines, { classCode: "8810", desc: "Clerical Office Employees", payroll: "" }])}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                      + Add Another Class Code
                    </button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-1">
                    <div className="text-xs font-semibold text-blue-700 mb-2">Preliminary Manual Premium</div>
                    {form.payrollLines.map((line, i) => {
                      const cc = CLASS_CODES.find(c => c.code === line.classCode);
                      const pay = parseFloat(line.payroll.replace(/,/g, "")) || 0;
                      const prem = cc ? Math.round((pay / 100) * cc.rate) : 0;
                      return (
                        <div key={i} className="flex justify-between text-xs text-blue-600">
                          <span>{line.classCode} — {cc?.desc}</span>
                          <span className="font-mono">${prem.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Step 2 — Loss History */}
              {step === 2 && (
                <>
                  <FinnTip text="Finn tip: 3 years of loss runs are required. If you don't have them, I can request them from your prior carrier on your behalf. Your experience mod (e-mod) reflects your loss history vs. the industry average — 1.00 is average, below 1.00 is better." />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Prior Carrier"><Input value={form.priorCarrier} onChange={v => set("priorCarrier", v)} placeholder="Hartford, Travelers, etc." /></Field>
                    <Field label="Prior Annual Premium ($)"><Input value={form.priorPremium} onChange={v => set("priorPremium", v)} placeholder="18,500" /></Field>
                    <Field label="Experience Mod Factor" required hint="Your e-mod from NCCI. Below 1.00 = favorable loss history. Above 1.00 = adverse. Check with your current carrier.">
                      <Input value={form.modFactor} onChange={v => set("modFactor", v)} placeholder="0.92" />
                    </Field>
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-gray-700">Loss Runs (3 Years)</div>
                    {form.lossYears.map((ly, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 grid grid-cols-3 gap-3">
                        <Field label="Policy Year"><div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 font-mono">{ly.year}</div></Field>
                        <Field label="# of Claims"><Input value={ly.claims} onChange={v => {
                          const updated = [...form.lossYears]; updated[i] = { ...ly, claims: v }; set("lossYears", updated);
                        }} placeholder="2" type="number" /></Field>
                        <Field label="Total Paid ($)"><Input value={ly.paid} onChange={v => {
                          const updated = [...form.lossYears]; updated[i] = { ...ly, paid: v }; set("lossYears", updated);
                        }} placeholder="12,400" /></Field>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Step 3 — Telematics Credit */}
              {step === 3 && (
                <>
                  <FinnTip text="Finn tip: Your Affinity RiskDrive score is the key differentiator. Operators with a score of 70+ qualify for a premium credit of 8–18%. This data is pulled directly from your telematics profile — no guessing required." />
                  <div className="flex items-center gap-3 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.hasTelematics} onChange={e => set("hasTelematics", e.target.checked)}
                        className="w-4 h-4 rounded accent-blue-600" />
                      <span className="text-sm font-medium text-gray-700">This operator uses Affinity RiskDrive telematics</span>
                    </label>
                  </div>
                  {form.hasTelematics && (
                    <>
                      <button onClick={() => set("riskdriveScore", DEMO_PREFILL.riskdriveScore)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors mb-4">
                        <Bot className="w-4 h-4" />
                        Import Score from RiskDrive Profile
                      </button>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Field label="RiskDrive Score" hint="Composite score 0–100. 70+ qualifies for telematics credit.">
                          <Input value={form.riskdriveScore} onChange={v => set("riskdriveScore", v)} placeholder="74" type="number" />
                        </Field>
                        <Field label="Critical Alerts (90d)"><Input value={form.criticalAlerts} onChange={v => set("criticalAlerts", v)} placeholder="4" type="number" /></Field>
                        <Field label="Warning Alerts (90d)"><Input value={form.warningAlerts} onChange={v => set("warningAlerts", v)} placeholder="14" type="number" /></Field>
                        <Field label="Exoneration Rate %" hint="% of claims where telematics data resulted in full exoneration"><Input value={form.exonerationRate} onChange={v => set("exonerationRate", v)} placeholder="25" type="number" /></Field>
                      </div>

                      {form.riskdriveScore && (
                        <div className={`rounded-xl p-4 border mt-2 ${
                          parseFloat(form.riskdriveScore) >= 80 ? "bg-emerald-50 border-emerald-200" :
                          parseFloat(form.riskdriveScore) >= 70 ? "bg-blue-50 border-blue-200" :
                          parseFloat(form.riskdriveScore) >= 60 ? "bg-amber-50 border-amber-200" :
                          "bg-gray-50 border-gray-200"
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className={`w-4 h-4 ${parseFloat(form.riskdriveScore) >= 70 ? "text-blue-600" : "text-gray-400"}`} />
                            <span className="text-sm font-semibold text-gray-700">Telematics Credit Estimate</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="text-2xl font-bold text-blue-600">
                                {parseFloat(form.riskdriveScore) >= 80 ? "18%" :
                                 parseFloat(form.riskdriveScore) >= 70 ? "14%" :
                                 parseFloat(form.riskdriveScore) >= 60 ? "8%" : "0%"}
                              </div>
                              <div className="text-xs text-gray-500">Premium credit applied</div>
                            </div>
                            {estimate.credit > 0 && (
                              <div>
                                <div className="text-2xl font-bold text-emerald-600">−${estimate.credit.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">Estimated savings</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {!form.hasTelematics && (
                    <div className="flex gap-2.5 bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-600">
                        Operators without Affinity RiskDrive are rated at standard market rates. Enrolling in RiskDrive typically saves 8–22% — ask Finn how to get started.
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Step 4 — Review */}
              {step === 4 && (
                <>
                  <FinnTip text="Finn tip: Review your information before submitting. Your Affinity Risk broker will contact you within 1 business day with market options. Final pricing is subject to underwriter review of your loss runs." />
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> Operator Information
                      </div>
                      {[
                        ["Company", form.companyName], ["EIN", form.fein], ["Owner", `${form.ownerName} — ${form.ownerTitle}`],
                        ["Location", `${form.city}, ${form.state} ${form.zip}`], ["Years in Business", form.yearsInBusiness],
                        ["# Drivers/Contractors", form.numDrivers],
                      ].map(([k, v]) => v && (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="text-gray-500">{k}</span><span className="font-medium text-gray-800">{v}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Premium Estimate</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Manual Premium (before mod)</span>
                        <span className="font-medium">${Math.round(estimate.gross / (parseFloat(form.modFactor) || 1)).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Experience Mod ({form.modFactor}×)</span>
                        <span className="font-medium">${estimate.gross.toLocaleString()}</span>
                      </div>
                      {estimate.credit > 0 && (
                        <div className="flex justify-between text-sm text-emerald-600">
                          <span>RiskDrive Telematics Credit</span>
                          <span className="font-semibold">−${estimate.credit.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 pt-2 flex justify-between">
                        <span className="font-bold text-gray-800">Estimated Annual Premium</span>
                        <span className="font-bold text-blue-600 text-lg">${estimate.net.toLocaleString()}</span>
                      </div>
                      {form.riskdriveScore && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                          <TrendingDown className="w-3 h-3" />
                          RiskDrive Score {form.riskdriveScore} — telematics credit applied
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 leading-relaxed">
                      <strong>Important:</strong> This is a preliminary estimate only. Final premium is subject to underwriter review, loss run verification, and market availability. Affinity Risk will submit to multiple carriers on your behalf to secure best-available terms.
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Navigation */}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-white transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setSubmitted(true)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Shield className="w-4 h-4" /> Submit Quote Request
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
