import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import {
  Bot, Menu, X, BarChart3, Users, Car, Trophy,
  MessageSquareWarning, AlertTriangle, Scale, FileCheck, HardHat,
  FileText, DollarSign, BookOpen, Building2, Truck, ClipboardCheck,
  LayoutDashboard, Send, Satellite, LogIn, LogOut, Settings,
  ToggleLeft, ToggleRight,
} from "lucide-react";
import { useGetCurrentUser, useGetAppMode } from "@workspace/api-client-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const NAV = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Portal Home", href: "/" },
      { icon: BarChart3, label: "RiskDrive™ Score", href: "/fleet-score" },
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

function SidebarAuthSection() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const { data: meData } = useGetCurrentUser();
  const { data: modeData } = useGetAppMode();

  const mode = modeData?.mode ?? (meData as { mode?: string } | undefined)?.mode ?? "demo";
  const appUser = meData?.user;

  const roleLabel =
    appUser?.role === "super_admin" ? "Affinity Risk Admin" :
    appUser?.role === "club" ? "AAA Club Admin" :
    appUser?.role === "shop_owner" ? "Shop Owner" :
    "Pending Approval";

  const initials = (
    user?.firstName?.[0] ??
    user?.emailAddresses?.[0]?.emailAddress?.[0] ??
    "?"
  ).toUpperCase();

  return (
    <div className="px-3 pb-2 space-y-2 flex-shrink-0 border-b border-white/10 mb-1">
      {/* Demo / Live badge */}
      <div
        className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 ${
          mode === "live"
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            : "bg-amber-500/15 border-amber-500/30 text-amber-400"
        }`}
      >
        {mode === "live"
          ? <ToggleRight className="w-3 h-3" />
          : <ToggleLeft className="w-3 h-3" />}
        {mode === "live" ? "LIVE MODE" : "DEMO MODE"}
        <span className="ml-auto text-[9px] opacity-60">
          {mode === "demo" ? "No login required" : "Auth required"}
        </span>
      </div>

      {/* User info or sign-in prompt */}
      {isLoaded && (
        isSignedIn ? (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/8">
            <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-[11px] font-medium truncate">
                {user?.firstName
                  ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
                  : user?.emailAddresses?.[0]?.emailAddress ?? "User"}
              </div>
              <div className="text-slate-500 text-[9px]">{roleLabel}</div>
            </div>
            <div className="flex gap-0.5 flex-shrink-0">
              {appUser?.role === "super_admin" && (
                <Link
                  href="/admin"
                  className="p-1 rounded text-slate-500 hover:text-white transition-colors"
                  title="Admin Console"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Link>
              )}
              <button
                onClick={() => void signOut({ redirectUrl: basePath || "/" })}
                className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/sign-in"
            className="flex items-center gap-2 p-2 rounded-lg bg-white/8 text-slate-400 hover:text-white hover:bg-white/12 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Sign in to RiskDrive™</span>
          </Link>
        )
      )}
    </div>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location] = useLocation();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-56 z-30 flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ background: "linear-gradient(180deg,#0F2940 0%,#0A3550 100%)" }}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/10 flex items-center gap-2.5 flex-shrink-0">
          <img
            src="/brand/affinity-risk-logo.png"
            alt="Affinity Risk"
            className="h-8 w-auto flex-shrink-0"
            style={{ filter: "brightness(0) invert(1)", objectFit: "contain" }}
          />
          <div className="leading-tight min-w-0">
            <div className="text-white font-extrabold text-sm tracking-tight">RiskDrive™</div>
            <div className="text-slate-400 text-[11px] font-medium">by Affinity Risk</div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto md:hidden text-slate-500 hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-5">
          {NAV.map((section) => (
            <div key={section.label}>
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 px-2 mb-1.5">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    item.href === "/"
                      ? location === "/"
                      : location.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        if (open) onClose();
                      }}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors ${
                        active
                          ? "bg-white/15 text-white"
                          : "text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <item.icon
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={active ? { color: "#E97132" } : {}}
                      />
                      <span className={active ? "text-white" : ""}>{item.label}</span>
                      {active && (
                        <span
                          className="ml-auto w-1 h-1 rounded-full flex-shrink-0"
                          style={{ background: "#E97132" }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <SidebarAuthSection />

        {/* Bottom CTAs */}
        <div className="p-3 border-t border-white/10 space-y-2 flex-shrink-0">
          <Link
            href="/finn"
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#E97132,#C85A1F)" }}
          >
            <Bot className="w-3.5 h-3.5" />
            Ask Finn
          </Link>
          <Link
            href="/wc-quote"
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
          >
            <HardHat className="w-3.5 h-3.5" />
            WC Quote
          </Link>
        </div>
      </aside>
    </>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageName =
    location === "/"
      ? "Portal Home"
      : NAV.flatMap((s) => s.items).find(
            (i) => i.href !== "/" && location.startsWith(i.href)
          )?.label ??
        location
          .replace(/^\//, "")
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-56">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-12 flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="md:hidden flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">RiskDrive™</span>
          </Link>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-orange-500 font-semibold text-slate-700 transition-colors">
              RiskDrive™
            </Link>
            {location !== "/" && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">{pageName}</span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400 hidden sm:block">All systems operational</span>
            </div>
            <Link
              href="/finn"
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: "#E97132" }}
            >
              <Bot className="w-3 h-3" /> Finn
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            © 2026 Affinity Risk Solutions · Powered by RiskDrive™ · Telematics-Based Insurance Intelligence
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <a href="mailto:hello@affinityriskdrive.com" className="hover:text-orange-500 transition-colors">hello@affinityriskdrive.com</a>
            <Link href="/finn" className="hover:text-orange-500 transition-colors">Ask Finn</Link>
            <Link href="/wc-quote" className="hover:text-orange-500 transition-colors">WC Quote</Link>
            <Link href="/fleet-score" className="hover:text-orange-500 transition-colors">RiskDrive™ Score</Link>
          </div>
        </footer>
      </div>

      <FinnWidget />
    </div>
  );
}

/* ── Finn corner widget ──────────────────────────────────────────── */

const FINN_KB: { kw: string[]; reply: string }[] = [
  { kw: ["workers comp", "wc", "work comp"], reply: "WC for tow operators is rated on actual payroll — not guesses. Your RiskDrive™ telematics data gives underwriters a real picture. Operators with clean data save 8–22% vs. standard market. Head to WC Quote and I'll help pre-fill it." },
  { kw: ["score", "riskdrive"], reply: "Your RiskDrive™ Score = Safety (40%) + Compliance (30%) + Telematics (20%) + Training (10%). Score 70+ unlocks preferred carrier markets and lower tier premiums. Want tips to improve fastest?" },
  { kw: ["1099", "contractor", "w2"], reply: "Affinity RiskDrive™ scores each contractor independently. Data is used for insurance rating only — never to direct work schedules or assign jobs, which would risk W2 reclassification." },
  { kw: ["claim", "accident", "exonerat"], reply: "On any incident, RiskDrive™ immediately secures telematics data and dashcam clips. This evidence packet is the difference between a $74K claim and a $0 exoneration. Our network exoneration rate is 25%." },
];
const FINN_DEFAULT = "I help tow operators and AAA clubs with WC quotes, RiskDrive™ scores, 1099 compliance, and claims. What do you need?";
function finnReply(t: string) {
  const l = t.toLowerCase();
  return FINN_KB.find((e) => e.kw.some((k) => l.includes(k)))?.reply ?? FINN_DEFAULT;
}

function FinnWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<{ r: "finn" | "user"; t: string }[]>([
    { r: "finn", t: "Hi! I'm Finn — your Affinity Risk AI guide. Ask me about WC quotes, your RiskDrive™ score, or 1099 compliance." },
  ]);

  function send() {
    const t = input.trim();
    if (!t) return;
    setMsgs((p) => [...p, { r: "user", t }]);
    setInput("");
    setTimeout(() => setMsgs((p) => [...p, { r: "finn", t: finnReply(t) }]), 500);
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open Finn AI"
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        style={{ background: "linear-gradient(135deg,#E97132,#C85A1F)", border: "2px solid rgba(255,255,255,0.25)" }}
      >
        {open ? <X className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
      </button>

      {open && (
        <div
          className="fixed bottom-20 right-5 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          style={{ width: 320, height: 420 }}
        >
          <div
            className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#E97132,#C85A1F)" }}
          >
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Finn</div>
              <div className="text-orange-100 text-[10px]">RiskDrive™ AI Guide</div>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-300" />
              <span className="text-orange-100 text-[10px]">Online</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50">
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.r === "user" ? "flex-row-reverse" : ""}`}>
                {m.r === "finn" && (
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-orange-600" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    m.r === "finn"
                      ? "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"
                      : "text-white rounded-tr-sm"
                  }`}
                  style={m.r === "user" ? { background: "linear-gradient(135deg,#E97132,#C85A1F)" } : {}}
                >
                  {m.t}
                </div>
              </div>
            ))}
          </div>

          <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto flex-shrink-0">
            {["WC Quote", "My Score", "1099 Tips"].map((p) => (
              <button
                key={p}
                onClick={() => setInput(p)}
                className="flex-shrink-0 text-[10px] px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="px-3 py-2.5 bg-white border-t border-slate-100 flex gap-2 flex-shrink-0">
            <input
              className="flex-1 text-xs px-3 py-1.5 rounded-full border border-slate-200 outline-none bg-slate-50 focus:border-orange-400"
              placeholder="Ask Finn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button
              onClick={send}
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#E97132" }}
            >
              <Send className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Shared primitives ───────────────────────────────────────────── */

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-5 flex items-start justify-between">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5 max-w-2xl">{subtitle}</p>}
      </div>
      {children && (
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">{children}</div>
      )}
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
  const cfg = {
    low: "bg-emerald-100 text-emerald-700 border-emerald-200",
    moderate: "bg-amber-100 text-amber-700 border-amber-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    critical: "bg-red-100 text-red-700 border-red-200",
  }[t] ?? "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg}`}>
      {score !== undefined && <span>{Math.round(score)}</span>}
      <span className="capitalize">{t}</span>
    </span>
  );
}

export function RiskBar({ score }: { score: number }) {
  const color =
    score < 30 ? "bg-emerald-500" : score < 55 ? "bg-amber-500" : score < 75 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-400 w-7 text-right">{Math.round(score)}</span>
    </div>
  );
}

export function CertBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    current: "bg-emerald-100 text-emerald-700 border-emerald-200",
    expiring_soon: "bg-amber-100 text-amber-700 border-amber-200",
    expired: "bg-red-100 text-red-700 border-red-200",
    missing: "bg-slate-100 text-slate-700 border-slate-200",
  };
  const lbl: Record<string, string> = {
    current: "Current",
    expiring_soon: "Expiring Soon",
    expired: "Expired",
    missing: "Missing",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg[status] ?? cfg.missing}`}>
      {lbl[status] ?? status}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  color,
  variant = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  variant?: "default" | "alert" | "warning";
}) {
  const borderClass =
    variant === "alert"
      ? "border border-red-200 bg-red-50/40 border-l-[3px] border-l-red-500"
      : variant === "warning"
      ? "border border-amber-200 bg-amber-50/30 border-l-[3px] border-l-amber-500"
      : "border border-slate-200";

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm ${borderClass}`}>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color ?? "text-slate-900"}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}
