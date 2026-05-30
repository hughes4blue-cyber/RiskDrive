import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Shield, Bot, ChevronDown, Menu, X, BarChart3, Users, Car, Trophy,
  MessageSquareWarning, AlertTriangle, Scale, FileCheck, HardHat,
  FileText, DollarSign, BookOpen, Building2, Truck, ClipboardCheck,
  LayoutDashboard, Send, Satellite
} from "lucide-react";

const NAV = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Portal Home", href: "/" },
      { icon: BarChart3, label: "RiskDrive Score", href: "/fleet-score" },
    ],
  },
  {
    label: "Insurance",
    items: [
      { icon: HardHat, label: "Workers Comp Quote", href: "/wc-quote" },
      { icon: FileText, label: "Liability Placement", href: "/policies" },
      { icon: DollarSign, label: "Settlement", href: "/settlement" },
      { icon: BookOpen, label: "Safety Training", href: "/training" },
    ],
  },
  {
    label: "Fleet & Contractors",
    items: [
      { icon: Users, label: "Drivers", href: "/drivers" },
      { icon: Car, label: "Vehicles", href: "/vehicles" },
      { icon: Satellite, label: "Connect Telematics", href: "/connect-telematics" },
      { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
      { icon: MessageSquareWarning, label: "Driver Coaching", href: "/driver-feedback" },
    ],
  },
  {
    label: "Risk & Claims",
    items: [
      { icon: AlertTriangle, label: "Incidents", href: "/accidents" },
      { icon: Scale, label: "Claims TPA", href: "/claims" },
      { icon: FileCheck, label: "Certificates", href: "/certificates" },
    ],
  },
  {
    label: "AAA Network",
    items: [
      { icon: Building2, label: "Clubs", href: "/clubs" },
      { icon: Truck, label: "Tow Operators", href: "/facilities" },
      { icon: ClipboardCheck, label: "Onboarding", href: "/onboarding" },
    ],
  },
];

