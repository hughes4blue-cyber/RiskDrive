# Threat Model

## Project Overview

Affinity Risk Solutions is a public web application for fleet and towing-risk operations, built as a pnpm monorepo with a React frontend (`artifacts/affinity-risk`), an Express 5 API (`artifacts/api-server`), PostgreSQL via Drizzle (`lib/db`), and an OpenAPI contract (`lib/api-spec/openapi.yaml`). The production deployment is public, so every browser client and every request reaching `/api` must be treated as untrusted. The mockup sandbox artifact is a development-only environment and should be ignored for production scans unless it becomes reachable from the deployed app.

## Assets

- **Operational fleet data** — club, facility, driver, vehicle, accident, claim, onboarding, certificate, training, and settlement records. Exposure would reveal business-sensitive operations and insurer relationships.
- **Personal and contact data** — facility owner names, emails, phone numbers, driver names, phone numbers, and license numbers. Exposure harms privacy and can enable targeted abuse.
- **Vehicle and telematics data** — VINs, license plates, telematics device identifiers, event histories, and latitude/longitude telemetry. Exposure can reveal asset identity, driver behavior, and physical movement patterns.
- **Workflow integrity** — claim progression, onboarding checklist completion, driver feedback acknowledgment, accident reporting, training assignments, and certificate/submission creation. Unauthorized writes can corrupt insurance, compliance, and safety workflows.
- **Application and database availability** — the API has direct database access and several endpoints compute aggregates over broad tables. Abuse could degrade service or amplify database load.

## Trust Boundaries

- **Browser to API** — all client requests to `/api` cross from an untrusted public client into trusted backend code. Authentication, authorization, validation, and rate-limiting must be enforced server-side.
- **API to PostgreSQL** — the API can read and mutate the full application dataset. Any broken access control or injection issue at the API layer can expose or alter stored records broadly.
- **Public to authenticated/internal workflows** — health checks may be public, but fleet operations, claims, settlements, telematics, onboarding, and policy workflows are sensitive and must not be publicly readable or writable.
- **Production to dev-only artifacts** — `artifacts/mockup-sandbox` is assumed not to be production-reachable and should remain out of scope unless deployment or routing changes make it accessible.

## Scan Anchors

- Production frontend entry: `artifacts/affinity-risk/src/main.tsx` and `src/App.tsx`
- Production API entry: `artifacts/api-server/src/index.ts`, `src/app.ts`, `src/routes/*.ts`
- Highest-risk areas: route handlers exposing DB-backed operational data and all mutating endpoints under `artifacts/api-server/src/routes`
- Shared sensitive schema definitions: `lib/db/src/schema/*.ts`
- API contract source of truth: `lib/api-spec/openapi.yaml`
- Dev-only area to usually ignore: `artifacts/mockup-sandbox/**`

## Threat Categories

### Spoofing

This project currently exposes a public web frontend and a public `/api` surface, but its sensitive routes still need a trustworthy authenticated caller identity before returning or changing tenant data. All non-health endpoints that expose or modify fleet, claims, compliance, or settlement information must require a valid server-verified identity, and any future bearer-token support described in shared client code must be enforced by backend middleware rather than assumed by the client.

### Tampering

The application includes workflow-changing endpoints for submissions, claims, onboarding, accidents, certificates, training, and driver feedback. These operations must only be available to authorized users with the correct role and tenant scope, and server-side validation must restrict status changes and field updates to intended business transitions.

### Information Disclosure

The API handles driver identity data, owner contact information, policy and certificate numbers, settlement figures, VINs, telematics device identifiers, and location telemetry. Responses must be scoped to the authenticated tenant and least-privilege role, and sensitive operational datasets must not be exposed through public list/detail endpoints or unauthenticated dashboards.

### Denial of Service

Many endpoints read whole tables and compute aggregates in application code, especially dashboard, risk, claims, settlements, and summary routes. Publicly reachable endpoints must have reasonable abuse controls and should avoid unbounded fan-out patterns that let unauthenticated callers trigger expensive database-backed work repeatedly.

### Elevation of Privilege

Because routes accept path IDs and query filters for clubs, facilities, drivers, vehicles, claims, and onboarding records, authorization must be enforced independently of any client routing or hidden UI. Users must not be able to access or alter records outside their tenant or role by supplying different numeric identifiers, and every mutating route must reject unauthenticated or under-privileged callers.