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

const STEPS = ["Operator Info", "Payroll & Class Codes", "Loss History", "Telematics Setup", "Payment Plan", "Review & Submit"];

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
  hasExistingTelematics: boolean;
  telematicsProvider: string;
  wantsPartnerTelematics: boolean;
  paymentFrequency: "annual" | "quarterly" | "monthly" | "weekly";
  usePayrollCompany: boolean;
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
  hasExistingTelematics: false,
  telematicsProvider: "",
  wantsPartnerTelematics: false,
  paymentFrequency: "monthly",
  usePayrollCompany: false,
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
    <div className="flex gap-2.5 bg-orange-50 border border-orange-200 rounded-xl p-3">
      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "linear-gradient(135deg,#E97132,#C85A1F)" }}>
        <Bot className="w-3 h-3 text-white" />
      </div>
      <p className="text-xs text-orange-900 leading-relaxed">{text}</p>
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

function computeEstimate(form: FormData): { manual: number; gross: number; mod: number } {
  const mod = parseFloat(form.modFactor) || 1.0;
  let manual = 0;
  for (const line of form.payrollLines) {
    const cc = CLASS_CODES.find(c => c.code === line.classCode);
    const payroll = parseFloat(line.payroll.replace(/,/g, "")) || 0;
    if (cc) manual += (payroll / 100) * cc.rate;
  }
  const gross = Math.round(manual * mod);
  return { manual: Math.round(manual), gross, mod };
}

