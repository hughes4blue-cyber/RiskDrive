import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";
import { desc, eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { requireSuperAdmin } from "../middlewares/auth";

const router = Router();

/**
 * GET /audit-logs
 * Returns paginated audit log entries. Super-admin only.
 *
 * Query params:
 *   page        — 1-based page number (default 1)
 *   limit       — rows per page (default 50, max 200)
 *   resourceType — filter by resource type (optional)
 *   userId      — filter by Clerk user ID (optional)
 */
router.get(
  "/audit-logs",
  requireAuth,
  requireSuperAdmin,
  async (req, res) => {
    const page = Math.max(1, parseInt((req.query.page as string) ?? "1") || 1);
    const limit = Math.min(
      200,
      Math.max(1, parseInt((req.query.limit as string) ?? "50") || 50),
    );
    const offset = (page - 1) * limit;

    const resourceTypeFilter = req.query.resourceType as string | undefined;
    const userIdFilter = req.query.userId as string | undefined;

    const conditions = [];
    if (resourceTypeFilter) {
      conditions.push(eq(auditLogsTable.resourceType, resourceTypeFilter));
    }
    if (userIdFilter) {
      conditions.push(eq(auditLogsTable.userId, userIdFilter));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(auditLogsTable)
        .where(where)
        .orderBy(desc(auditLogsTable.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogsTable)
        .where(where),
    ]);

    const total = countResult[0]?.count ?? 0;

    res.json({
      data: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        userEmail: r.userEmail,
        userRole: r.userRole,
        action: r.action,
        resourceType: r.resourceType,
        resourceId: r.resourceId,
        ipAddress: r.ipAddress,
        userAgent: r.userAgent,
        metadata: r.metadata,
        createdAt: r.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  },
);

export default router;
