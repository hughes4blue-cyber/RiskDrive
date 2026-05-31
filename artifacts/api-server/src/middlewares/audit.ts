import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";

/**
 * Returns a middleware that writes one row to audit_logs for every request
 * that reaches it. Never throws — a logging failure must never block the
 * actual API response.
 *
 * Usage:
 *   router.get("/drivers", auditAccess("driver"), handler)
 *   router.get("/drivers/:id", auditAccess("driver", r => r.params.id), handler)
 */
export function auditAccess(
  resourceType: string,
  getResourceId?: (req: Request) => string | string[] | null | undefined,
) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Fire-and-forget — never await inside the middleware chain
    void (async () => {
      try {
        const rawId = getResourceId ? getResourceId(req) : null;
        const resourceId = Array.isArray(rawId) ? (rawId[0] ?? null) : (rawId ?? null);
        const metadata: Record<string, unknown> = {};
        if (Object.keys(req.query).length > 0) metadata.query = req.query;
        if (Object.keys(req.params).length > 0) metadata.params = req.params;

        await db.insert(auditLogsTable).values({
          userId: req.appUser?.clerkUserId ?? null,
          userEmail: req.appUser?.email ?? null,
          userRole: req.appUser?.role ?? null,
          action: "read",
          resourceType,
          resourceId: resourceId ?? null,
          ipAddress: (req.ip ?? req.socket?.remoteAddress ?? null),
          userAgent: (req.headers["user-agent"] as string | undefined) ?? null,
          metadata: Object.keys(metadata).length > 0
            ? JSON.stringify(metadata)
            : null,
        });
      } catch {
        // Intentionally silent — audit failure must never surface to callers
      }
    })();

    next();
  };
}
