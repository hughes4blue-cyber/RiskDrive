---
name: Clerk auth status
description: Current state of Clerk integration and the tenant-scope enforcement pattern used across all data routes.
---

# Clerk Auth — Current State

Clerk is fully integrated (status: `managed`). ClerkProvider is wired in `App.tsx`, all sign-in/sign-up/pending pages exist, and the backend middleware chain is complete.

## Middleware chain (routes/index.ts)

1. `requireLiveMode` — demo mode: passthrough; live mode: must be signed in + approved
2. `resolveScope` — computes `req.scopeFacilityIds` and `req.scopeClubIds` from the DB based on the authenticated user's role

## Scope enforcement pattern

Every data route uses `lib/scope.ts` helpers:
- `scopeWhere(column, ids)` — returns a Drizzle where-clause for list queries (`null` = unrestricted, `[]` = deny all, `[...]` = inArray/eq)
- `inScope(ids, id)` — boolean check for detail/mutation routes

**Why:** `injectScopeParams` (the earlier approach of injecting query params) was insufficient — routes that ignored the injected param would silently expose cross-tenant data. DB-level enforcement via `scopeWhere`/`inScope` is authoritative regardless of what query params are present.

**How to apply:** Any new data route must call `scopeWhere` on its list query and `inScope` on its detail/mutation handlers before returning data. Demo mode and super_admin get `null` scope (unrestricted).

## Role mapping

| Role | scopeFacilityIds | scopeClubIds |
|------|-----------------|--------------|
| `super_admin` / demo | `null` (unrestricted) | `null` |
| `club` | All facility IDs in `user.clubId` | `[user.clubId]` |
| `shop_owner` | `[user.facilityId]` | `[club of that facility]` |
| unassigned | `[]` (deny all) | `[]` |
