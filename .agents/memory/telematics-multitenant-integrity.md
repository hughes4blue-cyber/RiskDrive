---
name: Telematics multi-tenant data integrity (RiskDrive)
description: Facility-scoped dedup keys and webhook auth for provider integrations
---

RiskDrive ingests fleet data from external telematics providers (Samsara, Geotab) per **facility** (tenant). Provider external IDs are only unique *within a provider account*, not globally.

- **Dedup/upsert key must be `(facilityId, provider, externalId)`** for vehicles, drivers, and telematics_events. Keying on just `(provider, externalId)` lets two facilities' records collide and bleed across tenants. Enforced by partial unique indexes + atomic `onConflict` upserts (concurrency-safe; read-then-write races otherwise create dupes).
- `telematics_events.facilityId` is stored explicitly (nullable for legacy/manual rows) so events dedup without joining through the vehicle.
- **Samsara webhook (`POST /api/telematics/webhooks/samsara/:connectionId`) is connection-scoped**: the connectionId in the path resolves the owning facility, and the vehicle is then looked up by `(facilityId, provider, externalId)` — never by `(provider, externalId)` alone, which would mis-attribute events across facilities that reuse external IDs. It also **verifies the HMAC-SHA256 signature** (`X-Samsara-Signature: v1=<hex>`, signed payload `v1:{timestamp}:{rawBody}`) against `SAMSARA_WEBHOOK_SECRET`, with a ~5-min timestamp tolerance for replay protection. Reject 503 if no secret configured, 401 if signature invalid, 404 if the connection is unknown/not samsara. Raw body is captured via `express.json({ verify })` into `req.rawBody`.
- **Known gap (follow-up):** the app has NO authentication/authz on any route (telematics or otherwise). Cross-tenant access control is unenforced platform-wide; treat as a separate auth project, not part of telematics work.

**Why:** Without facility scoping, an attacker or coincidental ID reuse corrupts another tenant's insurance-relevant safety data; without webhook auth anyone can forge incidents.

**Product rule:** Workers Comp = AmTrust EXCLUSIVELY (no multi-carrier wording). Multi-carrier "8+ markets" applies ONLY to Liability (Policies.tsx).
