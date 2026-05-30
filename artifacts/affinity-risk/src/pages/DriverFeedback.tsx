import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Bell, CheckCheck, AlertTriangle, Info, XCircle, Filter } from "lucide-react";
import { PageHeader } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FeedbackItem {
  id: number;
  driverId: number;
  driverName: string | null;
  eventType: string;
  message: string;
  severity: string;
  acknowledged: boolean;
  triggeredAt: string;
  acknowledgedAt: string | null;
}

const SEV_CFG: Record<string, { label: string; className: string; icon: React.ElementType; dot: string }> = {
  critical: { label: "Critical", className: "border-l-red-500 bg-red-50", icon: XCircle, dot: "bg-red-500" },
  warning: { label: "Warning", className: "border-l-amber-500 bg-amber-50", icon: AlertTriangle, dot: "bg-amber-500" },
  info: { label: "Info", className: "border-l-blue-500 bg-blue-50/50", icon: Info, dot: "bg-blue-400" },
};

const EVENT_ICONS: Record<string, string> = {
  hard_braking: "⚡",
  speeding: "🚗",
  phone_usage: "📵",
  harsh_acceleration: "🔄",
  night_driving: "🌙",
  lane_departure: "⚠️",
  following_distance: "🚛",
  fatigue_alert: "😴",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DriverFeedback() {
  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [sevFilter, setSevFilter] = useState("all");
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [acking, setAcking] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/driver-feedback").then(r => r.json()).then(setItems);
  }, []);

  async function acknowledge(id: number) {
    setAcking(id);
    const res = await fetch(`/api/driver-feedback/${id}/acknowledge`, { method: "PATCH" });
    if (res.ok) {
      setItems(prev => prev?.map(i => i.id === id ? { ...i, acknowledged: true } : i) ?? null);
      toast({ title: "Feedback acknowledged" });
    }
    setAcking(null);
  }

  async function acknowledgeAll() {
    const unacked = items?.filter(i => !i.acknowledged) ?? [];
    for (const item of unacked) {
      await fetch(`/api/driver-feedback/${item.id}/acknowledge`, { method: "PATCH" });
    }
    setItems(prev => prev?.map(i => ({ ...i, acknowledged: true })) ?? null);
    toast({ title: "All feedback acknowledged" });
  }

  const filtered = items?.filter(i => {
    if (!showAcknowledged && i.acknowledged) return false;
    if (sevFilter !== "all" && i.severity !== sevFilter) return false;
    return true;
  }) ?? [];

  const unacknowledgedCount = items?.filter(i => !i.acknowledged).length ?? 0;
  const criticalCount = items?.filter(i => i.severity === "critical" && !i.acknowledged).length ?? 0;

  return (
    <div>
      <PageHeader
        title="Real-Time Driver Feedback"
        subtitle="Live corrective alerts generated from telematics events — sent directly to drivers for immediate behavior correction"
      >
        {unacknowledgedCount > 0 && (
          <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={acknowledgeAll}>
            <CheckCheck className="w-3.5 h-3.5" /> Acknowledge All ({unacknowledgedCount})
          </Button>
        )}
      </PageHeader>

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total Alerts</div>
            <div className="text-2xl font-bold">{items?.length ?? "—"}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Unacknowledged</div>
            <div className="text-2xl font-bold text-amber-600">{unacknowledgedCount || "—"}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Critical</div>
            <div className="text-2xl font-bold text-red-600">{criticalCount || "—"}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Acknowledged</div>
            <div className="text-2xl font-bold text-emerald-600">{items?.filter(i => i.acknowledged).length ?? "—"}</div>
          </div>
        </div>

        {/* How it works banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-800 flex items-center gap-3">
          <Bell className="w-4 h-4 flex-shrink-0 text-blue-600" />
          <span>Affinity RiskDrive analyzes telematics events in real time and sends in-cab or mobile alerts to drivers within seconds of a detected behavior. Alerts are logged here for fleet manager review and acknowledgement.</span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="flex gap-2">
            {["all", "critical", "warning", "info"].map(s => (
              <button key={s} onClick={() => setSevFilter(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${sevFilter === s ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAcknowledged(p => !p)}
            className={`ml-auto px-3 py-1 rounded-full text-xs font-medium border transition-colors ${showAcknowledged ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground border-border"}`}>
            {showAcknowledged ? "Hiding Acknowledged" : "Show Acknowledged"}
          </button>
        </div>

        {/* Feed */}
        <div className="space-y-2">
          {!items
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)
            : filtered.length === 0
            ? <div className="text-center py-12 text-muted-foreground text-sm">No alerts match the current filter</div>
            : filtered.map(item => {
              const cfg = SEV_CFG[item.severity] ?? SEV_CFG.info;
              const Icon = cfg.icon;
              return (
                <div key={item.id} className={`border-l-4 border border-border rounded-lg px-4 py-3 flex items-start gap-3 transition-opacity ${cfg.className} ${item.acknowledged ? "opacity-60" : ""}`}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{EVENT_ICONS[item.eventType] ?? "⚠️"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Link href={`/drivers/${item.driverId}`} className="text-sm font-semibold text-primary hover:underline">
                        {item.driverName ?? `Driver ${item.driverId}`}
                      </Link>
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${item.severity === "critical" ? "bg-red-100 text-red-800 border-red-200" : item.severity === "warning" ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-blue-100 text-blue-800 border-blue-200"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">{timeAgo(item.triggeredAt)}</span>
                    </div>
                    <p className="text-sm text-foreground">{item.message}</p>
                    <div className="text-[10px] text-muted-foreground mt-1 capitalize">{item.eventType.replace(/_/g, " ")}</div>
                  </div>
                  {!item.acknowledged
                    ? <Button size="sm" variant="outline" className="text-xs h-7 flex-shrink-0" disabled={acking === item.id} onClick={() => acknowledge(item.id)}>
                        {acking === item.id ? "..." : "Acknowledge"}
                      </Button>
                    : <div className="flex items-center gap-1 text-xs text-emerald-600 flex-shrink-0"><CheckCheck className="w-3.5 h-3.5" /> Done</div>}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
