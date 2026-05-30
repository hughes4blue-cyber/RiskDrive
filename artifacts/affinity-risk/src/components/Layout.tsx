import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Building2, Truck, Users, Car, AlertTriangle, FileCheck, Shield, BookOpen, FileText,
  Scale, DollarSign, ClipboardCheck, Trophy, MessageSquareWarning, BarChart3, Bot, HardHat
} from "lucide-react";

const navSections = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/" },
      { icon: BarChart3, label: "RiskDrive Score", href: "/fleet-score" },
      { icon: Bot, label: "Finn AI Assistant", href: "/finn" },
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
  {
    label: "Fleet & Contractors",
    items: [
      { icon: Users, label: "Drivers", href: "/drivers" },
      { icon: Car, label: "Vehicles", href: "/vehicles" },
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
    label: "Insurance",
    items: [
      { icon: HardHat, label: "Workers Comp Quote", href: "/wc-quote" },
      { icon: FileText, label: "Liability Placement", href: "/policies" },
      { icon: DollarSign, label: "Settlement", href: "/settlement" },
      { icon: BookOpen, label: "Safety Training", href: "/training" },
    ],
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="w-60 flex-shrink-0 bg-[hsl(222,47%,10%)] border-r border-[hsl(222,47%,16%)] flex flex-col">
        <div className="px-5 py-5 border-b border-[hsl(222,47%,16%)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">RiskDrive</div>
              <div className="text-[hsl(215,20%,55%)] text-[10px] leading-tight">by Affinity Risk</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[hsl(215,20%,45%)]">
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
                const isFinn = item.href === "/finn";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium mb-0.5 transition-colors ${
                      isActive
                        ? "bg-[hsl(221,83%,53%)] text-white"
                        : isFinn
                        ? "text-amber-400 hover:bg-[hsl(222,47%,16%)] hover:text-amber-300"
                        : "text-[hsl(215,20%,65%)] hover:bg-[hsl(222,47%,16%)] hover:text-white"
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                    {isFinn && !isActive && (
                      <span className="ml-auto text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold">AI</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="px-5 py-3 border-t border-[hsl(222,47%,16%)]">
          <div className="text-[hsl(215,20%,50%)] text-[10px] font-semibold">Affinity Risk Solutions</div>
          <div className="text-[hsl(215,20%,40%)] text-[10px]">Powered by Affinity RiskDrive™</div>
          <div className="text-[hsl(215,20%,35%)] text-[10px]">Telematics-Based Risk Intelligence</div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      <FinnWidget />
    </div>
  );
}

const FINN_RESPONSES: { keywords: string[]; reply: string }[] = [
  {
    keywords: ["workers comp", "wc", "work comp", "workers compensation"],
    reply: "Workers Comp for tow operators is rated on actual payroll by class code — not on units. Your RiskDrive data (hours driven, incident rates, coaching outcomes) gives underwriters a much more accurate risk picture. Head to the Workers Comp Quote page and I'll help pre-fill it from your existing data. Operators with clean telematics typically save 8–22% vs. standard market rates.",
  },
  {
    keywords: ["score", "riskdrive", "risk drive", "fleet score"],
    reply: "Your RiskDrive Score is built from four weighted factors: Safety Events (40%), Compliance (30%), Telematics Behavior (20%), and Training Completion (10%). A score above 70 unlocks preferred carrier markets and lower premium tiers. Want specific tips for improving your score fastest?",
  },
  {
    keywords: ["1099", "contractor", "corporate veil", "independent", "w2"],
    reply: "Great question on compliance. Affinity RiskDrive maintains separate scorecards per independent contractor — each operator is scored individually. This data is used for insurance rating purposes only. We never use telematics data to control work schedules, assign jobs, or direct hours — doing so would risk reclassification. Your AAA club can monitor safety without crossing the W2 line.",
  },
  {
    keywords: ["carrier", "market", "quote", "premium", "liability"],
    reply: "Affinity Risk works with multiple admitted and specialty carriers for commercial auto liability, general liability, and workers comp. Your RiskDrive score determines which markets we can access and at what tier. Higher scores = more carriers competing for your business = lower premiums. Want me to walk through your current placement options?",
  },
  {
    keywords: ["claim", "accident", "incident", "exonerat"],
    reply: "When an incident occurs, Affinity RiskDrive immediately secures telematics data, dashcam clips, and GPS records. This evidence package is critical — it's the difference between paying a $74K claim and a $0 exoneration. Your TPA receives a structured evidence packet within minutes of the FNOL. Want to see how the claims pipeline works?",
  },
  {
    keywords: ["onboard", "new operator", "new facility", "checklist"],
    reply: "Onboarding a new tow operator involves 10 steps: COI verification, contract signing, tax status, articles of incorporation, driver license requirements, vehicle inspection, telematics agreement, device installation, background checks, and facility rep assignment. Finn can walk you through any step. Which one needs attention?",
  },
  {
    keywords: ["training", "safety", "module", "coach"],
    reply: "Safety Training in Affinity RiskDrive assigns modules based on each driver's actual event history — phone use events trigger distracted driving modules, speeding events trigger speed management training. Completion rates factor into the Compliance component of your RiskDrive Score. Want me to identify which drivers need immediate module assignment?",
  },
];

const FINN_DEFAULT = "Great question! I'm here to help tow operators and AAA clubs with insurance, compliance, and their RiskDrive score. Some things I can help with: Workers Comp quotes, understanding your RiskDrive Score, 1099 contractor compliance, claims support, and carrier placement. What would you like to explore?";

function getFinnReply(input: string): string {
  const lower = input.toLowerCase();
  for (const { keywords, reply } of FINN_RESPONSES) {
    if (keywords.some(k => lower.includes(k))) return reply;
  }
  return FINN_DEFAULT;
}

function FinnWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "finn" | "user"; text: string }[]>([
    { role: "finn", text: "Hi! I'm Finn, your Affinity Risk AI assistant. I help tow operators and AAA clubs with insurance, RiskDrive scores, and 1099 compliance. What can I help you with today?" },
  ]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "finn", text: getFinnReply(text) }]);
    }, 500);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(o => !o)}
        className="fixed bottom-5 right-5 z-50 shadow-xl flex items-center justify-center transition-all hover:scale-105"
        style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "2px solid rgba(255,255,255,0.2)" }}
        title="Chat with Finn"
        aria-label="Open Finn AI assistant"
      >
        {isOpen
          ? <span style={{ color: "white", fontSize: 22, lineHeight: 1, fontWeight: 700 }}>×</span>
          : <Bot style={{ color: "white", width: 22, height: 22 }} />
        }
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-5 z-50 flex flex-col overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-2xl" style={{ width: 320, height: 430 }}>
          <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Finn</div>
              <div className="text-amber-100 text-[10px]">Affinity Risk AI Assistant</div>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-300" style={{ animation: "pulse 2s infinite" }} />
              <span className="text-amber-100 text-[10px]">Online</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "finn" && (
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-amber-600" />
                  </div>
                )}
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  m.role === "finn"
                    ? "bg-white border border-gray-200 text-gray-700 rounded-tl-sm"
                    : "bg-blue-600 text-white rounded-tr-sm"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="px-3 py-1.5 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto flex-shrink-0">
            {["WC Quote", "My Score", "1099 Tips", "Claims Help"].map(p => (
              <button
                key={p}
                onClick={() => setInput(p)}
                className="flex-shrink-0 text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="px-3 py-2.5 bg-white border-t border-gray-100 flex gap-2 flex-shrink-0">
            <input
              className="flex-1 text-xs px-3 py-1.5 rounded-full border border-gray-200 outline-none bg-gray-50 focus:border-amber-400"
              placeholder="Ask Finn anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
            />
            <button
              onClick={send}
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:opacity-90"
              style={{ background: "#f59e0b" }}
            >
              <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>↑</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function RiskBadge({ score, tier }: { score?: number; tier?: string }) {
  const t = tier ?? riskTier(score ?? 0);
  const config = {
    low: "bg-emerald-100 text-emerald-800 border-emerald-200",
    moderate: "bg-amber-100 text-amber-800 border-amber-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    critical: "bg-red-100 text-red-800 border-red-200",
  }[t] ?? "bg-gray-100 text-gray-800 border-gray-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${config}`}>
      {score !== undefined && <span>{Math.round(score)}</span>}
      <span className="capitalize">{t}</span>
    </span>
  );
}

export function riskTier(score: number): string {
  if (score < 30) return "low";
  if (score < 55) return "moderate";
  if (score < 75) return "high";
  return "critical";
}

export function RiskBar({ score }: { score: number }) {
  const color = score < 30 ? "bg-emerald-500" : score < 55 ? "bg-amber-500" : score < 75 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-7 text-right">{Math.round(score)}</span>
    </div>
  );
}

export function CertBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    current: "bg-emerald-100 text-emerald-800 border-emerald-200",
    expiring_soon: "bg-amber-100 text-amber-800 border-amber-200",
    expired: "bg-red-100 text-red-800 border-red-200",
    missing: "bg-gray-100 text-gray-800 border-gray-200",
  };
  const labels: Record<string, string> = {
    current: "Current", expiring_soon: "Expiring Soon", expired: "Expired", missing: "Missing",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${config[status] ?? config.missing}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color ?? "text-foreground"}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
