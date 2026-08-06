/**
 * Positive auth-gate integration tests (demo mode).
 *
 * Verifies that an authenticated caller in demo mode receives non-401
 * responses from data and auth routes.  Both the DB layer and the auth
 * middleware are mocked so the tests are deterministic and do not require a
 * live database connection.
 *
 * The negative (unauthenticated → 401) coverage lives in auth.test.ts.
 */

import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// ── Mock Clerk with a valid session ───────────────────────────────────────────
// All vi.mock calls are hoisted — factories must be self-contained (no refs
// to outer-scope variables defined after the call site).
vi.mock("@clerk/express", () => ({
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  getAuth: () => ({ userId: "vitest_integration_user" }),
}));

vi.mock("@clerk/shared/keys", () => ({
  publishableKeyFromHost: () => "pk_test_mock",
}));

// ── Mock DB ───────────────────────────────────────────────────────────────────
// Chainable query builder that resolves to [].  All factories are inlined so
// they are available after hoisting.
vi.mock("@workspace/db", () => {
  function makeQueryBuilder(result: unknown[] = []): Record<string, unknown> {
    const qb: Record<string, unknown> = {};
    const chain = () => qb;
    qb.from = chain;
    qb.where = chain;
    qb.orderBy = chain;
    qb.limit = chain;
    qb.leftJoin = chain;
    qb.innerJoin = chain;
    qb.then = (
      onFulfilled?: (v: unknown) => unknown,
      onRejected?: (e: unknown) => unknown,
    ) => Promise.resolve(result).then(onFulfilled, onRejected);
    qb.catch = (fn: (e: unknown) => unknown) =>
      Promise.resolve(result).catch(fn);
    qb.finally = (fn: () => void) => Promise.resolve(result).finally(fn);
    return qb;
  }

  const mockUser = {
    id: 1,
    clerkUserId: "vitest_integration_user",
    email: "vitest@example.com",
    role: null,
    approvalStatus: "approved",
    clubId: null,
    facilityId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const db = {
    select: () => makeQueryBuilder([]),
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([mockUser]),
        onConflictDoNothing: () => ({ where: () => Promise.resolve([]) }),
        onConflictDoUpdate: () => ({ returning: () => Promise.resolve([]) }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({ returning: () => Promise.resolve([]) }),
      }),
    }),
    delete: () => ({ where: () => Promise.resolve(0) }),
  };

  // Proxy table — column properties resolve to plain objects that pass
  // through mock query builders without needing real Drizzle internals.
  const makeTable = (name: string) =>
    new Proxy(
      {} as Record<string, unknown>,
      {
        get: (_t, p) => ({
          sql: `"${name}"."${String(p)}"`,
          _tag: "column",
        }),
      },
    );

  return {
    db,
    pool: {
      query: () => Promise.resolve({ rows: [] }),
      end: () => Promise.resolve(),
    },
    clubsTable: makeTable("clubs"),
    facilitiesTable: makeTable("facilities"),
    driversTable: makeTable("drivers"),
    vehiclesTable: makeTable("vehicles"),
    accidentsTable: makeTable("accidents"),
    claimsTable: makeTable("claims"),
    settlementsTable: makeTable("settlements"),
    certificatesTable: makeTable("certificates"),
    trainingTable: makeTable("training"),
    trainingAssignmentsTable: makeTable("training_assignments"),
    onboardingChecklistsTable: makeTable("onboarding"),
    driverFeedbackTable: makeTable("driver_feedback"),
    telematicsEventsTable: makeTable("telematics_events"),
    telematicsConnectionsTable: makeTable("telematics_connections"),
    usersTable: makeTable("users"),
    appSettingsTable: makeTable("app_settings"),
    auditLogsTable: makeTable("audit_logs"),
    policiesTable: makeTable("policies"),
    messagesTable: makeTable("messages"),
    conversationsTable: makeTable("conversations"),
    insuranceDocumentsTable: makeTable("insurance_documents"),
  };
});

// ── Mock auth middleware ───────────────────────────────────────────────────────
// Bypasses DB so tests are fully self-contained.
vi.mock("../middlewares/auth.js", () => {
  const MOCK_USER = {
    id: 1,
    clerkUserId: "vitest_integration_user",
    email: "vitest@example.com",
    role: null,
    approvalStatus: "approved",
    clubId: null,
    facilityId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return {
    getAppMode: async () => "demo" as const,
    invalidateModeCache: () => {},
    resolveUser: async () => MOCK_USER,
    requireAuth: (req: any, _res: any, next: () => void) => {
      req.appUser = MOCK_USER;
      next();
    },
    requireLiveMode: (req: any, _res: any, next: () => void) => {
      req.appUser = MOCK_USER;
      req.appMode = "demo";
      next();
    },
    requireSuperAdmin: (_req: any, res: any) =>
      res.status(403).json({ error: "Super admin access required" }),
    resolveScope: (req: any, _res: any, next: () => void) => {
      req.scopeFacilityIds = null;
      req.scopeClubIds = null;
      next();
    },
  };
});

// ── Import app AFTER all mocks ────────────────────────────────────────────────
import app from "../app.js";

// ── Tests ──────────────────────────────────────────────────────────────────────
describe("Access control — authenticated requests (demo mode)", () => {
  it("GET /api/clubs → 200 with a valid Clerk session", async () => {
    const res = await request(app).get("/api/clubs");
    expect(res.status, `body: ${JSON.stringify(res.body)}`).toBe(200);
  });

  it("GET /api/drivers → 200 with a valid Clerk session", async () => {
    const res = await request(app).get("/api/drivers");
    expect(res.status, `body: ${JSON.stringify(res.body)}`).toBe(200);
  });

  it("GET /api/auth/me → 200 with a valid Clerk session", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status, `body: ${JSON.stringify(res.body)}`).toBe(200);
    expect(res.body).toMatchObject({ authenticated: true });
  });

  it("GET /api/app-settings/mode → 200 with a valid Clerk session", async () => {
    const res = await request(app).get("/api/app-settings/mode");
    expect(res.status, `body: ${JSON.stringify(res.body)}`).toBe(200);
    expect(res.body).toHaveProperty("mode");
  });

  it("GET /api/healthz → 200 (still public)", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.status).toBe(200);
  });
});
