# Memory Index

- [Drizzle onConflict + partial index](drizzle-onconflict-partial-index.md) — onConflictDoUpdate uses `targetWhere`, onConflictDoNothing uses `where`; must mirror the index predicate.
- [Telematics multi-tenant integrity](telematics-multitenant-integrity.md) — dedup key = (facilityId,provider,externalId); Samsara webhook needs HMAC verify; WC=AmTrust only.
- [Clerk auth status](clerk-auth-status.md) — Backend fully wired; frontend pages scaffolded but ClerkProvider not yet in App.tsx.
- [RiskDrive telematics sync architecture](telematics-sync-arch.md) — Samsara=Bearer token; Geotab=JSON-RPC+session; sync upserts one-by-one (batching is a known future improvement).
