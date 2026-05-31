---
name: RiskDrive telematics sync architecture
description: How provider clients + sync work; key quirks for Samsara and Geotab
---

## Provider clients
- **Samsara**: Bearer token auth. Base URL from `SAMSARA_API_BASE` env (default https://api.samsara.com). Paginate with `after` cursor. Safety events via `/fleet/safety-events?startTime&endTime`. Webhook HMAC: `v1:{timestamp}:{rawBody}`, header `X-Samsara-Signature: v1=<hex>`, 5-min replay protection.
- **Geotab**: JSON-RPC to `https://{server}/apiv1`. Auth call returns session credentials + possibly a different server path (federation redirect — must update `activeServer`). Subsequent calls reuse session credentials. Drivers fetched with `isDriver: true`.

## Sync flow (syncConnection in sync.ts)
1. Decrypt credentials from DB (AES-256-GCM, key from scrypt(SESSION_SECRET))
2. validate() — lightweight auth check
3. listVehicles() → upsert one-by-one with onConflictDoUpdate; coalesce nulls to preserve local edits
4. listDrivers() → same pattern
5. listEvents(since=7d ago) → onConflictDoNothing; skip events without matching vehicleId
6. Update connection: status=connected, vehicleCount, driverCount, externalOrgName, lastSyncAt

## Known limitation
Upserts are one-by-one (N DB round-trips). For large fleets (200+ vehicles) this is slow. Batch upsert is a planned improvement — see follow-up task.

## Dedup key
`(facilityId, provider, externalId)` via partial unique index (`WHERE externalId IS NOT NULL`). Cross-facility isolation is guaranteed at the DB level.

**Why:** Per-facility scoping prevents a shared externalId across providers or facilities from causing silent data merges.
