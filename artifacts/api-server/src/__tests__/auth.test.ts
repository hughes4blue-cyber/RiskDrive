/**
 * Auth-gate integration tests.
 *
 * These tests assert that every data/mutation route requires a valid Clerk
 * session and returns HTTP 401 to unauthenticated callers, while the health
 * endpoint remains public.
 *
 * @clerk/express is mocked so `getAuth()` always returns an empty object
 * (no userId), simulating an unauthenticated request.  The DB module is NOT
 * mocked — the 401 is returned before any DB query is attempted.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// ── Mock Clerk ────────────────────────────────────────────────────────────────
// Must be declared before any app import so vi.mock hoisting takes effect.
vi.mock("@clerk/express", () => ({
  // clerkMiddleware factory: return a no-op middleware (no session attached)
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  // getAuth always returns empty → userId is undefined → 401
  getAuth: () => ({}),
}));

vi.mock("@clerk/shared/keys", () => ({
  publishableKeyFromHost: () => "pk_test_mock",
}));

// ── Import app AFTER mocks ─────────────────────────────────────────────────
import app from "../app.js";

// ── Route catalogue ───────────────────────────────────────────────────────────
// Every entry is [HTTP_METHOD, path].
// Unauthenticated callers must receive HTTP 401 on all of these.

const PROTECTED_ROUTES: [string, string][] = [
  // ── Read-only data routes ──
  ["GET", "/api/clubs"],
  ["GET", "/api/facilities"],
  ["GET", "/api/drivers"],
  ["GET", "/api/vehicles"],
  ["GET", "/api/accidents"],
  ["GET", "/api/claims"],
  ["GET", "/api/claims/summary"],
  ["GET", "/api/settlements"],
  ["GET", "/api/certificates"],
  ["GET", "/api/onboarding"],
  ["GET", "/api/leaderboard"],
  ["GET", "/api/driver-feedback"],
  ["GET", "/api/risk/alerts"],
  ["GET", "/api/dashboard/overview"],
  // ── Previously-public auth/settings routes ──
  ["GET", "/api/auth/me"],
  ["GET", "/api/app-settings/mode"],
  // ── Mutating routes ──
  ["POST", "/api/accidents"],
  ["POST", "/api/accidents/1/initiate-claim"],
  ["PATCH", "/api/claims/1/advance"],
  ["POST", "/api/training/driver/1/assign"],
  ["PATCH", "/api/training/assignment/1/complete"],
  ["POST", "/api/certificates"],
  ["PATCH", "/api/onboarding/1"],
  ["PATCH", "/api/driver-feedback/1/acknowledge"],
];

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("Access control — unauthenticated requests", () => {
  it.each(PROTECTED_ROUTES)(
    "%s %s → 401 without session",
    async (method, path) => {
      const agent = (request(app) as any)[method.toLowerCase()](path);
      const res = await agent
        .set("Content-Type", "application/json")
        .send({});
      expect(res.status, `expected 401 for ${method} ${path}`).toBe(401);
    },
  );

  it("GET /api/healthz → 200 (public health endpoint)", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
  });
});
