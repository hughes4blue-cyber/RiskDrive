import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  telematicsConnectionsTable,
  telematicsEventsTable,
  vehiclesTable,
} from "@workspace/db";
import {
  CreateTelematicsConnectionBody,
  type TelematicsConnection as TelematicsConnectionType,
} from "@workspace/api-zod";
import { encryptSecret } from "../lib/crypto";
import { createClient, syncConnection } from "../lib/telematics";
import { scopeWhere, inScope } from "../lib/scope";

const router: IRouter = Router();

/** Strips secret/internal fields before returning a connection to clients. */
function toPublic(row: typeof telematicsConnectionsTable.$inferSelect): TelematicsConnectionType {
  return {
    id: row.id,
    facilityId: row.facilityId,
    provider: row.provider as TelematicsConnectionType["provider"],
    status: row.status as TelematicsConnectionType["status"],
    accountLabel: row.accountLabel,
    externalOrgName: row.externalOrgName,
    vehicleCount: row.vehicleCount,
    driverCount: row.driverCount,
    lastSyncAt: row.lastSyncAt ? row.lastSyncAt.toISOString() : null,
    lastError: row.lastError,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function parseId(raw: string | string[]): number {
  return parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
}

/** Builds the provider-specific credential JSON blob from the create input. */
function buildCredentials(input: ReturnType<typeof CreateTelematicsConnectionBody.parse>): string | null {
  if (input.provider === "samsara") {
    if (!input.apiToken) return null;
    return JSON.stringify({ apiToken: input.apiToken });
  }
  if (input.provider === "geotab") {
    if (!input.database || !input.username || !input.password) return null;
    return JSON.stringify({
      server: input.server ?? "my.geotab.com",
      database: input.database,
      username: input.username,
      password: input.password,
    });
  }
  return null;
}

router.get("/telematics/connections", async (req, res): Promise<void> => {
  const where = scopeWhere(telematicsConnectionsTable.facilityId, req.scopeFacilityIds);
  const rows = where
    ? await db.select().from(telematicsConnectionsTable).where(where).orderBy(desc(telematicsConnectionsTable.createdAt))
    : await db.select().from(telematicsConnectionsTable).orderBy(desc(telematicsConnectionsTable.createdAt));
  res.json(rows.map(toPublic));
});

router.get("/telematics/connections/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const [row] = await db
    .select()
    .from(telematicsConnectionsTable)
    .where(eq(telematicsConnectionsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Connection not found" });
    return;
  }
  if (!inScope(req.scopeFacilityIds, row.facilityId)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  res.json(toPublic(row));
});

router.post("/telematics/connections", async (req, res): Promise<void> => {
  const parsed = CreateTelematicsConnectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const input = parsed.data;

  if (!inScope(req.scopeFacilityIds, input.facilityId)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const credentials = buildCredentials(input);
  if (!credentials) {
    res.status(400).json({
      error:
        input.provider === "samsara"
          ? "Samsara requires an apiToken"
          : "Geotab requires database, username, and password",
    });
    return;
  }

  // Validate the credentials against the live provider before persisting.
  let orgName: string | null = null;
  try {
    const client = createClient(input.provider, credentials);
    const info = await client.validate();
    orgName = info.orgName;
  } catch (err) {
    req.log.warn({ err: (err as Error).message, provider: input.provider }, "Telematics credential validation failed");
    res.status(400).json({ error: `Could not connect to ${input.provider}: ${(err as Error).message}` });
    return;
  }

  const [row] = await db
    .insert(telematicsConnectionsTable)
    .values({
      facilityId: input.facilityId,
      provider: input.provider,
      status: "connected",
      encryptedCredentials: encryptSecret(credentials),
      accountLabel: input.accountLabel ?? null,
      externalOrgName: orgName,
    })
    .returning();

  res.status(201).json(toPublic(row));
});

router.delete("/telematics/connections/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const [row] = await db.select().from(telematicsConnectionsTable).where(eq(telematicsConnectionsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Connection not found" });
    return;
  }
  if (!inScope(req.scopeFacilityIds, row.facilityId)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  await db.delete(telematicsConnectionsTable).where(eq(telematicsConnectionsTable.id, id));
  res.sendStatus(204);
});

router.post("/telematics/connections/:id/sync", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const [row] = await db
    .select()
    .from(telematicsConnectionsTable)
    .where(eq(telematicsConnectionsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Connection not found" });
    return;
  }
  if (!inScope(req.scopeFacilityIds, row.facilityId)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  try {
    const result = await syncConnection(id);
    req.log.info({ connectionId: id, ...result }, "Telematics sync complete");
    res.json({ connectionId: id, ...result });
  } catch (err) {
    req.log.error({ err: (err as Error).message, connectionId: id }, "Telematics sync failed");
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── GET /telematics/events — scoped event list ───────────────────────
router.get("/telematics/events", async (req, res): Promise<void> => {
  const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string, 10), 500) : 100;
  const where = scopeWhere(telematicsEventsTable.facilityId, req.scopeFacilityIds);
  const events = where
    ? await db.select().from(telematicsEventsTable).where(where).orderBy(desc(telematicsEventsTable.timestamp)).limit(limit)
    : await db.select().from(telematicsEventsTable).orderBy(desc(telematicsEventsTable.timestamp)).limit(limit);

  res.json(events.map(e => ({
    id: e.id,
    vehicleId: e.vehicleId,
    facilityId: e.facilityId,
    driverId: e.driverId,
    eventType: e.eventType,
    severity: e.severity,
    latitude: e.latitude,
    longitude: e.longitude,
    speed: e.speed,
    notes: e.notes,
    provider: e.provider,
    timestamp: e.timestamp?.toISOString() ?? new Date().toISOString(),
  })));
});

export default router;
