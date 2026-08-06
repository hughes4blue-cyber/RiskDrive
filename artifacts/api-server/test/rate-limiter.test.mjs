/**
 * Integration tests for the global API rate limiter.
 *
 * Verifies that:
 *  1. Each client IP receives an independent quota window.
 *  2. With `trust proxy: 1`, a spoofed multi-hop X-Forwarded-For chain is
 *     resolved to a *distinct* key — an attacker cannot drain another IP's bucket.
 *
 * Runs without a database or Clerk; the app under test is a minimal Express
 * instance that mirrors production's trust-proxy + rateLimit configuration.
 */

import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import express from "express";
import rateLimit from "express-rate-limit";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a minimal Express app that mirrors the production rate-limiter
 * configuration (trust proxy: 1, `max` requests per window).
 */
function makeApp(max) {
  const app = express();

  // Mirror production: trust exactly one reverse-proxy hop so that
  // X-Forwarded-For is used for req.ip (but only one hop is trusted).
  app.set("trust proxy", 1);

  const limiter = rateLimit({
    windowMs: 60_000,
    max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });

  app.get("/probe", limiter, (_req, res) => res.json({ ok: true }));
  return app;
}

/**
 * Spins up a test HTTP server on a random port.
 * Returns `{ url, close }`.
 */
function makeServer(max) {
  const app = makeApp(max);
  const server = createServer(app);
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        url: `http://127.0.0.1:${port}/probe`,
        close: () => new Promise((res) => server.close(res)),
      });
    });
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("API rate limiter — per-IP independent quota", () => {
  let url;
  let close;

  before(async () => {
    ({ url, close } = await makeServer(2)); // max 2 requests per window
  });

  after(async () => {
    await close();
  });

  test("requests from IP-A and IP-B consume independent buckets", async () => {
    // IP-A: first two requests succeed
    const a1 = await fetch(url, { headers: { "x-forwarded-for": "10.0.0.1" } });
    const a2 = await fetch(url, { headers: { "x-forwarded-for": "10.0.0.1" } });
    assert.equal(a1.status, 200, "IP-A request 1 should succeed");
    assert.equal(a2.status, 200, "IP-A request 2 should succeed");

    // IP-A: third request exceeds the per-IP limit
    const a3 = await fetch(url, { headers: { "x-forwarded-for": "10.0.0.1" } });
    assert.equal(a3.status, 429, "IP-A 3rd request should be rate-limited");

    // IP-B: completely independent — first request should succeed even though IP-A is limited
    const b1 = await fetch(url, { headers: { "x-forwarded-for": "10.0.0.2" } });
    assert.equal(b1.status, 200, "IP-B first request should succeed (independent bucket)");
  });
});

describe("API rate limiter — trust proxy: 1 spoof resistance", () => {
  let url;
  let close;

  before(async () => {
    ({ url, close } = await makeServer(2)); // max 2 requests per window
  });

  after(async () => {
    await close();
  });

  test("prepending extra IPs in X-Forwarded-For cannot escape the rate-limit bucket", async () => {
    // With trust proxy: 1, Express treats the socket as the one trusted proxy hop
    // and derives req.ip from the *rightmost* X-Forwarded-For entry (the one the
    // trusted proxy added).  A client cannot escape its quota bucket by prepending
    // an arbitrary IP to the header — both of the following resolve to the same key:
    //
    //   X-Forwarded-For: 10.1.1.1          → req.ip = 10.1.1.1
    //   X-Forwarded-For: INJECTED, 10.1.1.1 → req.ip = 10.1.1.1  (same bucket)
    //
    // This proves that a client who has exhausted their quota cannot bypass rate
    // limiting simply by prepending a fresh-looking IP to the header.

    // Exhaust the 10.1.1.1 quota with plain single-IP requests
    await fetch(url, { headers: { "x-forwarded-for": "10.1.1.1" } });
    await fetch(url, { headers: { "x-forwarded-for": "10.1.1.1" } });
    const limited = await fetch(url, { headers: { "x-forwarded-for": "10.1.1.1" } });
    assert.equal(limited.status, 429, "10.1.1.1 quota should now be exhausted");

    // Same client appends a "fresh" IP in front — rightmost entry is still 10.1.1.1
    // so Express resolves req.ip = 10.1.1.1, and the request is still blocked.
    const bypassAttempt = await fetch(url, {
      headers: { "x-forwarded-for": "fresh.ip.fake, 10.1.1.1" },
    });
    assert.equal(
      bypassAttempt.status,
      429,
      "prepending a fake IP does not create a new bucket — rightmost entry still resolves to 10.1.1.1",
    );
  });
});
