import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Building2, Truck, Users, Car, AlertTriangle, FileCheck, Shield
} from "lucide-react";

const navSections = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    ],
  },
  {
    label: "AAA Network",
    items: [
      { icon: Building2, label: "Clubs", href: "/clubs" },
      { icon: Truck, label: "Facilities", href: "/facilities" },
    ],
  },
  {
    label: "Fleet",
    items: [
      { icon: Users, label: "Drivers", href: "/drivers" },
      { icon: Car, label: "Vehicles", href: "/vehicles" },
    ],
  },
  {
    label: "Risk & Claims",
    items: [
      { icon: AlertTriangle, label: "Accidents", href: "/accidents" },
      { icon: FileCheck, label: "Certificates", href: "/certificates" },
    ],
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-[hsl(222,47%,10%)] border-r border-[hsl(222,47%,16%)] flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[hsl(222,47%,16%)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">Affinity Risk</div>
              <div className="text-[hsl(215,20%,55%)] text-[10px] leading-tight">Solutions for AAA Clubs</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[hsl(215,20%,45%)]">
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive = item.href === "/"
                  ? location === "/"
                  : location.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium mb-0.5 transition-colors ${
                      isActive
                        ? "bg-[hsl(221,83%,53%)] text-white"
                        : "text-[hsl(215,20%,65%)] hover:bg-[hsl(222,47%,16%)] hover:text-white"
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[hsl(222,47%,16%)]">
          <div className="text-[hsl(215,20%,40%)] text-[10px]">Powered by Fleetylitics Telematics</div>
          <div className="text-[hsl(215,20%,35%)] text-[10px]">v2.4.1 • Telematics Agnostic</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
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
    current: "Current",
    expiring_soon: "Expiring Soon",
    expired: "Expired",
    missing: "Missing",
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
