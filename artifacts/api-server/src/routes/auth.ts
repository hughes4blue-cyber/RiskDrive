import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  getAppMode,
  invalidateModeCache,
  requireAuth,
  requireSuperAdmin,
  resolveUser,
} from "../middlewares/auth";

const router = Router();

// GET /api/auth/me — current user info + platform mode (requires auth)
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const mode = await getAppMode();
  res.json({ mode, authenticated: true, user: req.appUser });
});

// GET /api/app-settings/mode — returns current mode (requires auth)
router.get("/app-settings/mode", requireAuth, async (_req, res): Promise<void> => {
  const mode = await getAppMode();
  res.json({ mode });
});

// PUT /api/app-settings/mode — super-admin only; works in both demo and live
router.put(
  "/app-settings/mode",
  requireAuth,
  requireSuperAdmin,
  async (req, res): Promise<void> => {
    const { mode } = req.body as { mode?: string };
    if (mode !== "demo" && mode !== "live") {
      res.status(400).json({ error: "mode must be 'demo' or 'live'" });
      return;
    }
    await db
      .insert(appSettingsTable)
      .values({ id: 1, mode, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: appSettingsTable.id,
        set: { mode, updatedAt: new Date() },
      });
    invalidateModeCache();
    res.json({ mode });
  },
);

// GET /api/admin/users — list all users (super-admin only)
router.get(
  "/admin/users",
  requireAuth,
  requireSuperAdmin,
  async (_req, res): Promise<void> => {
    const users = await db
      .select()
      .from(usersTable)
      .orderBy(usersTable.createdAt);
    res.json(users);
  },
);

// PUT /api/admin/users/:userId/approve — approve a pending user
router.put(
  "/admin/users/:userId/approve",
  requireAuth,
  requireSuperAdmin,
  async (req, res): Promise<void> => {
    const id = Number(req.params.userId);
    const { role, clubId, facilityId } = req.body as {
      role?: string;
      clubId?: number;
      facilityId?: number;
    };

    if (!role || !["super_admin", "club", "shop_owner"].includes(role)) {
      res.status(400).json({ error: "role must be super_admin, club, or shop_owner" });
      return;
    }
    if (role === "club" && !clubId) {
      res.status(400).json({ error: "clubId required for club role" });
      return;
    }
    if (role === "shop_owner" && !facilityId) {
      res.status(400).json({ error: "facilityId required for shop_owner role" });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set({
        approvalStatus: "approved",
        role,
        clubId: clubId ?? null,
        facilityId: facilityId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(updated);
  },
);

// PUT /api/admin/users/:userId/deny — deny a user
router.put(
  "/admin/users/:userId/deny",
  requireAuth,
  requireSuperAdmin,
  async (req, res): Promise<void> => {
    const id = Number(req.params.userId);
    const [updated] = await db
      .update(usersTable)
      .set({ approvalStatus: "denied", updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(updated);
  },
);

export default router;
