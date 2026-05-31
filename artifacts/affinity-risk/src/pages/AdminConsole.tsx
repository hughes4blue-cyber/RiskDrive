import { useState } from "react";
import {
  useGetCurrentUser,
  useGetAppMode,
  useListAdminUsers,
  useApproveUser,
  useDenyUser,
  useUpdateAppMode,
  useListAuditLogs,
  ApproveUserInputRole,
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Users,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function AdminConsole() {
  const { data: meData } = useGetCurrentUser();
  const appUser = meData?.user;
  const [tab, setTab] = useState<"mode" | "users" | "audit">("mode");

  if (!appUser || appUser.role !== "super_admin") {
    return (
      <div className="p-8 text-center">
        <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <div className="text-slate-500 font-medium">Admin access required</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin Console"
        subtitle="Manage platform mode, user access, and DPPA audit trail"
      />
      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setTab("mode")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === "mode"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <ToggleRight className="w-4 h-4" />
            Platform Mode
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === "users"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            User Management
          </button>
          <button
            onClick={() => setTab("audit")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === "audit"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <ScrollText className="w-4 h-4" />
            DPPA Audit Log
          </button>
        </div>

        {tab === "mode" && <ModeTab />}
        {tab === "users" && <UsersTab />}
        {tab === "audit" && <AuditTab />}
      </div>
    </div>
  );
}

function ModeTab() {
  const { data: modeData, refetch } = useGetAppMode();
  const mode = modeData?.mode ?? "demo";
  const updateMode = useUpdateAppMode();
  const [pending, setPending] = useState(false);

  async function toggle() {
    const next = mode === "demo" ? "live" : "demo";
    setPending(true);
    try {
      await updateMode.mutateAsync({ data: { mode: next } });
      await refetch();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="font-semibold text-slate-900 mb-1">Current Mode</div>
            <div className="text-sm text-slate-500">
              Controls whether the platform requires user logins or runs in open demo mode.
            </div>
          </div>
          <span className={`flex-shrink-0 ml-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
            mode === "live"
              ? "bg-teal-50 text-teal-700 border-teal-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {mode === "live" ? "🔒 Live" : "🔓 Demo"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className={`rounded-lg border p-3 ${mode === "demo" ? "border-amber-300 bg-amber-50" : "border-slate-100 bg-slate-50"}`}>
            <div className="font-medium text-sm text-slate-700 mb-1">Demo Mode</div>
            <div className="text-xs text-slate-500">Anyone can explore all sample data without signing in. Use for prospect demos.</div>
          </div>
          <div className={`rounded-lg border p-3 ${mode === "live" ? "border-teal-300 bg-teal-50" : "border-slate-100 bg-slate-50"}`}>
            <div className="font-medium text-sm text-slate-700 mb-1">Live Mode</div>
            <div className="text-xs text-slate-500">Sign-in required. Each user sees only their club or shop data. Real production use.</div>
          </div>
        </div>

        <button
          onClick={toggle}
          disabled={pending}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 ${
            mode === "demo"
              ? "bg-teal-600 hover:bg-teal-700 text-white"
              : "bg-amber-500 hover:bg-amber-600 text-white"
          }`}
        >
          {mode === "demo" ? (
            <><ToggleRight className="w-4 h-4" /> Switch to Live Mode</>
          ) : (
            <><ToggleLeft className="w-4 h-4" /> Switch to Demo Mode</>
          )}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong>Before switching to Live:</strong> Make sure all operators and clubs have been approved and assigned the correct roles in the User Management tab. Unapproved users will see a "pending approval" screen.
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const { data: users, isLoading, refetch } = useListAdminUsers();
  const approve = useApproveUser();
  const deny = useDenyUser();

  const [approving, setApproving] = useState<number | null>(null);
  const [roleInputs, setRoleInputs] = useState<Record<number, { role: string; clubId: string; facilityId: string }>>({});

  function getInput(id: number) {
    return roleInputs[id] ?? { role: "", clubId: "", facilityId: "" };
  }
  function setInput(id: number, patch: Partial<{ role: string; clubId: string; facilityId: string }>) {
    setRoleInputs(p => ({ ...p, [id]: { ...getInput(id), ...patch } }));
  }

  async function handleApprove(id: number) {
    const inp = getInput(id);
    if (!inp.role) return;
    setApproving(id);
    try {
      await approve.mutateAsync({
        userId: id,
        data: {
          role: inp.role as ApproveUserInputRole,
          clubId: inp.clubId ? Number(inp.clubId) : undefined,
          facilityId: inp.facilityId ? Number(inp.facilityId) : undefined,
        },
      });
      await refetch();
    } finally {
      setApproving(null);
    }
  }

  async function handleDeny(id: number) {
    setApproving(id);
    try {
      await deny.mutateAsync({ userId: id });
      await refetch();
    } finally {
      setApproving(null);
    }
  }

  if (isLoading) return <Skeleton className="h-40" />;

  const pending = users?.filter(u => u.approvalStatus === "pending") ?? [];
  const approved = users?.filter(u => u.approvalStatus === "approved") ?? [];
  const denied = users?.filter(u => u.approvalStatus === "denied") ?? [];

  return (
    <div className="space-y-6">
      {/* Pending */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-sm text-slate-700">Pending Approval ({pending.length})</span>
        </div>
        {pending.length === 0 ? (
          <div className="text-sm text-slate-400 py-3">No pending users</div>
        ) : (
          <div className="space-y-3">
            {pending.map(u => {
              const inp = getInput(u.id);
              return (
                <div key={u.id} className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{u.email}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Signed up {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={inp.role}
                        onChange={e => setInput(u.id, { role: e.target.value })}
                        className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="">Select role…</option>
                        <option value="super_admin">Affinity Risk Admin</option>
                        <option value="club">Club Admin</option>
                        <option value="shop_owner">Shop Owner</option>
                      </select>
                      {inp.role === "club" && (
                        <input
                          type="number"
                          placeholder="Club ID"
                          value={inp.clubId}
                          onChange={e => setInput(u.id, { clubId: e.target.value })}
                          className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg w-20"
                        />
                      )}
                      {inp.role === "shop_owner" && (
                        <input
                          type="number"
                          placeholder="Facility ID"
                          value={inp.facilityId}
                          onChange={e => setInput(u.id, { facilityId: e.target.value })}
                          className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg w-24"
                        />
                      )}
                      <button
                        onClick={() => handleApprove(u.id)}
                        disabled={approving === u.id || !inp.role}
                        className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleDeny(u.id)}
                        disabled={approving === u.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Deny
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approved */}
      {approved.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-teal-500" />
            <span className="font-semibold text-sm text-slate-700">Approved ({approved.length})</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Email</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Role</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approved.map(u => (
                  <tr key={u.id}>
                    <td className="px-4 py-2.5 text-slate-700">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.role === "super_admin" ? "bg-purple-100 text-purple-700" :
                        u.role === "club" ? "bg-blue-100 text-blue-700" :
                        "bg-teal-100 text-teal-700"
                      }`}>
                        {u.role === "super_admin" ? "Admin" : u.role === "club" ? "Club" : "Shop Owner"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {u.clubId ? `Club #${u.clubId}` : u.facilityId ? `Facility #${u.facilityId}` : "Platform-wide"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Denied */}
      {denied.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="font-semibold text-sm text-slate-700">Denied ({denied.length})</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {denied.map(u => (
                  <tr key={u.id}>
                    <td className="px-4 py-2.5 text-slate-500 line-through">{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const RESOURCE_TYPES = [
  { value: "", label: "All resources" },
  { value: "driver", label: "Driver" },
  { value: "driver.behavior", label: "Driver behavior" },
  { value: "vehicle", label: "Vehicle" },
];

function AuditTab() {
  const [page, setPage] = useState(1);
  const [resourceType, setResourceType] = useState("");

  const { data, isLoading } = useListAuditLogs({
    page,
    limit: 50,
    ...(resourceType ? { resourceType } : {}),
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  }

  function resourceBadgeColor(rt: string) {
    if (rt.startsWith("driver")) return "bg-blue-50 text-blue-700";
    if (rt.startsWith("vehicle")) return "bg-teal-50 text-teal-700";
    return "bg-slate-100 text-slate-600";
  }

  return (
    <div className="space-y-4">
      {/* Header + DPPA note */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <select
            value={resourceType}
            onChange={e => { setResourceType(e.target.value); setPage(1); }}
            className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
          >
            {RESOURCE_TYPES.map(rt => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>
          {pagination && (
            <span className="text-xs text-slate-400">
              {pagination.total.toLocaleString()} total entries
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Shield className="w-3.5 h-3.5 text-teal-600" />
          DPPA §2721 compliance log — every access to driver/vehicle PII is recorded
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center">
            <ScrollText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <div className="text-sm text-slate-400">No audit log entries yet.</div>
            <div className="text-xs text-slate-300 mt-1">Entries appear when drivers or vehicles are accessed.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">Timestamp</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">User</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Role</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Resource</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Action</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap font-mono">
                      {formatTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-700 max-w-[180px] truncate">
                      {log.userEmail ?? (
                        <span className="italic text-amber-600">demo / unauthenticated</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {log.userRole ? (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          log.userRole === "super_admin" ? "bg-purple-100 text-purple-700" :
                          log.userRole === "club" ? "bg-blue-100 text-blue-700" :
                          "bg-teal-100 text-teal-700"
                        }`}>
                          {log.userRole === "super_admin" ? "Admin" :
                           log.userRole === "club" ? "Club" : "Shop"}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500 italic">demo</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${resourceBadgeColor(log.resourceType)}`}>
                        {log.resourceType}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-400 font-mono">
                      {log.resourceId ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500 uppercase tracking-wide">
                      {log.action}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-400 font-mono whitespace-nowrap">
                      {log.ipAddress ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>
          <span className="text-xs text-slate-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
