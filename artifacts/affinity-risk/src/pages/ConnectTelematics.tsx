import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Satellite,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Plug,
  Link2,
  ArrowRight,
  Car,
  Users,
  ShieldCheck,
  Clock,
  Zap,
} from "lucide-react";
import {
  useListFacilities,
  useListTelematicsConnections,
  useCreateTelematicsConnection,
  useSyncTelematicsConnection,
  useDeleteTelematicsConnection,
  useListTelematicsEvents,
  getListTelematicsConnectionsQueryKey,
  getListTelematicsEventsQueryKey,
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type Provider = "samsara" | "geotab";

const PROVIDERS: {
  id: Provider;
  name: string;
  blurb: string;
  auth: string;
  color: string;
  pulls: string[];
  setupTime: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "samsara",
    name: "Samsara",
    blurb: "Cloud API — long-lived API token (Bearer).",
    auth: "token",
    color: "#00A3E0",
    pulls: ["Vehicles", "Drivers", "Safety events"],
    setupTime: "~2 min",
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <rect width="32" height="32" rx="8" fill="#00A3E0" />
        <path d="M8 16a8 8 0 1 1 16 0 8 8 0 0 1-16 0z" fill="white" opacity="0.2" />
        <path d="M16 10a6 6 0 0 1 0 12A6 6 0 0 1 16 10z" fill="white" opacity="0.5" />
        <circle cx="16" cy="16" r="3" fill="white" />
      </svg>
    ),
  },
  {
    id: "geotab",
    name: "Geotab",
    blurb: "MyGeotab JSON-RPC — database + username + password.",
    auth: "credentials",
    color: "#E31837",
    pulls: ["Vehicles", "Drivers", "Exceptions"],
    setupTime: "~3 min",
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <rect width="32" height="32" rx="8" fill="#E31837" />
        <path d="M9 16L16 9l7 7-7 7-7-7z" fill="white" opacity="0.3" />
        <path d="M16 11l5 5-5 5-5-5 5-5z" fill="white" opacity="0.6" />
        <rect x="14" y="14" width="4" height="4" rx="1" fill="white" />
      </svg>
    ),
  },
];

