import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable, appSettingsTable, facilitiesTable } from "@workspace/db";
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
      /**
       * Resolved tenant scope:
       *   null  = no restriction (demo mode, super_admin)
       *   []    = no facility access (unassigned role)
       *   [...]  = exactly these facility IDs are visible
       */
      scopeFacilityIds?: number[] | null;
      /**
       * Club-level scope (mirrors scopeFacilityIds but for the clubs list):
       *   null  = no restriction
       *   []    = no club access
       *   [...]  = exactly these club IDs are visible
       */
      scopeClubIds?: number[] | null;
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

// ── resolveScope — resolves tenant boundaries for every data route ────
// Must run AFTER requireLiveMode (req.appUser set only in Live mode).
// In Demo mode req.appUser is undefined → null scope (all data visible).
//
// super_admin : scopeFacilityIds=null, scopeClubIds=null  (unrestricted)
// club        : scopeFacilityIds = all facilities in user.clubId
//               scopeClubIds    = [user.clubId]
// shop_owner  : scopeFacilityIds = [user.facilityId]
//               scopeClubIds    = [club of that facility]
// unknown     : scopeFacilityIds=[], scopeClubIds=[]  (no access)
export async function resolveScope(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const user = req.appUser;

  // Demo mode (no appUser) or super_admin: unrestricted
  if (!user || user.role === "super_admin") {
    req.scopeFacilityIds = null;
    req.scopeClubIds = null;
    next();
    return;
  }

  if (user.role === "club" && user.clubId != null) {
    const rows = await db
      .select({ id: facilitiesTable.id })
      .from(facilitiesTable)
      .where(eq(facilitiesTable.clubId, user.clubId));
    req.scopeFacilityIds = rows.map((r) => r.id);
    req.scopeClubIds = [user.clubId];
    next();
    return;
  }

  if (user.role === "shop_owner" && user.facilityId != null) {
    const [fac] = await db
      .select({ clubId: facilitiesTable.clubId })
      .from(facilitiesTable)
      .where(eq(facilitiesTable.id, user.facilityId))
      .limit(1);
    req.scopeFacilityIds = [user.facilityId];
    req.scopeClubIds = fac ? [fac.clubId] : [];
    next();
    return;
  }

  // Unassigned role or missing IDs — deny access to all data
  req.scopeFacilityIds = [];
  req.scopeClubIds = [];
  next();
}