export default function WCQuote() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function prefillDemoData() {
    setForm(prev => ({
      ...prev,
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
        <PageHeader title="Workers Comp Quote" subtitle="AmTrust Program — Workers Compensation designed for towing contractors and 1099 operators" />
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
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AmTrust Preliminary Estimate</div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Manual Premium (before mod)</span>
                <span className="font-semibold">${estimate.manual.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Experience Mod ({form.modFactor}×)</span>
                <span className={`font-semibold ${estimate.mod < 1 ? "text-emerald-600" : estimate.mod > 1 ? "text-red-600" : "text-gray-800"}`}>
                  {estimate.mod < 1 ? "Credit" : estimate.mod > 1 ? "Debit" : "Neutral"}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Estimated Annual Premium</span>
                <span className="font-bold text-blue-600 text-lg">${estimate.gross.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left space-y-2">
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Next Steps</div>
              {form.hasExistingTelematics ? (
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your WC quote data will be <strong>preloaded into {form.telematicsProvider || "your telematics platform"} via API</strong> — no double entry required. Your Affinity Risk rep will confirm connectivity within 24 hours.
                </p>
              ) : (
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Interested in telematics? Affinity Risk can connect you with a <strong>partner telematics solution at a discounted rate</strong> — ask Finn or your rep for details.
                </p>
              )}
            </div>
            <FinnTip text="Your Affinity Risk broker will confirm final pricing after reviewing your loss runs and submitting to AmTrust and competing markets. Final premium is subject to underwriter review." />
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
        subtitle="AmTrust Program — Workers Compensation designed for towing contractors and 1099 operators"
      />

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Step indicator */}
          <div className="overflow-x-auto">
            <StepIndicator step={step} total={STEPS.length} />
          </div>

          {/* Banner */}
          {step === 0 && (
            <div className="rounded-xl px-5 py-4 text-white" style={{ background: "linear-gradient(135deg,#0F2940,#0D3D56)" }}>
              <div className="flex items-center gap-3 mb-2">
                <HardHat className="w-5 h-5 opacity-80" />
                <span className="font-bold">AmTrust Workers Comp · Towing Contractor Edition</span>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed">
                Affinity Risk places WC through AmTrust's dedicated towing contractor program — payroll and class-code rated with competitive experience modification factors. Covers 1099 contractors, owner-operators, and full-time employees on a single policy.
              </p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: "Program", value: "AmTrust" },
                  { label: "Class Codes", value: "7383+" },
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
                  <FinnTip text="Finn tip: I can pre-fill your company info with demo data so you can explore the quote flow quickly. Click below to auto-populate key fields." />
                  <button onClick={prefillDemoData}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm font-medium hover:bg-orange-100 transition-colors">
                    <Bot className="w-4 h-4" />
                    Pre-fill Demo Data
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

              {/* Step 3 — Telematics Setup */}
              {step === 3 && (
                <>
                  <FinnTip text="Finn tip: After your WC quote is bound, Affinity Risk can preload your policy data directly into your telematics platform via API — eliminating double-entry. If you don't have telematics yet, we can connect you with a partner solution at a discounted rate." />

                  <div className="space-y-5">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">Do you currently use a telematics platform?</p>
                      <div className="flex gap-3">
                        <label className="flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                          style={form.hasExistingTelematics ? { borderColor: "#E97132", background: "#fff7f2" } : { borderColor: "#e2e8f0", background: "#f8fafc" }}>
                          <input type="radio" name="hasTelematics" checked={form.hasExistingTelematics}
                            onChange={() => set("hasExistingTelematics", true)} className="accent-orange-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-800">Yes — I use a telematics platform</div>
                            <div className="text-xs text-gray-500">We'll connect via API after binding</div>
                          </div>
                        </label>
                        <label className="flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                          style={!form.hasExistingTelematics ? { borderColor: "#E97132", background: "#fff7f2" } : { borderColor: "#e2e8f0", background: "#f8fafc" }}>
                          <input type="radio" name="hasTelematics" checked={!form.hasExistingTelematics}
                            onChange={() => { set("hasExistingTelematics", false); set("telematicsProvider", ""); }} className="accent-orange-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-800">No — I don't have telematics</div>
                            <div className="text-xs text-gray-500">Ask about our partner discount</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {form.hasExistingTelematics && (
                      <div className="space-y-4">
                        <Field label="Telematics Provider Name" hint="e.g. Samsara, Verizon Connect, Motive, Geotab, RiskDrive">
                          <Input value={form.telematicsProvider} onChange={v => set("telematicsProvider", v)} placeholder="e.g. Samsara" />
                        </Field>
                        <div className="flex gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            After your policy binds, Affinity Risk will preload your WC policy data into <strong>{form.telematicsProvider || "your platform"}</strong> via API — driver rosters, class codes, and certificate details sync automatically with no double-entry required.
                          </div>
                        </div>
                      </div>
                    )}

                    {!form.hasExistingTelematics && (
                      <div className="space-y-4">
                        <div className="flex gap-2.5 bg-orange-50 border border-orange-200 rounded-xl p-4">
                          <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-orange-900">
                            Telematics is the backbone of the <strong>RiskDrive Liability platform</strong>. Operators who add telematics unlock real-time driver scoring, incident exoneration data, and future liability premium credits.
                          </div>
                        </div>
                        <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                          <input type="checkbox" checked={form.wantsPartnerTelematics}
                            onChange={e => set("wantsPartnerTelematics", e.target.checked)}
                            className="mt-0.5 accent-orange-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-800">Yes — I'm interested in Affinity Risk's partner telematics solution</div>
                            <div className="text-xs text-gray-500 mt-0.5">Discounted hardware + activation for AmTrust WC policyholders. Your rep will share options after binding.</div>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Step 4 — Payment Plan */}
              {step === 4 && (
                <>
                  <FinnTip text="Finn tip: AmTrust owns payroll processing companies — so towing contractors can pay WC premiums directly through payroll, weekly or monthly. Pay-as-you-go means your premium adjusts with actual payroll, eliminating year-end audit surprises." />

                  {/* Payment frequency cards */}
                  <div>
                    <p className="text-sm font-semibold text-gray-800 mb-3">How would you like to pay your premium?</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {([
                        {
                          id: "weekly" as const,
                          label: "Weekly",
                          tag: "Most popular",
                          desc: "Pay with your weekly payroll run — premium adjusts to actual labor costs",
                          highlight: true,
                        },
                        {
                          id: "monthly" as const,
                          label: "Monthly",
                          tag: "Recommended",
                          desc: "12 equal payments via AmTrust payroll system",
                          highlight: false,
                        },
                        {
                          id: "quarterly" as const,
                          label: "Quarterly",
                          tag: "",
                          desc: "4 payments per year — simple and predictable",
                          highlight: false,
                        },
                        {
                          id: "annual" as const,
                          label: "Annual",
                          tag: "5% discount",
                          desc: "Full premium upfront — best rate, larger cash outlay",
                          highlight: false,
                        },
                      ] as const).map((opt) => (
                        <label
                          key={opt.id}
                          className={`relative flex flex-col gap-1.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            form.paymentFrequency === opt.id
                              ? "border-orange-400 bg-orange-50"
                              : "border-gray-200 bg-gray-50 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentFrequency"
                            value={opt.id}
                            checked={form.paymentFrequency === opt.id}
                            onChange={() => set("paymentFrequency", opt.id)}
                            className="sr-only"
                          />
                          {opt.tag && (
                            <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              opt.highlight ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                            }`}>
                              {opt.tag}
                            </span>
                          )}
                          <span className="font-bold text-sm text-gray-900">{opt.label}</span>
                          <span className="text-[11px] text-gray-500 leading-relaxed">{opt.desc}</span>
                          {form.paymentFrequency === opt.id && (
                            <span className="text-[10px] text-orange-600 font-semibold">Selected ✓</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* AmTrust payroll company option */}
                  {(form.paymentFrequency === "weekly" || form.paymentFrequency === "monthly") && (
                    <div className="space-y-3">
                      <div className="rounded-xl overflow-hidden border border-blue-200">
                        <div className="bg-blue-700 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <HardHat className="w-4 h-4 text-white" />
                            <span className="text-white font-bold text-sm">AmTrust Payroll Integration</span>
                          </div>
                          <span className="text-blue-200 text-[10px] font-semibold uppercase tracking-wide">AmTrust Program</span>
                        </div>
                        <div className="bg-white p-4 space-y-3">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            AmTrust owns payroll processing companies that integrate WC premium payments directly into
                            your payroll run. Premium adjusts automatically each cycle based on <strong>actual payroll</strong> —
                            no year-end audits, no surprise bills, no large upfront capital required.
                          </p>

                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { icon: "✓", label: "No year-end audit surprises", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                              { icon: "✓", label: "Premium adjusts with actual payroll", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                              { icon: "✓", label: "Add/remove drivers — premium updates automatically", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                              { icon: "✓", label: "Same carrier — AmTrust program maintained", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                            ].map((item) => (
                              <div key={item.label} className={`flex items-start gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${item.color}`}>
                                <span className="font-bold flex-shrink-0">{item.icon}</span>
                                {item.label}
                              </div>
                            ))}
                          </div>

                          <label className="flex items-start gap-3 p-3 rounded-xl border border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors">
                            <input
                              type="checkbox"
                              checked={form.usePayrollCompany}
                              onChange={(e) => set("usePayrollCompany", e.target.checked)}
                              className="mt-0.5 accent-orange-500"
                            />
                            <div>
                              <div className="text-sm font-semibold text-blue-900">
                                Yes — I want to pay through AmTrust's payroll company
                              </div>
                              <div className="text-xs text-blue-700 mt-0.5">
                                Your Affinity Risk rep will set up the integration after policy binds. Takes 1–2 business days.
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Estimated payment schedule */}
                  {estimate.gross > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Estimated Payment Schedule</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Annual premium estimate</span>
                        <span className="font-bold text-gray-800">${estimate.gross.toLocaleString()}</span>
                      </div>
                      {form.paymentFrequency === "annual" && (
                        <div className="flex justify-between text-sm">
                          <span className="text-emerald-600 font-medium">Annual payment (5% credit)</span>
                          <span className="font-bold text-emerald-700">${Math.round(estimate.gross * 0.95).toLocaleString()}</span>
                        </div>
                      )}
                      {form.paymentFrequency === "quarterly" && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Per quarter (×4)</span>
                          <span className="font-semibold">${Math.round(estimate.gross / 4).toLocaleString()}</span>
                        </div>
                      )}
                      {form.paymentFrequency === "monthly" && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Per month (×12)</span>
                          <span className="font-semibold">${Math.round(estimate.gross / 12).toLocaleString()}</span>
                        </div>
                      )}
                      {form.paymentFrequency === "weekly" && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Est. weekly payment</span>
                            <span className="font-semibold">${Math.round(estimate.gross / 52).toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            Actual weekly amount adjusts based on reported payroll — this estimate is based on your entered payroll.
                          </div>
                        </>
                      )}
                      <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-200">
                        Subject to underwriter review. Final premium may vary. Experience mod applied.
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Step 5 — Review */}
              {step === 5 && (
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
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">AmTrust Premium Estimate</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Manual Premium (before mod)</span>
                        <span className="font-medium">${estimate.manual.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Experience Mod ({form.modFactor}×)</span>
                        <span className={`font-medium ${estimate.mod < 1 ? "text-emerald-600" : estimate.mod > 1 ? "text-red-600" : "text-gray-700"}`}>
                          {estimate.mod < 1 ? "Credit" : estimate.mod > 1 ? "Debit" : "Neutral"}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 flex justify-between">
                        <span className="font-bold text-gray-800">Estimated Annual Premium</span>
                        <span className="font-bold text-blue-600 text-lg">${estimate.gross.toLocaleString()}</span>
                      </div>
                      {form.hasExistingTelematics && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600">
                          <Shield className="w-3 h-3" />
                          Telematics API connection: {form.telematicsProvider || "provider TBD"} — data preload after binding
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
