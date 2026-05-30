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

const PROVIDERS: { id: Provider; name: string; blurb: string; auth: string }[] = [
  { id: "samsara", name: "Samsara", blurb: "Cloud API — long-lived API token (Bearer).", auth: "token" },
  { id: "geotab", name: "Geotab", blurb: "MyGeotab JSON-RPC — database + username + password.", auth: "credentials" },
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
        setApiToken("");
        setDatabase("");
        setUsername("");
        setPassword("");
        setAccountLabel("");
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
      onSuccess: () => {
        toast({ title: "Disconnected" });
        invalidate();
      },
    },
  });

  const canSubmit =
    facilityId !== "" &&
    (provider === "samsara" ? apiToken.trim().length > 0 : database.trim() && username.trim() && password.trim());

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

  return (
    <div>
      <PageHeader
        title="Connect Telematics"
        subtitle="Link Samsara or Geotab to stream live fleet data into RiskDrive"
      />
      <div className="p-6 space-y-6">
        {/* How it works */}
        <div className="bg-slate-900 text-slate-200 rounded-xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Satellite className="w-5 h-5 text-[#E97132]" />
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-white">Real provider integration</p>
            <p className="text-slate-400 leading-relaxed">
              RiskDrive connects directly to the operator's existing telematics account, pulls vehicles, drivers, and
              safety events, and keeps them in sync. Credentials are validated on connect and stored encrypted at rest.
              This is the API bridge that preloads bound Workers Comp data into the operator's platform.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Connect form */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Plug className="w-4 h-4 text-primary" /> Add a connection
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  data-testid={`provider-${p.id}`}
                  onClick={() => setProvider(p.id)}
                  className={`text-left rounded-lg border p-3 transition-colors ${
                    provider === p.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-semibold text-sm">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{p.blurb}</div>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <Field label="Tow Operator (Facility)">
                <select
                  data-testid="select-facility"
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a facility…</option>
                  {facilities?.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
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
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white text-sm font-semibold py-2.5 disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                <Link2 className="w-4 h-4" />
                {createConn.isPending ? "Validating…" : "Connect & Validate"}
              </button>
            </div>
          </div>

          {/* Connections list */}
          <div className="space-y-3">
            <div className="font-semibold text-sm">Active connections</div>
            {isLoading ? (
              <Skeleton className="h-28 rounded-xl" />
            ) : connections && connections.length > 0 ? (
              connections.map((c) => (
                <div key={c.id} className="bg-card border border-border rounded-xl p-4 space-y-3" data-testid={`connection-${c.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize">{c.provider}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {facilityName(c.facilityId)}
                        {c.accountLabel ? ` · ${c.accountLabel}` : ""}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        data-testid={`button-sync-${c.id}`}
                        onClick={() => syncConn.mutate({ id: c.id })}
                        disabled={syncConn.isPending}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                        title="Sync now"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncConn.isPending && syncConn.variables?.id === c.id ? "animate-spin" : ""}`} />
                      </button>
                      <button
                        data-testid={`button-delete-${c.id}`}
                        onClick={() => deleteConn.mutate({ id: c.id })}
                        className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                        title="Disconnect"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Metric label="Vehicles" value={c.vehicleCount} />
                    <Metric label="Drivers" value={c.driverCount} />
                    <Metric
                      label="Last sync"
                      value={c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleDateString() : "—"}
                    />
                  </div>

                  {c.status === "error" && c.lastError && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {c.lastError}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-muted/40 border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
                No connections yet. Add one to start streaming fleet data.
              </div>
            )}
          </div>
        </div>

        {/* Recent synced events */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-semibold text-sm">Recent telematics events</div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Event</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Severity</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events && events.length > 0 ? (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30" data-testid={`event-${e.id}`}>
                    <td className="px-4 py-2">{e.eventType}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-medium ${e.severity === "high" || e.severity === "critical" ? "text-red-700" : e.severity === "medium" ? "text-amber-700" : "text-muted-foreground"}`}>
                        {e.severity}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground capitalize">{e.provider ?? "manual"}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No events yet — connect a provider and sync to pull live data.
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
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  testid,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  testid?: string;
}) {
  return (
    <input
      data-testid={testid}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
    />
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted/40 py-2">
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
        <CheckCircle2 className="w-3 h-3" /> Connected
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
        <AlertTriangle className="w-3 h-3" /> Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[11px] font-medium text-muted-foreground bg-muted border border-border rounded-full px-2 py-0.5">
      Disconnected
    </span>
  );
}
