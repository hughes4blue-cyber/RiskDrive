import { and, eq, sql } from "drizzle-orm";
import {
  db,
  vehiclesTable,
  driversTable,
  telematicsEventsTable,
  telematicsConnectionsTable,
} from "@workspace/db";
import { decryptSecret } from "../crypto";
import { createClient } from "./index";
import type { NormalizedEvent } from "./types";

export interface SyncResult {
  vehiclesSynced: number;
  driversSynced: number;
  eventsSynced: number;
  orgName: string | null;
}

const EVENT_LOOKBACK_DAYS = 7;

/**
 * Pulls vehicles, drivers, and recent safety events from the provider and upserts
 * them into our DB, keyed on (facilityId, provider, externalId). Updates the
 * connection's status/counts/lastSync. Throws on auth/credential failure.
 */
export async function syncConnection(connectionId: number): Promise<SyncResult> {
  const [conn] = await db
    .select()
    .from(telematicsConnectionsTable)
    .where(eq(telematicsConnectionsTable.id, connectionId));
  if (!conn) throw new Error("Connection not found");
  if (!conn.encryptedCredentials) throw new Error("Connection has no stored credentials");

  const client = createClient(conn.provider, decryptSecret(conn.encryptedCredentials));

  const info = await client.validate();

  // ── Vehicles ──────────────────────────────────────────────────────────────
  // Atomic upsert keyed on (facilityId, provider, externalId) via the partial
  // unique index, so concurrent syncs can't create duplicates.
  const vehicles = await client.listVehicles();
  const vehicleIdByExternal = new Map<string, number>();
  for (const v of vehicles) {
    const [row] = await db
      .insert(vehiclesTable)
      .values({
        facilityId: conn.facilityId,
        make: v.make ?? "Unknown",
        model: v.model ?? v.name,
        year: v.year ?? new Date().getFullYear(),
        licensePlate: v.licensePlate ?? "—",
        vin: v.vin ?? v.externalId,
        provider: conn.provider,
        externalId: v.externalId,
      })
      .onConflictDoUpdate({
        target: [vehiclesTable.facilityId, vehiclesTable.provider, vehiclesTable.externalId],
        targetWhere: sql`${vehiclesTable.externalId} is not null`,
        set: {
          make: sql`coalesce(${v.make ?? null}, ${vehiclesTable.make})`,
          model: sql`coalesce(${v.model ?? null}, ${vehiclesTable.model})`,
          year: sql`coalesce(${v.year ?? null}, ${vehiclesTable.year})`,
          licensePlate: sql`coalesce(${v.licensePlate ?? null}, ${vehiclesTable.licensePlate})`,
          vin: sql`coalesce(${v.vin ?? null}, ${vehiclesTable.vin})`,
        },
      })
      .returning({ id: vehiclesTable.id });
    vehicleIdByExternal.set(v.externalId, row.id);
  }

  // ── Drivers ───────────────────────────────────────────────────────────────
  const drivers = await client.listDrivers();
  const driverIdByExternal = new Map<string, number>();
  for (const d of drivers) {
    const [row] = await db
      .insert(driversTable)
      .values({
        facilityId: conn.facilityId,
        firstName: d.firstName,
        lastName: d.lastName,
        licenseNumber: d.licenseNumber ?? "N/A",
        phone: d.phone,
        provider: conn.provider,
        externalId: d.externalId,
      })
      .onConflictDoUpdate({
        target: [driversTable.facilityId, driversTable.provider, driversTable.externalId],
        targetWhere: sql`${driversTable.externalId} is not null`,
        set: {
          firstName: d.firstName,
          lastName: d.lastName,
          licenseNumber: sql`coalesce(${d.licenseNumber ?? null}, ${driversTable.licenseNumber})`,
          phone: sql`coalesce(${d.phone ?? null}, ${driversTable.phone})`,
        },
      })
      .returning({ id: driversTable.id });
    driverIdByExternal.set(d.externalId, row.id);
  }

  // ── Events (best-effort; some providers/scopes may not expose them) ─────────
  // Deduped on (facilityId, provider, externalId) so external IDs reused across
  // facilities never collide. onConflictDoNothing makes re-syncs idempotent.
  const since = new Date(Date.now() - EVENT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  let events: NormalizedEvent[] = [];
  try {
    events = await client.listEvents(since);
  } catch {
    events = [];
  }
  let eventsSynced = 0;
  for (const e of events) {
    const vehicleId = e.vehicleExternalId ? vehicleIdByExternal.get(e.vehicleExternalId) : undefined;
    if (!vehicleId) continue; // telematics_events.vehicleId is NOT NULL
    const inserted = await db
      .insert(telematicsEventsTable)
      .values({
        facilityId: conn.facilityId,
        vehicleId,
        driverId: e.driverExternalId ? driverIdByExternal.get(e.driverExternalId) ?? null : null,
        eventType: e.eventType,
        severity: e.severity,
        latitude: e.latitude,
        longitude: e.longitude,
        speed: e.speed,
        notes: e.notes,
        provider: conn.provider,
        externalId: e.externalId,
        timestamp: e.timestamp,
      })
      .onConflictDoNothing({
        target: [
          telematicsEventsTable.facilityId,
          telematicsEventsTable.provider,
          telematicsEventsTable.externalId,
        ],
        where: sql`${telematicsEventsTable.externalId} is not null and ${telematicsEventsTable.facilityId} is not null`,
      })
      .returning({ id: telematicsEventsTable.id });
    if (inserted.length > 0) eventsSynced++;
  }

  await db
    .update(telematicsConnectionsTable)
    .set({
      status: "connected",
      vehicleCount: vehicles.length,
      driverCount: drivers.length,
      externalOrgName: info.orgName ?? conn.externalOrgName,
      lastSyncAt: new Date(),
      lastError: null,
    })
    .where(eq(telematicsConnectionsTable.id, conn.id));

  return {
    vehiclesSynced: vehicles.length,
    driversSynced: drivers.length,
    eventsSynced,
    orgName: info.orgName,
  };
}
