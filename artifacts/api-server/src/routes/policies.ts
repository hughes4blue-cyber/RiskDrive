import { Router } from "express";
import { db } from "@workspace/db";
import { submissionsTable, policiesTable, facilitiesTable, clubsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { scopeWhere, inScope } from "../lib/scope";

const router = Router();

const SUBMISSION_STEPS = ["draft", "submitted", "prequalified", "quoted", "bound"];

async function formatSubmission(s: typeof submissionsTable.$inferSelect) {
  const [facility] = await db.select({ f: facilitiesTable, clubName: clubsTable.name })
    .from(facilitiesTable)
    .leftJoin(clubsTable, eq(facilitiesTable.clubId, clubsTable.id))
    .where(eq(facilitiesTable.id, s.facilityId));
  return {
    id: s.id,
    facilityId: s.facilityId,
    facilityName: facility?.f.name ?? null,
    clubName: facility?.clubName ?? null,
    status: s.status,
    carrierName: s.carrierName,
    notes: s.notes,
    submittedAt: s.submittedAt?.toISOString() ?? null,
    prequalifiedAt: s.prequalifiedAt?.toISOString() ?? null,
    quotedAt: s.quotedAt?.toISOString() ?? null,
    boundAt: s.boundAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function formatPolicy(p: typeof policiesTable.$inferSelect, facilityName?: string | null, clubName?: string | null) {
  return {
    id: p.id,
    facilityId: p.facilityId,
    facilityName: facilityName ?? null,
    clubName: clubName ?? null,
    submissionId: p.submissionId,
    policyNumber: p.policyNumber,
    carrier: p.carrier,
    coverageType: p.coverageType,
    premiumAmount: p.premiumAmount,
    deductible: p.deductible,
    coverageLimit: p.coverageLimit,
    effectiveDate: p.effectiveDate,
    expiryDate: p.expiryDate,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/submissions", async (req, res) => {
  const where = scopeWhere(submissionsTable.facilityId, req.scopeFacilityIds);
  const rows = where
    ? await db.select().from(submissionsTable).where(where).orderBy(desc(submissionsTable.updatedAt))
    : await db.select().from(submissionsTable).orderBy(desc(submissionsTable.updatedAt));
  const result = await Promise.all(rows.map(formatSubmission));
  res.json(result);
});

router.post("/submissions", async (req, res) => {
  const { facilityId, carrierName, notes } = req.body as { facilityId: number; carrierName?: string; notes?: string };
  if (!facilityId) return res.status(400).json({ error: "facilityId required" });
  if (!inScope(req.scopeFacilityIds, facilityId)) {
    return res.status(403).json({ error: "Access denied" });
  }

  const [s] = await db.insert(submissionsTable).values({
    facilityId,
    status: "draft",
    carrierName: carrierName ?? null,
    notes: notes ?? null,
  }).returning();

  return res.status(201).json(await formatSubmission(s));
});

router.get("/submissions/:submissionId", async (req, res) => {
  const id = parseInt(req.params.submissionId as string);
  const [s] = await db.select().from(submissionsTable).where(eq(submissionsTable.id, id));
  if (!s) return res.status(404).json({ error: "Submission not found" });
  if (!inScope(req.scopeFacilityIds, s.facilityId)) {
    return res.status(403).json({ error: "Access denied" });
  }
  return res.json(await formatSubmission(s));
});

router.patch("/submissions/:submissionId/advance", async (req, res) => {
  const id = parseInt(req.params.submissionId as string);
  const [s] = await db.select().from(submissionsTable).where(eq(submissionsTable.id, id));
  if (!s) return res.status(404).json({ error: "Submission not found" });
  if (!inScope(req.scopeFacilityIds, s.facilityId)) {
    return res.status(403).json({ error: "Access denied" });
  }

  const currentIdx = SUBMISSION_STEPS.indexOf(s.status);
  if (currentIdx === -1 || currentIdx === SUBMISSION_STEPS.length - 1) {
    return res.status(400).json({ error: "Cannot advance from current status" });
  }

  const nextStatus = SUBMISSION_STEPS[currentIdx + 1];
  const now = new Date();
  const update: Partial<typeof submissionsTable.$inferInsert> = {
    status: nextStatus,
    updatedAt: now,
  };
  if (nextStatus === "submitted") update.submittedAt = now;
  if (nextStatus === "prequalified") update.prequalifiedAt = now;
  if (nextStatus === "quoted") update.quotedAt = now;
  if (nextStatus === "bound") update.boundAt = now;

  const { notes, carrierName } = req.body as { notes?: string; carrierName?: string };
  if (notes !== undefined) update.notes = notes;
  if (carrierName !== undefined) update.carrierName = carrierName;

  const [updated] = await db.update(submissionsTable).set(update).where(eq(submissionsTable.id, id)).returning();
  return res.json(await formatSubmission(updated));
});

router.get("/policies", async (req, res) => {
  const where = scopeWhere(policiesTable.facilityId, req.scopeFacilityIds);
  const rows = where
    ? await db.select().from(policiesTable).where(where).orderBy(desc(policiesTable.createdAt))
    : await db.select().from(policiesTable).orderBy(desc(policiesTable.createdAt));

  const result = await Promise.all(rows.map(async (p) => {
    const [fac] = await db.select({ f: facilitiesTable, clubName: clubsTable.name })
      .from(facilitiesTable)
      .leftJoin(clubsTable, eq(facilitiesTable.clubId, clubsTable.id))
      .where(eq(facilitiesTable.id, p.facilityId));
    return formatPolicy(p, fac?.f.name, fac?.clubName);
  }));
  res.json(result);
});

router.get("/policies/:policyId", async (req, res) => {
  const id = parseInt(req.params.policyId as string);
  const [p] = await db.select().from(policiesTable).where(eq(policiesTable.id, id));
  if (!p) return res.status(404).json({ error: "Policy not found" });
  if (!inScope(req.scopeFacilityIds, p.facilityId)) {
    return res.status(403).json({ error: "Access denied" });
  }
  const [fac] = await db.select({ f: facilitiesTable, clubName: clubsTable.name })
    .from(facilitiesTable)
    .leftJoin(clubsTable, eq(facilitiesTable.clubId, clubsTable.id))
    .where(eq(facilitiesTable.id, p.facilityId));
  return res.json(formatPolicy(p, fac?.f.name, fac?.clubName));
});

export default router;
