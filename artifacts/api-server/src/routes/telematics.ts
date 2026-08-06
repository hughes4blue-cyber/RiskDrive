import { Router, type IRouter, type Request } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
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
    ? await db.select().from(telematicsConnectionsTable).where(where).orderBy(desc(telematicsConnectionsTable.updatedAt))
    : await db.select().from(telematicsConnectionsTable).orderBy(desc(telematicsConnectionsTable.updatedAt));
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

  const encryptedCredentials = await encryptSecret(credentials);
  const [created] = await db
    .insert(telematicsConnectionsTable)
    .values({
      facilityId: input.facilityId,
      provider: input.provider,
      accountLabel: input.accountLabel ?? null,
      externalOrgName: orgName,
      encryptedCredentials,
      status: "active",
    })
    .returning();
  res.status(201).json(toPublic(created!));
});

router.delete("/telematics/connections/:id", async (req, res): Promise<void> => {
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
  const limitRaw = req.query.limit;
  const limit = limitRaw ? Math.min(parseId(limitRaw as string) || 50, 500) : 50;

  const base = db
    .select({
      id: telematicsEventsTable.id,
      vehicleId: telematicsEventsTable.vehicleId,
      driverId: telematicsEventsTable.driverId,
      eventType: telematicsEventsTable.eventType,
      severity: telematicsEventsTable.severity,
      latitude: telematicsEventsTable.latitude,
      longitude: telematicsEventsTable.longitude,
      speed: telematicsEventsTable.speed,
      notes: telematicsEventsTable.notes,
      provider: telematicsEventsTable.provider,
      externalId: telematicsEventsTable.externalId,
      timestamp: telematicsEventsTable.timestamp,
    })
    .from(telematicsEventsTable)
    .innerJoin(vehiclesTable, eq(telematicsEventsTable.vehicleId, vehiclesTable.id));

  const scopeFilter = scopeWhere(vehiclesTable.facilityId, req.scopeFacilityIds);
  const rows = scopeFilter
    ? await base.where(scopeFilter).orderBy(desc(telematicsEventsTable.timestamp)).limit(limit)
    : await base.orderBy(desc(telematicsEventsTable.timestamp)).limit(limit);

  res.json(
    rows.map((r) => ({
      ...r,
      timestamp: r.timestamp.toISOString(),
    })),
  );
});

/**
 * Verifies a Samsara webhook HMAC-SHA256 signature against the raw request body.
 * Samsara signs `v1:{timestamp}:{rawBody}` and sends `X-Samsara-Signature: v1=<hex>`
 * plus `X-Samsara-Timestamp`. Returns false on any missing/invalid input.
 */
function verifySamsaraSignature(req: Request, secret: string): boolean {
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  const signatureHeader = req.header("x-samsara-signature");
  const timestamp = req.header("x-samsara-timestamp");
  if (!rawBody || !signatureHeader || !timestamp) return false;

  // Reject stale timestamps (replay protection): 5-minute tolerance.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const provided = signatureHeader.startsWith("v1=") ? signatureHeader.slice(3) : signatureHeader;
  const expected = createHmac("sha256", secret)
    .update(`v1:${timestamp}:${rawBody.toString("utf8")}`)
    .digest("hex");

  const a = Buffer.from(provided, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Samsara webhook receiver — accepts provider-pushed safety/alert events.
// Not part of the client OpenAPI contract. The connection id is carried in the
// path (each connection registers its own webhook URL in Samsara) so events are
// always attributed to the correct facility, and the request must carry a valid
// HMAC signature (SAMSARA_WEBHOOK_SECRET). Unauthenticated requests are rejected.
router.post("/telematics/webhooks/samsara/:connectionId", async (req, res): Promise<void> => {
  const secret = process.env.SAMSARA_WEBHOOK_SECRET;
  if (!secret) {
    req.log.error("Samsara webhook received but SAMSARA_WEBHOOK_SECRET is not configured");
    res.status(503).json({ error: "Webhook ingestion not configured" });
    return;
  }
  if (!verifySamsaraSignature(req, secret)) {
    req.log.warn("Rejected Samsara webhook with invalid or missing signature");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  // Resolve the owning connection so the event is scoped to one facility.
  const connectionId = parseId(req.params.connectionId);
  const [conn] = await db
    .select({ facilityId: telematicsConnectionsTable.facilityId, provider: telematicsConnectionsTable.provider })
    .from(telematicsConnectionsTable)
    .where(eq(telematicsConnectionsTable.id, connectionId));
  if (!conn || conn.provider !== "samsara") {
    res.status(404).json({ error: "Connection not found" });
    return;
  }

  const body = req.body as {
    eventId?: string;
    eventType?: string;
    data?: { vehicle?: { id?: string }; driver?: { id?: string } };
  };
  req.log.info({ eventType: body?.eventType, connectionId }, "Received verified Samsara webhook");

  const externalVehicleId = body?.data?.vehicle?.id != null ? String(body.data.vehicle.id) : null;
  if (externalVehicleId) {
    const [vehicle] = await db
      .select({ id: vehiclesTable.id, facilityId: vehiclesTable.facilityId })
      .from(vehiclesTable)
      .where(
        and(
          eq(vehiclesTable.facilityId, conn.facilityId),
          eq(vehiclesTable.provider, "samsara"),
          eq(vehiclesTable.externalId, externalVehicleId),
        ),
      );
    if (vehicle) {
      // Idempotent on (facilityId, provider, externalId) so retried deliveries
      // of the same Samsara event are not duplicated.
      await db
        .insert(telematicsEventsTable)
        .values({
          facilityId: vehicle.facilityId,
          vehicleId: vehicle.id,
          eventType: body.eventType ?? "webhook_event",
          severity: "medium",
          latitude: 0,
          longitude: 0,
          speed: 0,
          provider: "samsara",
          externalId: body.eventId ?? null,
        })
        .onConflictDoNothing();
    }
  }
  res.sendStatus(200);
});

export default router;
