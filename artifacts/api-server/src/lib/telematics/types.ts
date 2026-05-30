export type ProviderName = "samsara" | "geotab";

export type EventSeverity = "low" | "medium" | "high";

export interface NormalizedVehicle {
  externalId: string;
  name: string;
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  licensePlate: string | null;
}

export interface NormalizedDriver {
  externalId: string;
  firstName: string;
  lastName: string;
  licenseNumber: string | null;
  phone: string | null;
}

export interface NormalizedEvent {
  externalId: string;
  vehicleExternalId: string | null;
  driverExternalId: string | null;
  eventType: string;
  severity: EventSeverity;
  latitude: number;
  longitude: number;
  speed: number;
  notes: string | null;
  timestamp: Date;
}

export interface ProviderAccountInfo {
  orgName: string | null;
}

/**
 * A normalized read interface every telematics provider client implements.
 * Concrete clients (Samsara, Geotab, ...) translate their native API shapes
 * into these provider-agnostic structures.
 */
export interface TelematicsClient {
  /** Verifies credentials/scope by making a lightweight authenticated call. */
  validate(): Promise<ProviderAccountInfo>;
  listVehicles(): Promise<NormalizedVehicle[]>;
  listDrivers(): Promise<NormalizedDriver[]>;
  /** Safety/harsh-driving events on or after `since`. May be empty if unsupported. */
  listEvents(since: Date): Promise<NormalizedEvent[]>;
}
