import { Router } from "express";
import { db } from "@workspace/db";
import { claimsTable, facilitiesTable, clubsTable, driversTable, accidentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { scopeWhere, inScope } from "../lib/scope";

const router = Router();

const CLAIM_STEPS = ["fnol_received", "assigned", "under_investigation", "adjudication", "closed"];

async function formatClaim(c: typeof claimsTable.$inferSelect) {
  const [facility] = await db.select({ f: facilitiesTable, clubName: clubsTable.name })
    .from(facilitiesTable).leftJoin(clubsTable, eq(facilitiesTable.clubId, clubsTable.id))
    .where(eq(facilitiesTable.id, c.facilityId));
  const [driver] = c.driverId ? await db.select().from(driversTable).where(eq(driversTable.id, c.driverId)) : [null];
  return {
    id: c.id,
    accidentId: c.accidentId,
    facilityId: c.facilityId,
    facilityName: facility?.f.name ?? null,
    clubName: facility?.clubName ?? null,
    driverId: c.driverId,
    driverName: driver ? `${driver.firstName} ${driver.lastName}` : null,
    claimNumber: c.claimNumber,
    tpaName: c.tpaName,
    status: c.status,
    severity: c.severity,
    description: c.description,
    exonerationStatus: c.exonerationStatus,
    settlementAmount: c.settlementAmount,
    reserveAmount: c.reserveAmount,
    litigationNotes: c.litigationNotes,
    isLitigated: c.isLitigated,
    adjusterName: c.adjusterName,
    fnolReceivedAt: c.fnolReceivedAt.toISOString(),
    assignedAt: c.assignedAt?.toISOString() ?? null,
    investigationStartedAt: c.investigationStartedAt?.toISOString() ?? null,
    adjudicatedAt: c.adjudicatedAt?.toISOString() ?? null,
    closedAt: c.closedAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/claims", async (req, res) => {
  const status = req.query.status as string | undefined;
  const where = scopeWhere(claimsTable.facilityId, req.scopeFacilityIds);
  let rows = where
    ? await db.select().from(claimsTable).where(where).orderBy(desc(claimsTable.fnolReceivedAt))
    : await db.select().from(claimsTable).orderBy(desc(claimsTable.fnolReceivedAt));
  if (status) rows = rows.filter(c => c.status === status);
  const result = await Promise.all(rows.map(formatClaim));
  res.json(result);
});

router.get("/claims/summary", async (req, res) => {
  const where = scopeWhere(claimsTable.facilityId, req.scopeFacilityIds);
  const all = where
    ? await db.select().from(claimsTable).where(where)
    : await db.select().from(claimsTable);
  const total = all.length;
  const open = all.filter(c => c.status !== "closed").length;
  const litigated = all.filter(c => c.isLitigated).length;
  const exonerated = all.filter(c => c.exonerationStatus === "exonerated").length;
  const totalReserve = all.reduce((s, c) => s + (c.reserveAmount ?? 0), 0);
  const totalSettled = all.filter(c => c.settlementAmount).reduce((s, c) => s + (c.settlementAmount ?? 0), 0);
  const exonerationRate = total > 0 ? Math.round((exonerated / total) * 100) : 0;
  res.json({ total, open, litigated, exonerated, exonerationRate, totalReserve, totalSettled });
});

router.get("/claims/:claimId", async (req, res) => {
  const id = parseInt(req.params.claimId as string);
  const [c] = await db.select().from(claimsTable).where(eq(claimsTable.id, id));
  if (!c) return res.status(404).json({ error: "Claim not found" });
  if (!inScope(req.scopeFacilityIds, c.facilityId)) {
    return res.status(403).json({ error: "Access denied" });
  }
  return res.json(await formatClaim(c));
});

router.patch("/claims/:claimId/advance", async (req, res) => {
  const id = parseInt(req.params.claimId as string);
  const [c] = await db.select().from(claimsTable).where(eq(claimsTable.id, id));
  if (!c) return res.status(404).json({ error: "Claim not found" });
  if (!inScope(req.scopeFacilityIds, c.facilityId)) {
    return res.status(403).json({ error: "Access denied" });
  }
  const idx = CLAIM_STEPS.indexOf(c.status);
  if (idx === -1 || idx === CLAIM_STEPS.length - 1) return res.status(400).json({ error: "Cannot advance" });
  const nextStatus = CLAIM_STEPS[idx + 1];
  const now = new Date();

  // Build a strictly typed update — only known claim columns are touched
  const update: Partial<typeof claimsTable.$inferInsert> = {
    status: nextStatus,
    updatedAt: now,
  };

  if (nextStatus === "assigned") update.assignedAt = now;
  if (nextStatus === "under_investigation") update.investigationStartedAt = now;
  if (nextStatus === "adjudication") update.adjudicatedAt = now;
  if (nextStatus === "closed") {
    update.closedAt = now;
    const exon = req.body.exonerationStatus;
    update.exonerationStatus =
      exon === "exonerated" || exon === "not_exonerated" || exon === "pending"
        ? exon
        : "pending";
  }

  // Only accept explicitly whitelisted body fields; validate types before writing
  if (typeof req.body.adjusterName === "string") update.adjusterName = req.body.adjusterName;
  if (typeof req.body.reserveAmount === "number") update.reserveAmount = req.body.reserveAmount;
  if (typeof req.body.settlementAmount === "number") update.settlementAmount = req.body.settlementAmount;
  if (typeof req.body.litigationNotes === "string") {
    update.litigationNotes = req.body.litigationNotes;
    update.isLitigated = true;
  }

  const [updated] = await db.update(claimsTable).set(update).where(eq(claimsTable.id, id)).returning();
  return res.json(await formatClaim(updated));
});

export default router;