function NavDropdown({ section, location }: { section: typeof NAV[0]; location: string }) {
  const [open, setOpen] = useState(false);
  const isActive = section.items.some(i => i.href === "/" ? location === "/" : location.startsWith(i.href));

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive ? "bg-white/15 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"
        }`}
      >
        {section.label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50">
          {section.items.map(item => {
            const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${
                  active ? "bg-teal-50 text-teal-700 font-medium" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40" style={{ background: "linear-gradient(135deg, #0F2940 0%, #0D3D56 100%)" }}>
        <div className="px-4 md:px-6 h-14 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 mr-2">
            <img
              src="/brand/affinity-risk-logo.png"
              alt="Affinity Risk"
              className="h-9 w-auto"
              style={{ filter: "brightness(0) invert(1)", objectFit: "contain" }}
            />
            <div className="leading-tight hidden sm:block">
              <span className="text-white font-bold text-sm tracking-tight">RiskDrive</span>
              <span className="text-slate-400 text-[10px] ml-1.5">by Affinity Risk</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {NAV.map(section => (
              <NavDropdown key={section.label} section={section} location={location} />
            ))}
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/finn"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#E97132,#C85A1F)", color: "white" }}
            >
              <Bot className="w-3.5 h-3.5" />
              Ask Finn
            </Link>
            <Link
              href="/wc-quote"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/20"
            >
              <HardHat className="w-3.5 h-3.5" />
              WC Quote
            </Link>
            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white p-1.5 rounded-lg hover:bg-white/10">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-900 py-3 px-4 space-y-4">
            {NAV.map(section => (
              <div key={section.label}>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">{section.label}</div>
                {section.items.map(item => (
                  <Link key={item.href} href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Breadcrumb strip */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-teal-600 transition-colors font-medium text-slate-600">RiskDrive</Link>
        {location !== "/" && (
          <>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 capitalize">{location.replace(/^\//, "").replace(/-/g, " ") || "Home"}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-slate-400">All systems operational</span>
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="text-xs text-slate-400">
          © 2026 Affinity Risk Solutions · Powered by RiskDrive™ · Telematics-Based Insurance Intelligence
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <Link href="/finn" className="hover:text-teal-600">Ask Finn</Link>
          <Link href="/wc-quote" className="hover:text-teal-600">WC Quote</Link>
          <Link href="/fleet-score" className="hover:text-teal-600">RiskDrive Score</Link>
        </div>
      </footer>

      <FinnWidget />
    </div>
  );
}

/* ── Finn corner widget ──────────────────────────────────────────── */

const FINN_KB: { kw: string[]; reply: string }[] = [
  { kw: ["workers comp","wc","work comp"], reply: "WC for tow operators is rated on actual payroll — not guesses. Your RiskDrive telematics data gives underwriters a real picture. Operators with clean data save 8–22% vs. standard market. Head to WC Quote and I'll help pre-fill it." },
  { kw: ["score","riskdrive"], reply: "Your RiskDrive Score = Safety (40%) + Compliance (30%) + Telematics (20%) + Training (10%). Score 70+ unlocks preferred carrier markets and lower tier premiums. Want tips to improve fastest?" },
  { kw: ["1099","contractor","w2"], reply: "Affinity RiskDrive scores each contractor independently. Data is used for insurance rating only — never to direct work schedules or assign jobs, which would risk W2 reclassification." },
  { kw: ["claim","accident","exonerat"], reply: "On any incident, RiskDrive immediately secures telematics data and dashcam clips. This evidence packet is the difference between a $74K claim and a $0 exoneration. Our network exoneration rate is 25%." },
];
const FINN_DEFAULT = "I help tow operators and AAA clubs with WC quotes, RiskDrive scores, 1099 compliance, and claims. What do you need?";
function finnReply(t: string) { const l = t.toLowerCase(); return FINN_KB.find(e => e.kw.some(k => l.includes(k)))?.reply ?? FINN_DEFAULT; }

function FinnWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<{ r: "finn"|"user"; t: string }[]>([
    { r: "finn", t: "Hi! I'm Finn — your Affinity Risk AI guide. Ask me about WC quotes, your RiskDrive score, or 1099 compliance." }
  ]);

  function send() {
    const t = input.trim(); if (!t) return;
    setMsgs(p => [...p, { r: "user", t }]);
    setInput("");
    setTimeout(() => setMsgs(p => [...p, { r: "finn", t: finnReply(t) }]), 500);
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open Finn AI"
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        style={{ background: "linear-gradient(135deg,#E97132,#C85A1F)", border: "2px solid rgba(255,255,255,0.25)" }}
      >
        {open ? <X className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" style={{ width: 320, height: 420 }}>
          <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0" style={{ background: "linear-gradient(135deg,#E97132,#C85A1F)" }}>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"><Bot className="w-3.5 h-3.5 text-white" /></div>
            <div>
              <div className="text-white font-bold text-sm">Finn</div>
              <div className="text-orange-100 text-[10px]">RiskDrive AI Guide</div>
            </div>
            <div className="ml-auto flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-300" /><span className="text-orange-100 text-[10px]">Online</span></div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50">
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.r === "user" ? "flex-row-reverse" : ""}`}>
                {m.r === "finn" && <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0"><Bot className="w-3 h-3 text-orange-600" /></div>}
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${m.r === "finn" ? "bg-white border border-slate-200 text-slate-700 rounded-tl-sm" : "text-white rounded-tr-sm"}`} style={m.r === "user" ? { background: "linear-gradient(135deg,#E97132,#C85A1F)" } : {}}>{m.t}</div>
              </div>
            ))}
          </div>

          <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto flex-shrink-0">
            {["WC Quote", "My Score", "1099 Tips"].map(p => (
              <button key={p} onClick={() => setInput(p)} className="flex-shrink-0 text-[10px] px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors">{p}</button>
            ))}
          </div>

          <div className="px-3 py-2.5 bg-white border-t border-slate-100 flex gap-2 flex-shrink-0">
            <input className="flex-1 text-xs px-3 py-1.5 rounded-full border border-slate-200 outline-none bg-slate-50 focus:border-orange-400" placeholder="Ask Finn..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
            <button onClick={send} className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#E97132" }}>
              <Send className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Shared primitives ───────────────────────────────────────────── */

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-5 flex items-start justify-between">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5 max-w-2xl">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 ml-4 flex-shrink-0">{children}</div>}
    </div>
  );
}

export function riskTier(score: number): string {
  if (score < 30) return "low";
  if (score < 55) return "moderate";
  if (score < 75) return "high";
  return "critical";
}

export function RiskBadge({ score, tier }: { score?: number; tier?: string }) {
  const t = tier ?? riskTier(score ?? 0);
  const cfg = { low: "bg-emerald-100 text-emerald-700 border-emerald-200", moderate: "bg-amber-100 text-amber-700 border-amber-200", high: "bg-orange-100 text-orange-700 border-orange-200", critical: "bg-red-100 text-red-700 border-red-200" }[t] ?? "bg-slate-100 text-slate-700 border-slate-200";
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg}`}>{score !== undefined && <span>{Math.round(score)}</span>}<span className="capitalize">{t}</span></span>;
}

export function RiskBar({ score }: { score: number }) {
  const color = score < 30 ? "bg-emerald-500" : score < 55 ? "bg-amber-500" : score < 75 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(score, 100)}%` }} /></div>
      <span className="text-xs font-mono text-slate-400 w-7 text-right">{Math.round(score)}</span>
    </div>
  );
}

export function CertBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = { current: "bg-emerald-100 text-emerald-700 border-emerald-200", expiring_soon: "bg-amber-100 text-amber-700 border-amber-200", expired: "bg-red-100 text-red-700 border-red-200", missing: "bg-slate-100 text-slate-700 border-slate-200" };
  const lbl: Record<string, string> = { current: "Current", expiring_soon: "Expiring Soon", expired: "Expired", missing: "Missing" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg[status] ?? cfg.missing}`}>{lbl[status] ?? status}</span>;
}

export function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color ?? "text-slate-900"}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}
