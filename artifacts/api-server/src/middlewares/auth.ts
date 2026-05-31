import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable, appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = "ahughes@affinityrisk.com";

// ── Mode cache (30-second TTL) ──────────────────────────────────────
let cachedMode: "demo" | "live" = "demo";
let modeCacheExpiry = 0;

export async function getAppMode(): Promise<"demo" | "live"> {
  if (Date.now() < modeCacheExpiry) return cachedMode;
  try {
    const rows = await db
      .select()
      .from(appSettingsTable)
      .where(eq(appSettingsTable.id, 1))
      .limit(1);
    const dbMode = rows[0]?.mode;
    if (dbMode === "live") {
      cachedMode = "live";
    } else if (dbMode === "demo") {
      cachedMode = "demo";
    } else {
      // Fall back to env var, default demo
      cachedMode = process.env.APP_MODE === "live" ? "live" : "demo";
    }
  } catch {
    cachedMode = process.env.APP_MODE === "live" ? "live" : "demo";
  }
  modeCacheExpiry = Date.now() + 30_000;
  return cachedMode;
}

export function invalidateModeCache(): void {
  modeCacheExpiry = 0;
}

// ── JIT user provisioning ────────────────────────────────────────────
export async function resolveUser(
  clerkUserId: string,
  email?: string,
): Promise<typeof usersTable.$inferSelect> {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);
  if (existing[0]) return existing[0];

  const isAdmin = !!email && email.toLowerCase() === ADMIN_EMAIL;
  const [newUser] = await db
    .insert(usersTable)
    .values({
      clerkUserId,
      email: email ?? "",
      role: isAdmin ? "super_admin" : null,
      approvalStatus: isAdmin ? "approved" : "pending",
    })
    .returning();
  return newUser!;
}

// ── Extend Express request types ─────────────────────────────────────
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      appUser?: typeof usersTable.$inferSelect;
    }
  }
}

// ── requireAuth — always needs Clerk session, regardless of mode ─────
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const email = auth.sessionClaims?.email as string | undefined;
  req.appUser = await resolveUser(auth.userId, email);
  next();
}

// ── requireLiveMode — gates all regular routes in Live mode ──────────
// Demo mode: pass through (no login needed).
// Live mode: must be signed in AND approved.
export async function requireLiveMode(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const mode = await getAppMode();
  if (mode === "demo") {
    next();
    return;
  }
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const email = auth.sessionClaims?.email as string | undefined;
  const user = await resolveUser(auth.userId, email);
  if (user.approvalStatus !== "approved") {
    res
      .status(403)
      .json({ error: "pending_approval", approvalStatus: user.approvalStatus });
    return;
  }
  req.appUser = user;
  next();
}

// ── requireSuperAdmin — admin-only routes (mode-independent) ─────────
export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const user = req.appUser;
  if (!user || user.role !== "super_admin") {
    res.status(403).json({ error: "Super admin access required" });
    return;
  }
  next();
}

// ── injectScopeParams — narrows list queries by the user's role ──────
// Must run AFTER requireLiveMode (req.appUser set only in Live mode).
// In Demo mode req.appUser is undefined → no-op, all data visible.
export function injectScopeParams(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const user = req.appUser;
  if (!user) {
    next();
    return;
  }
  if (user.role === "shop_owner" && user.facilityId != null) {
    req.query = { ...req.query, facilityId: String(user.facilityId) };
  } else if (user.role === "club" && user.clubId != null) {
    req.query = { ...req.query, clubId: String(user.clubId) };
  }
  // super_admin: no filtering
  next();
}
