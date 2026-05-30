import type {
  TelematicsClient,
  NormalizedVehicle,
  NormalizedDriver,
  NormalizedEvent,
  ProviderAccountInfo,
} from "./types";

export interface GeotabCredentials {
  server: string;
  database: string;
  username: string;
  password: string;
}

interface GeotabAuthResult {
  credentials: { database: string; userName: string; sessionId: string };
  path: string;
}

interface GeotabDevice {
  id: string;
  name?: string;
  serialNumber?: string;
  vehicleIdentificationNumber?: string;
  licensePlate?: string;
}

interface GeotabUser {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phoneNumber?: string;
  licenseNumber?: string;
  isDriver?: boolean;
}

interface GeotabExceptionEvent {
  id?: string;
  activeFrom?: string;
  device?: { id?: string };
  driver?: { id?: string } | string;
  rule?: { id?: string; name?: string };
}

/**
 * Real Geotab MyGeotab JSON-RPC client. Auth via database + username + password,
 * which yields a session credentials object reused for subsequent calls. Geotab
 * may redirect to a federated server via the auth `path` field.
 */
export class GeotabClient implements TelematicsClient {
  private session: GeotabAuthResult | null = null;
  private activeServer: string;

  constructor(private readonly creds: GeotabCredentials) {
    if (!creds?.database || !creds?.username || !creds?.password) {
      throw new Error("Geotab database, username, and password are required");
    }
    this.activeServer = this.normalizeServer(creds.server || "my.geotab.com");
  }

  private normalizeServer(server: string): string {
    return server.replace(/^https?:\/\//, "").replace(/\/+$/, "").replace(/\/apiv1$/, "");
  }

  private async rpc<T>(server: string, method: string, params: Record<string, unknown>): Promise<T> {
    const res = await fetch(`https://${server}/apiv1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, params }),
    });
    if (!res.ok) {
      throw new Error(`Geotab API error ${res.status}`);
    }
    const json = (await res.json()) as { result?: T; error?: { message?: string; errors?: Array<{ message?: string }> } };
    if (json.error) {
      const msg = json.error.errors?.[0]?.message ?? json.error.message ?? "Unknown Geotab error";
      throw new Error(`Geotab: ${msg}`);
    }
    return json.result as T;
  }

  private async auth(): Promise<GeotabAuthResult> {
    if (this.session) return this.session;
    const result = await this.rpc<GeotabAuthResult>(this.activeServer, "Authenticate", {
      database: this.creds.database,
      userName: this.creds.username,
      password: this.creds.password,
    });
    if (result.path && result.path !== "ThisServer") {
      this.activeServer = this.normalizeServer(result.path);
    }
    this.session = result;
    return result;
  }

  private async get<T>(typeName: string, search?: Record<string, unknown>): Promise<T[]> {
    const { credentials } = await this.auth();
    return this.rpc<T[]>(this.activeServer, "Get", {
      typeName,
      credentials,
      ...(search ? { search } : {}),
    });
  }

  async validate(): Promise<ProviderAccountInfo> {
    const auth = await this.auth();
    return { orgName: auth.credentials.database };
  }

  async listVehicles(): Promise<NormalizedVehicle[]> {
    const devices = await this.get<GeotabDevice>("Device");
    return devices.map((d) => ({
      externalId: String(d.id),
      name: d.name ?? d.serialNumber ?? String(d.id),
      vin: d.vehicleIdentificationNumber ?? null,
      make: null,
      model: null,
      year: null,
      licensePlate: d.licensePlate ?? null,
    }));
  }

  async listDrivers(): Promise<NormalizedDriver[]> {
    const users = await this.get<GeotabUser>("User", { isDriver: true });
    return users
      .filter((u) => u.isDriver !== false)
      .map((u) => ({
        externalId: String(u.id),
        firstName: u.firstName ?? u.name ?? String(u.id),
        lastName: u.lastName ?? "",
        licenseNumber: u.licenseNumber ?? null,
        phone: u.phoneNumber ?? null,
      }));
  }

  async listEvents(since: Date): Promise<NormalizedEvent[]> {
    const events = await this.get<GeotabExceptionEvent>("ExceptionEvent", {
      fromDate: since.toISOString(),
    });
    return events.map((e, i) => {
      const driverId =
        typeof e.driver === "string" ? e.driver : e.driver?.id != null ? String(e.driver.id) : null;
      const when = e.activeFrom ? new Date(e.activeFrom) : new Date();
      return {
        externalId: String(e.id ?? `${e.device?.id ?? "d"}-${e.activeFrom ?? i}`),
        vehicleExternalId: e.device?.id != null ? String(e.device.id) : null,
        driverExternalId: driverId,
        eventType: e.rule?.name ?? "Exception Event",
        severity: "medium" as const,
        latitude: 0,
        longitude: 0,
        speed: 0,
        notes: e.rule?.name ?? null,
        timestamp: when,
      };
    });
  }
}
