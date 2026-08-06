/**
 * Samsara webhook — mounted BEFORE requireLiveMode because inbound webhook
 * calls come from Samsara's servers, not from a Clerk-authenticated browser
 * session. Authentication is via HMAC-SHA256 signature instead.
 *
 * Samsara webhook contract (https://developers.samsara.com/docs/webhooks):
 *   - Header X-Samsara-Timestamp: Unix timestamp in SECONDS
 *   - Header X-Samsara-Signature: HMAC-SHA256 of "v1:{timestamp}:{rawBody}",
 *     returned as a hex string (no "sha256=" prefix)
 *   - Payload shape: { data: Array<{ id, eventType, data: { vehicleId, ... } }> }
 *
 * Security posture:
 *   - FAIL-CLOSED: if SAMSARA_WEBHOOK_SECRET is not set, every request is
 *     rejected with 503 (server misconfigured) rather than accepted.
 *   - X-Samsara-Timestamp header REQUIRED — missing → 401.
 *   - Timestamp must be within ±5 minutes — replay protection.
 *   - HMAC mismatch → 401 (constant-time compare, verified before body parse).
 *   - Signature header missing → 401.
 *   - Facility attribution: events are linked via the Samsara connection's
 *     facilityId, not assumed from any client-supplied field.
 *   - Idempotency: (facilityId, provider, externalId) unique index with
 *     onConflictDoNothing; only events that actually insert increment the counter.
 *     Events without a provider-supplied ID get a deterministic synthetic key
 *     (vehicleDeviceId:eventType:timestamp) so they are still deduplicated within
 *     the replay window.
 */

import { Router } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  db,
  telematicsConnectionsTable,
  telematicsEventsTable,
  vehiclesTable,
} from "@workspace/db";
import type { Request } from "express";

const SAMSARA_WEBHOOK_SECRET = process.env.SAMSARA_WEBHOOK_SECRET;
/** Maximum allowed drift between the request timestamp and server clock, in seconds. */
const MAX_TIMESTAMP_DRIFT_S = 5 * 60; // 5 minutes

const router = Router();

