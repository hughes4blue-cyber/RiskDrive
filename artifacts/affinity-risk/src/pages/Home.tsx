import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  HardHat, BarChart3, Bot, ArrowRight, Shield, TrendingDown,
  AlertTriangle, CheckCircle2, Clock, Users, Car, Scale,
  ChevronRight, Zap, FileText
} from "lucide-react";

interface Overview {
  totalFacilities: number;
  totalDrivers: number;
  totalVehicles: number;
  avgPlatformRiskScore: number;
  openAccidents: number;
  certificatesExpiringSoon: number;
  totalMilesMonitored: number;
  premiumAtRisk: number;
  totalClubs: number;
}

export default function Home() {
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/overview")
      .then(r => r.json())
      .then(setOverview)
      .catch(() => {});
  }, []);

  const rawScore = overview ? parseFloat(String(overview.avgPlatformRiskScore)) : null;
  const score = rawScore !== null && !isNaN(rawScore) ? Math.round(rawScore) : null;
  const scoreTier = score === null ? null : score >= 70 ? "preferred" : score >= 55 ? "standard" : "limited";
  const scoreColor = scoreTier === "preferred" ? "#10B981" : scoreTier === "standard" ? "#E97132" : "#EF4444";

  return (
    <div className="min-h-full">

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0F2940 0%, #0D3D56 60%, #0A4D6B 100%)" }}>
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative max-w-6xl mx-auto px-6 py-14">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10">

            {/* Left — headline */}
            <div className="flex-1 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-semibold">
                <HardHat className="w-3 h-3" />
                AmTrust Program · Towing Contractor Edition
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
                Workers Comp<br />
                <span style={{ color: "#E97132" }}>Built for Tow Operators.</span>
              </h1>

              <p className="text-slate-300 text-lg leading-relaxed max-w-xl">
                AmTrust has created a Workers Comp product specifically for towing contractors
                and their 1099 operators — rated on actual payroll by class code, with
                <strong className="text-white"> 6+ competing carriers</strong> and 24-hour quote turnaround.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/wc-quote"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  style={{ background: "linear-gradient(135deg,#E97132,#C85A1F)" }}
                >
                  <HardHat className="w-4 h-4" />
                  Start My WC Quote
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/fleet-score"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  View RiskDrive Score
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 pt-2">
                {[
                  { label: "Avg. Savings", value: "14%" },
                  { label: "Carrier Markets", value: "6+" },
                  { label: "Quote Turnaround", value: "24h" },
                  { label: "1099 Inclusive", value: "✓" },
                ].map(b => (
                  <div key={b.label} className="text-center">
                    <div className="text-xl font-extrabold text-white">{b.value}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">{b.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — AmTrust WC program card */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                    <HardHat className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">AmTrust WC Program</div>
                    <div className="text-slate-400 text-[10px]">Towing Contractor Edition</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    "Payroll-based class code rating",
                    "1099 towing contractors fully included",
                    "6+ competing carrier markets",
                    "Experience mod (e-mod) factored in",
                    "Loss run analysis included",
                  ].map(item => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-xs leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-4 space-y-1.5">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Key Class Codes</div>
                  {[
                    { code: "7383", label: "Emergency Roadside Towing" },
                    { code: "7382", label: "Auto Service & Towing" },
                    { code: "8810", label: "Clerical Office" },
                  ].map(c => (
                    <div key={c.code} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-orange-300 font-semibold">{c.code}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-300">{c.label}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-emerald-500/15 border border-emerald-400/25 rounded-xl px-3 py-3">
                  <div className="text-emerald-300 text-[10px] font-semibold uppercase tracking-wide mb-1">After Your Quote</div>
                  <div className="text-slate-300 text-xs leading-relaxed">
                    WC data preloaded into your telematics platform via API — or get a
                    <span className="text-white font-medium"> discounted partner telematics solution</span>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ───────────────────────────────────────── */}
      {overview && (
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 py-4 grid grid-cols-2 md:grid-cols-6 gap-4 divide-x divide-slate-100">
            {[
              { icon: Building2Like, label: "AAA Clubs", value: overview.totalClubs, color: "text-slate-900" },
              { icon: TruckLike, label: "Tow Operators", value: overview.totalFacilities, color: "text-slate-900" },
              { icon: Users, label: "Drivers", value: overview.totalDrivers, color: "text-slate-900" },
              { icon: Car, label: "Vehicles", value: overview.totalVehicles, color: "text-slate-900" },
              { icon: AlertTriangle, label: "Open Claims", value: overview.openAccidents, color: "text-red-600" },
              { icon: TrendingDown, label: "TCOR Exposure", value: overview.premiumAtRisk ? `$${Math.round(overview.premiumAtRisk / 1000)}K` : "—", color: "text-orange-600" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-3 px-4 first:pl-0 last:pr-0">
                <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <div className={`text-lg font-bold leading-tight ${color}`}>{value}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Main grid ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* WC Quote CTA card — full width on mobile, 2/3 on desktop */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0F2940,#0D3D56)" }}>
                <HardHat className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Workers Comp Quote</div>
                <div className="text-xs text-slate-500">AmTrust Program · Multi-carrier · 24h turnaround</div>
              </div>
            </div>
            <Link href="/wc-quote" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              Full application <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left col — why RiskDrive WC */}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                AmTrust's dedicated towing contractor program — payroll and class-code rated. After binding, your WC data <strong>preloads directly into your telematics platform</strong> (Samsara, Geotab, Motive, etc.) via API, or we can provide a partner solution.
              </p>
              <div className="space-y-2.5">
                {[
                  { icon: CheckCircle2, text: "Rated on payroll by class code — AmTrust program", color: "text-emerald-500" },
                  { icon: CheckCircle2, text: "WC data preloads into your telematics platform via API", color: "text-emerald-500" },
                  { icon: CheckCircle2, text: "Covers 1099 contractors, owner-operators & W-2 staff", color: "text-emerald-500" },
                  { icon: CheckCircle2, text: "Multi-market submission — best terms, 24h turnaround", color: "text-emerald-500" },
                ].map(({ icon: Icon, text, color }) => (
                  <div key={text} className="flex items-start gap-2">
                    <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${color}`} />
                    <span className="text-xs text-slate-600">{text}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/wc-quote"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white mt-1 shadow-md hover:shadow-lg transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,#E97132,#C85A1F)" }}
              >
                <HardHat className="w-4 h-4" />
                Start WC Application
              </Link>
            </div>

            {/* Right col — class code preview */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Common Class Codes</div>
              {[
                { code: "7383", desc: "Emergency Roadside Towing", rate: 7.29 },
                { code: "7382", desc: "Auto Service & Towing", rate: 6.14 },
                { code: "7380", desc: "Chauffeurs & Messengers", rate: 4.82 },
                { code: "8810", desc: "Clerical Office", rate: 0.28 },
              ].map(c => (
                <div key={c.code} className="flex items-center justify-between py-1 border-b border-slate-200 last:border-0">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-700">{c.code}</span>
                    <span className="text-xs text-slate-500 ml-2">{c.desc}</span>
                  </div>
                  <span className="text-xs font-bold text-teal-700">${c.rate.toFixed(2)}/$100</span>
                </div>
              ))}
              <div className="text-[10px] text-slate-400 pt-1">Rate per $100 of payroll · Subject to experience mod</div>
            </div>
          </div>
        </div>

        {/* Finn quick-chat panel */}
        <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5"
            style={{ background: "linear-gradient(135deg,#E97132,#C85A1F)" }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Ask Finn</div>
              <div className="text-orange-100 text-[10px]">RiskDrive AI Guide</div>
            </div>
            <Link href="/finn" className="ml-auto text-[10px] text-orange-100 hover:text-white flex items-center gap-0.5">
              Full chat <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <FinnInline />
        </div>

        {/* Quick navigation tiles */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: "/fleet-score", icon: BarChart3, label: "RiskDrive Score", desc: "Composite scores per operator", accent: "#0D3D56" },
            { href: "/claims", icon: Scale, label: "Claims TPA", desc: "Open FNOL & pipeline", accent: "#DC2626" },
            { href: "/drivers", icon: Users, label: "Drivers", desc: "Scorecards & telematics", accent: "#7C3AED" },
            { href: "/policies", icon: FileText, label: "Liability Placement", desc: "Submission pipeline", accent: "#0891B2" },
          ].map(({ href, icon: Icon, label, desc, accent }) => (
            <Link
              key={href}
              href={href}
              className="group bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 hover:shadow-md hover:border-slate-300 transition-all"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                style={{ background: accent + "18" }}>
                <Icon className="w-4 h-4" style={{ color: accent }} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">{label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 ml-auto self-center flex-shrink-0" />
            </Link>
          ))}
        </div>

        {/* Recent activity / alerts */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              What Needs Attention
            </div>
            <Link href="/accidents" className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { color: "bg-red-500", label: "Open FNOL", value: overview?.openAccidents ?? "—", desc: "claims pending TPA action", href: "/claims", urgent: true },
              { color: "bg-orange-500", label: "COIs Expiring", value: overview?.certificatesExpiringSoon ?? "—", desc: "certificates need renewal within 30 days", href: "/certificates", urgent: false },
              { color: "bg-blue-500", label: "Miles Monitored", value: overview ? `${(overview.totalMilesMonitored / 1000).toFixed(0)}K` : "—", desc: "real-time telematics across network", href: "/fleet-score", urgent: false },
            ].map(item => (
              <Link key={item.label} href={item.href} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors group">
                <div className={`w-2 h-8 rounded-full flex-shrink-0 ${item.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{item.label}</span>
                    {item.urgent && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">Action needed</span>}
                  </div>
                  <div className="text-xs text-slate-500">{item.value} {item.desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

/* Inline stat strip icon stubs */
function Building2Like({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>;
}
function TruckLike({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
}

/* Finn inline mini-chat */
function FinnInline() {
  const [msgs, setMsgs] = useState<{ r: "finn" | "user"; t: string }[]>([
    { r: "finn", t: "Hi! Ask me anything about WC quotes, your RiskDrive score, or 1099 compliance." }
  ]);
  const [input, setInput] = useState("");

  const KB: { kw: string[]; t: string }[] = [
    { kw: ["wc","workers comp","quote"], t: "Head to the WC Quote page to start an AmTrust application. After your policy binds, your WC data preloads into your telematics platform via API — or we can set you up with a partner solution." },
    { kw: ["score","riskdrive"], t: "Your RiskDrive Score = Safety (40%) + Compliance (30%) + Telematics (20%) + Training (10%). Score 70+ unlocks preferred markets." },
    { kw: ["1099","contractor"], t: "RiskDrive scores each 1099 operator individually. That data is for insurance rating only — never used to control schedules, which would risk reclassification." },
  ];
  const fallback = "I can help with WC quotes, RiskDrive scores, 1099 compliance, claims, and carrier access. What do you need?";

  function send() {
    const t = input.trim(); if (!t) return;
    setMsgs(p => [...p, { r: "user" as const, t }]);
    setInput("");
    const lower = t.toLowerCase();
    const reply = KB.find(e => e.kw.some(k => lower.includes(k)))?.t ?? fallback;
    setTimeout(() => setMsgs(p => [...p, { r: "finn" as const, t: reply }]), 450);
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.r === "user" ? "flex-row-reverse" : ""}`}>
            {m.r === "finn" && <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5"><Bot className="w-3 h-3 text-orange-600" /></div>}
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${m.r === "finn" ? "bg-white border border-slate-200 text-slate-700 rounded-tl-sm" : "text-white rounded-tr-sm"}`}
              style={m.r === "user" ? { background: "linear-gradient(135deg,#E97132,#C85A1F)" } : {}}>
              {m.t}
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 py-2.5 bg-white border-t border-slate-100 flex gap-2">
        <input
          className="flex-1 text-xs px-3 py-1.5 rounded-full border border-slate-200 outline-none bg-slate-50 focus:border-orange-400"
          placeholder="Ask Finn..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
        />
        <button onClick={send} className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:opacity-90" style={{ background: "#E97132" }}>
          <svg className="w-3 h-3 text-white fill-white" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
    </div>
  );
}
