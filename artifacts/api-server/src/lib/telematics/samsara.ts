import type {
  TelematicsClient,
  NormalizedVehicle,
  NormalizedDriver,
  NormalizedEvent,
  ProviderAccountInfo,
  EventSeverity,
} from "./types";

const BASE = process.env.SAMSARA_API_BASE ?? "https://api.samsara.com";

export interface SamsaraCredentials {
  apiToken: string;
}

interface SamsaraPage<T> {
  data: T[];
  pagination?: { endCursor?: string; hasNextPage?: boolean };
}

interface SamsaraVehicle {
  id: string;
  name?: string;
  vin?: string;
  make?: string;
  model?: string;
  year?: string | number;
  licensePlate?: string;
}

interface SamsaraDriver {
  id: string;
  name?: string;
  username?: string;
  phone?: string;
  licenseNumber?: string;
  licenseState?: string;
}

interface SamsaraSafetyEvent {
  id?: string;
  time?: string;
  timestamp?: string;
  vehicle?: { id?: string; name?: string };
  driver?: { id?: string; name?: string };
  behaviorLabels?: Array<{ name?: string; label?: string }>;
  harshAccelerationType?: string;
  maxAccelerationGForce?: number;
  speed?: number;
  location?: { latitude?: number; longitude?: number };
  latitude?: number;
  longitude?: number;
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: full || "Unknown", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/** Real Samsara Cloud API client. Auth via long-lived API token (Bearer). */
export class SamsaraClient implements TelematicsClient {
  constructor(private readonly creds: SamsaraCredentials) {
    if (!creds?.apiToken) throw new Error("Samsara API token is required");
  }

  private async req<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(BASE + path);
    if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.creds.apiToken}`, Accept: "application/json" },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const detail = body.slice(0, 300);
      if (res.status === 401 || res.status === 403) {
        throw new Error(`Samsara authentication failed (${res.status}). Check the API token and its scopes.`);
      }
      throw new Error(`Samsara API error ${res.status}: ${detail}`);
    }
    return (await res.json()) as T;
  }

  private async paginate<T>(path: string): Promise<T[]> {
    const out: T[] = [];
    let after: string | undefined;
    do {
      const params: Record<string, string> = { limit: "512" };
      if (after) params.after = after;
      const page = await this.req<SamsaraPage<T>>(path, params);
      out.push(...(page.data ?? []));
      after = page.pagination?.hasNextPage ? page.pagination.endCursor : undefined;
    } while (after);
    return out;
  }

  async validate(): Promise<ProviderAccountInfo> {
    await this.req<SamsaraPage<SamsaraVehicle>>("/fleet/vehicles", { limit: "1" });
    return { orgName: null };
  }

  async listVehicles(): Promise<NormalizedVehicle[]> {
    const vehicles = await this.paginate<SamsaraVehicle>("/fleet/vehicles");
    return vehicles.map((v) => ({
      externalId: String(v.id),
      name: v.name ?? v.vin ?? String(v.id),
      vin: v.vin ?? null,
      make: v.make ?? null,
      model: v.model ?? null,
      year: v.year != null ? Number(v.year) || null : null,
      licensePlate: v.licensePlate ?? null,
    }));
  }

  async listDrivers(): Promise<NormalizedDriver[]> {
    const drivers = await this.paginate<SamsaraDriver>("/fleet/drivers");
    return drivers.map((d) => {
      const { firstName, lastName } = splitName(d.name ?? d.username ?? String(d.id));
      return {
        externalId: String(d.id),
        firstName,
        lastName,
        licenseNumber: d.licenseNumber ?? null,
        phone: d.phone ?? null,
      };
    });
  }

  async listEvents(since: Date): Promise<NormalizedEvent[]> {
    const startTime = since.toISOString();
    const endTime = new Date().toISOString();
    const page = await this.req<SamsaraPage<SamsaraSafetyEvent>>("/fleet/safety-events", {
      startTime,
      endTime,
    });
    const events = page.data ?? [];
    return events.map((e, i) => {
      const label =
        e.harshAccelerationType ??
        e.behaviorLabels?.map((b) => b.label ?? b.name).filter(Boolean).join(", ") ??
        "Safety Event";
      const g = e.maxAccelerationGForce ?? 0;
      const severity: EventSeverity = g >= 0.5 ? "high" : g >= 0.3 ? "medium" : "low";
      const when = e.time ?? e.timestamp;
      return {
        externalId: String(e.id ?? `${e.vehicle?.id ?? "v"}-${when ?? i}`),
        vehicleExternalId: e.vehicle?.id != null ? String(e.vehicle.id) : null,
        driverExternalId: e.driver?.id != null ? String(e.driver.id) : null,
        eventType: label,
        severity,
        latitude: e.location?.latitude ?? e.latitude ?? 0,
        longitude: e.location?.longitude ?? e.longitude ?? 0,
        speed: e.speed ?? 0,
        notes: e.driver?.name ? `Driver: ${e.driver.name}` : null,
        timestamp: when ? new Date(when) : new Date(),
      };
    });
  }
}