router.post("/telematics/webhooks/samsara", async (req: Request & { rawBody?: Buffer }, res): Promise<void> => {
  // Fail-closed: secret must be configured or we are not ready to receive
  if (!SAMSARA_WEBHOOK_SECRET) {
    req.log?.warn("SAMSARA_WEBHOOK_SECRET is not set — rejecting webhook");
    res.status(503).json({ error: "Webhook endpoint not configured" });
    return;
  }

  // Timestamp header REQUIRED (epoch seconds) — reject if missing
  const tsHeader = req.headers["x-samsara-timestamp"] as string | undefined;
  if (!tsHeader) {
    res.status(401).json({ error: "Missing X-Samsara-Timestamp header" });
    return;
  }

  // Replay protection: timestamp must be within ±5 minutes of server clock.
  // Samsara sends epoch seconds, so compare in seconds.
  const tsSeconds = parseInt(tsHeader, 10);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(tsSeconds) || Math.abs(nowSeconds - tsSeconds) > MAX_TIMESTAMP_DRIFT_S) {
    res.status(401).json({ error: "Request timestamp out of acceptable range" });
    return;
  }

  // Signature header must be present
  const sig = req.headers["x-samsara-signature"] as string | undefined;
  if (!sig) {
    res.status(401).json({ error: "Missing X-Samsara-Signature header" });
    return;
  }

  // HMAC verification.
  // Samsara signs the canonical string "v1:{timestamp}:{rawBody}" using the webhook secret.
  // We verify against the raw request body bytes captured before JSON parsing.
  const rawBodyStr = req.rawBody
    ? req.rawBody.toString("utf8")
    : JSON.stringify(req.body);
  const signingPayload = `v1:${tsHeader}:${rawBodyStr}`;

  let givenBuf: Buffer;
  let expectedBuf: Buffer;
  try {
    givenBuf = Buffer.from(sig, "hex");
    expectedBuf = Buffer.from(
      createHmac("sha256", SAMSARA_WEBHOOK_SECRET).update(signingPayload).digest("hex"),
      "hex",
    );
  } catch {
    res.status(401).json({ error: "Malformed signature" });
    return;
  }

  if (givenBuf.length === 0 || givenBuf.length !== expectedBuf.length || !timingSafeEqual(givenBuf, expectedBuf)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  // Process events
  const events: Array<{
    id?: string;
    eventType?: string;
    data?: {
      vehicleId?: string;
      driverId?: string;
      speed?: number;
      latitude?: number;
      longitude?: number;
    };
  }> = Array.isArray(req.body?.data) ? req.body.data : [];

  const eventTypeMap: Record<string, string> = {
    HarshBrakeEvent: "hard_braking",
    HarshAccelEvent: "harsh_acceleration",
    SpeedingEvent: "speeding",
    PhoneUsageEvent: "phone_usage",
  };

  let inserted = 0;
  let skipped = 0;
  let duplicates = 0;

  for (const event of events) {
    if (!event.data?.vehicleId) { skipped++; continue; }

    // Resolve vehicle by the identifier Samsara sync stores:
    // syncConnection upserts vehicles keyed on (facilityId, provider='samsara', externalId),
    // where externalId = Samsara's vehicle ID string. telematicsDeviceId is not populated by sync.
    const [vehicle] = await db
      .select()
      .from(vehiclesTable)
      .where(and(
        eq(vehiclesTable.provider, "samsara"),
        eq(vehiclesTable.externalId, event.data.vehicleId),
      ))
      .limit(1);
    if (!vehicle) { skipped++; continue; }

    // Facility attribution: find the active Samsara connection for this vehicle's facility.
    // Only accept events from facilities with a live, connected integration.
    const [connection] = await db
      .select({ id: telematicsConnectionsTable.id })
      .from(telematicsConnectionsTable)
      .where(and(
        eq(telematicsConnectionsTable.facilityId, vehicle.facilityId),
        eq(telematicsConnectionsTable.provider, "samsara"),
        eq(telematicsConnectionsTable.status, "connected"),
      ))
      .limit(1);

    if (!connection) {
      // No active Samsara connection for this facility — skip silently
      skipped++;
      continue;
    }

    const normalizedType =
      eventTypeMap[event.eventType ?? ""] ??
      (event.eventType ?? "unknown").toLowerCase();

    const speed = event.data.speed ?? 0;
    const severity: "high" | "medium" | "low" | "critical" =
      speed > 80 || normalizedType === "phone_usage" ? "high"
      : speed > 65 ? "medium"
      : "low";

    // Idempotency key: use provider-supplied event ID when available.
    // When absent, derive a deterministic key from stable event fields so that
    // events without IDs are still deduplicated within the replay window.
    const externalId = event.id
      ? String(event.id)
      : `synthetic:${event.data.vehicleId}:${normalizedType}:${tsHeader}`;

    try {
      // Use .returning() so we know whether the row was actually inserted
      // or silently skipped by onConflictDoNothing.
      const rows = await db
        .insert(telematicsEventsTable)
        .values({
          vehicleId: vehicle.id,
          facilityId: vehicle.facilityId,
          driverId: vehicle.assignedDriverId,
          eventType: normalizedType,
          severity,
          speed,
          latitude: event.data.latitude ?? 0,
          longitude: event.data.longitude ?? 0,
          provider: "samsara",
          externalId,
        })
        .onConflictDoNothing()
        .returning({ id: telematicsEventsTable.id });

      if (rows.length > 0) {
        inserted++;
      } else {
        duplicates++;
      }
    } catch (err) {
      req.log?.warn({ err: (err as Error).message }, "Telematics event insert failed");
      skipped++;
    }
  }

  res.status(200).json({ received: events.length, inserted, duplicates, skipped });
});

export default router;
