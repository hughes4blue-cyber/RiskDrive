import { useState } from "react";
import { Link } from "wouter";
import { BookOpen, CheckCircle, Clock, PlayCircle, Users, Award } from "lucide-react";
import { PageHeader } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TrainingAssignment {
  id: number;
  driverId: number;
  driverName: string | null;
  moduleId: number;
  moduleTitle: string | null;
  moduleCategory: string | null;
  moduleDurationMinutes: number | null;
  status: string;
  score: number | null;
  assignedAt: string;
  completedAt: string | null;
}

interface TrainingModule {
  id: number;
  title: string;
  description: string;
  category: string;
  durationMinutes: number;
  behaviorTrigger: string | null;
}

function useTrainingData() {
  const [assignments, setAssignments] = useState<TrainingAssignment[] | null>(null);
  const [modules, setModules] = useState<TrainingModule[] | null>(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    Promise.all([
      fetch("/api/training/assignments").then(r => r.json()),
      fetch("/api/training/modules").then(r => r.json()),
    ]).then(([a, m]) => {
      setAssignments(a);
      setModules(m);
      setLoading(false);
    }).catch(() => setLoading(false));
  });

  return { assignments, modules, loading, setAssignments };
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  assigned: { label: "Assigned", className: "bg-blue-100 text-blue-800 border-blue-200", icon: BookOpen },
  in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-800 border-amber-200", icon: PlayCircle },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle },
};

const CATEGORY_COLORS: Record<string, string> = {
  Safety: "bg-red-50 text-red-700 border-red-200",
  Compliance: "bg-purple-50 text-purple-700 border-purple-200",
  Efficiency: "bg-blue-50 text-blue-700 border-blue-200",
  Operations: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function Training() {
  const { assignments, modules, loading, setAssignments } = useTrainingData();
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const filtered = assignments?.filter(a => statusFilter === "all" || a.status === statusFilter) ?? [];

  const stats = {
    total: assignments?.length ?? 0,
    assigned: assignments?.filter(a => a.status === "assigned").length ?? 0,
    inProgress: assignments?.filter(a => a.status === "in_progress").length ?? 0,
    completed: assignments?.filter(a => a.status === "completed").length ?? 0,
  };

  const avgScore = (() => {
    const scored = assignments?.filter(a => a.score !== null) ?? [];
    if (!scored.length) return 0;
    return Math.round(scored.reduce((sum, a) => sum + (a.score ?? 0), 0) / scored.length);
  })();

  async function markComplete(assignmentId: number) {
    const score = Math.round(78 + Math.random() * 17);
    const res = await fetch(`/api/training/assignment/${assignmentId}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAssignments(prev => prev?.map(a => a.id === assignmentId ? { ...a, ...updated } : a) ?? null);
      toast({ title: "Training completed", description: `Score: ${score}/100` });
    }
  }

  return (
    <div>
      <PageHeader
        title="Training & Driver Development"
        subtitle="Targeted training assignments driven by telematics behavior data — Affinity RiskDrive™ integration"
      />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total Assignments</div>
            <div className="text-2xl font-bold">{loading ? "—" : stats.total}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Assigned</div>
            <div className="text-2xl font-bold text-blue-600">{loading ? "—" : stats.assigned}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">In Progress</div>
            <div className="text-2xl font-bold text-amber-600">{loading ? "—" : stats.inProgress}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Completed</div>
            <div className="text-2xl font-bold text-emerald-600">{loading ? "—" : stats.completed}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Avg Score</div>
            <div className="text-2xl font-bold text-primary">{loading ? "—" : `${avgScore}`}<span className="text-sm font-normal text-muted-foreground">/100</span></div>
          </div>
        </div>

        {/* Module Library */}
        {modules && (
          <div>
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Training Module Library
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {modules.map(m => (
                <div key={m.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-sm font-semibold leading-snug">{m.title}</div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${CATEGORY_COLORS[m.category] ?? "bg-gray-50 text-gray-700"}`}>
                      {m.category}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed mb-3">{m.description}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {m.durationMinutes} min
                    </div>
                    {m.behaviorTrigger && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                        Triggered by: {m.behaviorTrigger.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Driver Assignments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Driver Assignments
            </div>
            <div className="flex gap-2">
              {["all", "assigned", "in_progress", "completed"].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    statusFilter === s
                      ? "bg-primary text-white border-primary"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Driver</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Module</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>
                    ))
                  : filtered.length === 0
                  ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No assignments found</td></tr>
                  )
                  : filtered.map(a => {
                    const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.assigned;
                    const Icon = cfg.icon;
                    return (
                      <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/drivers/${a.driverId}`} className="font-medium text-primary hover:underline text-sm">
                            {a.driverName ?? `Driver ${a.driverId}`}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium">{a.moduleTitle}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {a.moduleDurationMinutes} min</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${CATEGORY_COLORS[a.moduleCategory ?? ""] ?? "bg-gray-50 text-gray-700"}`}>
                            {a.moduleCategory}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}>
                            <Icon className="w-3 h-3" /> {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {a.score !== null
                            ? <div className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-amber-500" /><span className="font-semibold">{Math.round(a.score)}</span><span className="text-muted-foreground text-xs">/100</span></div>
                            : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(a.assignedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {a.status !== "completed" && (
                            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => markComplete(a.id)}>
                              Mark Complete
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