export default function ConnectTelematics() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: facilities } = useListFacilities();
  const { data: connections, isLoading } = useListTelematicsConnections();
  const { data: events } = useListTelematicsEvents({ limit: 25 });

  const [provider, setProvider] = useState<Provider>("samsara");
  const [facilityId, setFacilityId] = useState<number | "">("");
  const [accountLabel, setAccountLabel] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [server, setServer] = useState("my.geotab.com");
  const [database, setDatabase] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListTelematicsConnectionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListTelematicsEventsQueryKey() });
  };

  const createConn = useCreateTelematicsConnection({
    mutation: {
      onSuccess: () => {
        toast({ title: "Provider connected", description: "Credentials validated and stored securely." });
        setApiToken(""); setDatabase(""); setUsername(""); setPassword(""); setAccountLabel("");
        invalidate();
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: (err as { data?: { error?: string } })?.data?.error ?? "Could not validate credentials.",
        });
      },
    },
  });

  const syncConn = useSyncTelematicsConnection({
    mutation: {
      onSuccess: (result) => {
        toast({
          title: "Sync complete",
          description: `${result.vehiclesSynced} vehicles · ${result.driversSynced} drivers · ${result.eventsSynced} events`,
        });
        invalidate();
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Sync failed",
          description: (err as { data?: { error?: string } })?.data?.error ?? "Provider sync error.",
        });
        invalidate();
      },
    },
  });

  const deleteConn = useDeleteTelematicsConnection({
    mutation: {
      onSuccess: () => { toast({ title: "Disconnected" }); invalidate(); },
    },
  });

  const canSubmit =
    facilityId !== "" &&
    (provider === "samsara"
      ? apiToken.trim().length > 0
      : database.trim() && username.trim() && password.trim());

  const handleConnect = () => {
    if (facilityId === "") return;
    createConn.mutate({
      data: {
        facilityId: Number(facilityId),
        provider,
        accountLabel: accountLabel || undefined,
        ...(provider === "samsara"
          ? { apiToken }
          : { server: server || "my.geotab.com", database, username, password }),
      },
    });
  };

  const facilityName = (id: number) => facilities?.find((f) => f.id === id)?.name ?? `Facility #${id}`;
  const selectedProvider = PROVIDERS.find((p) => p.id === provider)!;

  return (
    <div>
      <PageHeader
        title="Connect Telematics"
        subtitle="Link Samsara or Geotab to stream live fleet data into RiskDrive™"
      />
      <div className="p-6 space-y-6">

        {/* How it works banner */}
        <div
          className="rounded-xl p-5 flex items-start gap-4"
          style={{ background: "linear-gradient(135deg,#0F2940 0%,#0D3D56 100%)" }}
        >
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Satellite className="w-5 h-5" style={{ color: "#E97132" }} />
          </div>
          <div className="space-y-1 text-sm flex-1">
            <p className="font-bold text-white">Real provider integration — not a data scraper</p>
            <p className="text-slate-400 leading-relaxed text-xs">
              RiskDrive™ connects directly to your existing telematics account via the provider's official API.
              Credentials are validated live and stored AES-256 encrypted. Sync pulls vehicles, drivers, and
              safety events and keeps them in sync. This is the API bridge that preloads bound Workers Comp
              data into the operator's platform.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-center gap-1 flex-shrink-0 text-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wide">AES-256<br />Encrypted</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Connect form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Plug className="w-4 h-4 text-orange-500" /> Add a connection
            </div>

            {/* Enhanced provider cards */}
            <div className="grid grid-cols-2 gap-3">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  data-testid={`provider-${p.id}`}
                  onClick={() => setProvider(p.id)}
                  className={`text-left rounded-xl border-2 p-3.5 transition-all ${
                    provider === p.id
                      ? "border-orange-400 bg-orange-50/50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    {p.icon}
                    <div>
                      <div className="font-bold text-sm text-slate-900">{p.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        <span className="text-[10px] text-slate-400">{p.setupTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {p.pulls.map((pull) => (
                      <div key={pull} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
                        {pull}
                      </div>
                    ))}
                  </div>
                  {provider === p.id && (
                    <div className="mt-2 text-[10px] font-semibold text-orange-600">Selected ✓</div>
                  )}
                </button>
              ))}
            </div>

            {/* Auth method label */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <Zap className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">
                {selectedProvider.id === "samsara"
                  ? "Connects via Bearer token — generate one in your Samsara Dashboard under Settings → API Tokens"
                  : "Connects via MyGeotab JSON-RPC — use your existing MyGeotab login credentials"}
              </span>
            </div>

            <div className="space-y-3">
              <Field label="Tow Operator (Facility)">
                <select
                  data-testid="select-facility"
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                >
                  <option value="">Select a facility…</option>
                  {facilities?.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Account label (optional)">
                <Input value={accountLabel} onChange={setAccountLabel} placeholder="e.g. Main yard fleet" testid="input-label" />
              </Field>

              {provider === "samsara" ? (
                <Field label="Samsara API Token">
                  <Input value={apiToken} onChange={setApiToken} placeholder="samsara_api_xxx" type="password" testid="input-token" />
                </Field>
              ) : (
                <>
                  <Field label="Server">
                    <Input value={server} onChange={setServer} placeholder="my.geotab.com" testid="input-server" />
                  </Field>
                  <Field label="Database">
                    <Input value={database} onChange={setDatabase} placeholder="company_db" testid="input-database" />
                  </Field>
                  <Field label="Username">
                    <Input value={username} onChange={setUsername} placeholder="user@company.com" testid="input-username" />
                  </Field>
                  <Field label="Password">
                    <Input value={password} onChange={setPassword} type="password" testid="input-password" />
                  </Field>
                </>
              )}

              <button
                data-testid="button-connect"
                disabled={!canSubmit || createConn.isPending}
                onClick={handleConnect}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-white text-sm font-bold py-2.5 disabled:opacity-50 transition-all hover:opacity-90 shadow-md"
                style={{ background: canSubmit ? "linear-gradient(135deg,#E97132,#C85A1F)" : undefined, backgroundColor: !canSubmit ? "#94a3b8" : undefined }}
              >
                <Link2 className="w-4 h-4" />
                {createConn.isPending ? "Validating credentials…" : "Connect & Validate"}
              </button>
            </div>
          </div>

          {/* Connections list */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 text-sm">Active connections</div>

            {isLoading ? (
              <Skeleton className="h-28 rounded-xl" />
            ) : connections && connections.length > 0 ? (
              connections.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm"
                  data-testid={`connection-${c.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 capitalize">{c.provider}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {facilityName(c.facilityId)}
                        {c.accountLabel ? ` · ${c.accountLabel}` : ""}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        data-testid={`button-sync-${c.id}`}
                        onClick={() => syncConn.mutate({ id: c.id })}
                        disabled={syncConn.isPending}
                        className="p-2 rounded-lg hover:bg-orange-50 text-slate-400 hover:text-orange-500 transition-colors disabled:opacity-50"
                        title="Sync now"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncConn.isPending && syncConn.variables?.id === c.id ? "animate-spin" : ""}`} />
                      </button>
                      <button
                        data-testid={`button-delete-${c.id}`}
                        onClick={() => deleteConn.mutate({ id: c.id })}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        title="Disconnect"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Metric label="Vehicles" value={c.vehicleCount} icon={<Car className="w-3 h-3" />} />
                    <Metric label="Drivers" value={c.driverCount} icon={<Users className="w-3 h-3" />} />
                    <Metric label="Last sync" value={c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleDateString() : "—"} icon={<RefreshCw className="w-3 h-3" />} />
                  </div>

                  {c.status === "error" && c.lastError && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {c.lastError}
                    </div>
                  )}
                </div>
              ))
            ) : (
              /* Enhanced empty state */
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mx-auto">
                  <Satellite className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">No connections yet</div>
                  <div className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Connect your first provider to unlock real-time risk scoring and pre-fill your WC application automatically.
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-orange-500 font-semibold">
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  Select a provider and paste your API token
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent synced events */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="font-bold text-slate-900 text-sm">Recent telematics events</div>
            <span className="text-xs text-slate-400">Last {events?.length ?? 0} events from connected providers</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Event</th>
                <th className="text-left px-5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Severity</th>
                <th className="text-left px-5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Source</th>
                <th className="text-left px-5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events && events.length > 0 ? (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors" data-testid={`event-${e.id}`}>
                    <td className="px-5 py-2.5 text-sm font-medium text-slate-800">{e.eventType}</td>
                    <td className="px-5 py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          e.severity === "high" || e.severity === "critical"
                            ? "bg-red-100 text-red-700"
                            : e.severity === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {e.severity}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-xs text-slate-500 capitalize">{e.provider ?? "manual"}</td>
                    <td className="px-5 py-2.5 text-xs text-slate-400">{new Date(e.timestamp).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center">
                    <div className="text-sm text-slate-400">No events yet</div>
                    <div className="text-xs text-slate-300 mt-0.5">Connect a provider and sync to pull live data</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Input({
  value, onChange, placeholder, type = "text", testid,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; testid?: string;
}) {
  return (
    <input
      data-testid={testid}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition-colors"
    />
  );
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 py-2.5 px-2">
      <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-sm font-bold text-slate-900 text-center">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
        <CheckCircle2 className="w-3 h-3" /> Connected
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
        <AlertTriangle className="w-3 h-3" /> Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
      Disconnected
    </span>
  );
}
