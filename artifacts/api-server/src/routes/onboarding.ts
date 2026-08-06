import { Router } from "express";
import { db } from "@workspace/db";
import { onboardingChecklistsTable, driverFeedbackTable, facilitiesTable, clubsTable, driversTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { scopeWhere, inScope } from "../lib/scope";

const router = Router();

const CHECKLIST_FIELDS = [
  "coiSubmitted", "coiVerified", "contractSigned", "taxStatusVerified",
  "articlesOfIncorporationVerified", "driversLicenseRequirementsVerified",
  "vehicleInspectionComplete", "telematicsAgreementSigned",
  "telematicsDeviceInstalled", "backgroundChecksPassed",
] as const;

function computeStatus(row: typeof onboardingChecklistsTable.$inferSelect): string {
  const all = CHECKLIST_FIELDS.every(f => row[f]);
  if (all) return "complete";
  const any = CHECKLIST_FIELDS.some(f => row[f]);
  return any ? "in_progress" : "pending";
}

async function formatChecklist(row: typeof onboardingChecklistsTable.$inferSelect) {
  const [fac] = await db.select({ f: facilitiesTable, clubName: clubsTable.name })
    .from(facilitiesTable).leftJoin(clubsTable, eq(facilitiesTable.clubId, clubsTable.id))
    .where(eq(facilitiesTable.id, row.facilityId));
  const completedCount = CHECKLIST_FIELDS.filter(f => row[f]).length;
  return {
    id: row.id,
    facilityId: row.facilityId,
    facilityName: fac?.f.name ?? null,
    clubName: fac?.clubName ?? null,
    status: computeStatus(row),
    completedCount,
    totalCount: CHECKLIST_FIELDS.length,
    progressPct: Math.round((completedCount / CHECKLIST_FIELDS.length) * 100),
    coiSubmitted: row.coiSubmitted,
    coiVerified: row.coiVerified,
    contractSigned: row.contractSigned,
    taxStatusVerified: row.taxStatusVerified,
    articlesOfIncorporationVerified: row.articlesOfIncorporationVerified,
    driversLicenseRequirementsVerified: row.driversLicenseRequirementsVerified,
    vehicleInspectionComplete: row.vehicleInspectionComplete,
    telematicsAgreementSigned: row.telematicsAgreementSigned,
    telematicsDeviceInstalled: row.telematicsDeviceInstalled,
    backgroundChecksPassed: row.backgroundChecksPassed,
    notes: row.notes,
    assignedRepName: row.assignedRepName,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/onboarding", async (req, res) => {
  const where = scopeWhere(onboardingChecklistsTable.facilityId, req.scopeFacilityIds);
  const rows = where
    ? await db.select().from(onboardingChecklistsTable).where(where).orderBy(desc(onboardingChecklistsTable.updatedAt))
    : await db.select().from(onboardingChecklistsTable).orderBy(desc(onboardingChecklistsTable.updatedAt));
  const result = await Promise.all(rows.map(formatChecklist));
  res.json(result);
});

router.get("/onboarding/:facilityId", async (req, res) => {
  const facilityId = parseInt(req.params.facilityId as string);
  if (!inScope(req.scopeFacilityIds, facilityId)) {
    return res.status(403).json({ error: "Access denied" });
  }
  const [row] = await db.select().from(onboardingChecklistsTable).where(eq(onboardingChecklistsTable.facilityId, facilityId));
  if (!row) return res.status(404).json({ error: "Onboarding record not found" });
  return res.json(await formatChecklist(row));
});

router.patch("/onboarding/:facilityId", async (req, res) => {
  const facilityId = parseInt(req.params.facilityId as string);
  if (!inScope(req.scopeFacilityIds, facilityId)) {
    return res.status(403).json({ error: "Access denied" });
  }
  const [existing] = await db.select().from(onboardingChecklistsTable).where(eq(onboardingChecklistsTable.facilityId, facilityId));
  if (!existing) return res.status(404).json({ error: "Onboarding record not found" });

  const allowed = [...CHECKLIST_FIELDS, "notes", "assignedRepName"] as string[];
  const update: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  const allDone = CHECKLIST_FIELDS.every(f => update[f] !== undefined ? update[f] : existing[f]);
  if (allDone && !existing.completedAt) update.completedAt = new Date();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [updated] = await db.update(onboardingChecklistsTable).set(update as any).where(eq(onboardingChecklistsTable.facilityId, facilityId)).returning();
  return res.json(await formatChecklist(updated));
});

// Driver feedback feed — scoped to drivers in the user's facilities
router.get("/driver-feedback", async (req, res) => {
  const driverWhere = scopeWhere(driversTable.facilityId, req.scopeFacilityIds);
  const scopedDrivers = driverWhere
    ? await db.select({ id: driversTable.id }).from(driversTable).where(driverWhere)
    : await db.select({ id: driversTable.id }).from(driversTable);

  const driverIds = scopedDrivers.map(d => d.id);
  if (driverIds.length === 0) return res.json([]);

  // Optional single-driver filter
  const driverIdParam = req.query.driverId ? parseInt(req.query.driverId as string) : undefined;
  if (driverIdParam && !driverIds.includes(driverIdParam)) {
    return res.status(403).json({ error: "Access denied" });
  }

  const events = driverIdParam
    ? await db.select().from(driverFeedbackTable).where(eq(driverFeedbackTable.driverId, driverIdParam)).orderBy(desc(driverFeedbackTable.triggeredAt))
    : await db.select().from(driverFeedbackTable).orderBy(desc(driverFeedbackTable.triggeredAt)).limit(200);

  const filteredEvents = driverIdParam
    ? events
    : events.filter(e => driverIds.includes(e.driverId));

  const result = await Promise.all(filteredEvents.map(async e => {
    const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, e.driverId));
    return {
      id: e.id, driverId: e.driverId,
      driverName: driver ? `${driver.firstName} ${driver.lastName}` : null,
      eventType: e.eventType, message: e.message, severity: e.severity,
      acknowledged: e.acknowledged,
      triggeredAt: e.triggeredAt.toISOString(),
      acknowledgedAt: e.acknowledgedAt?.toISOString() ?? null,
    };
  }));
  return res.json(result);
});

router.patch("/driver-feedback/:feedbackId/acknowledge", async (req, res) => {
  const id = parseInt(req.params.feedbackId as string);
  const [feedback] = await db.select().from(driverFeedbackTable).where(eq(driverFeedbackTable.id, id));
  if (!feedback) return res.status(404).json({ error: "Feedback not found" });

  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, feedback.driverId));
  if (!driver || !inScope(req.scopeFacilityIds, driver.facilityId)) {
    return res.status(403).json({ error: "Access denied" });
  }

  const [updated] = await db.update(driverFeedbackTable)
    .set({ acknowledged: true, acknowledgedAt: new Date() })
    .where(eq(driverFeedbackTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Feedback not found" });
  return res.json({ id: updated.id, acknowledged: true });
});

// Driver leaderboard — scoped to the user's facilities
router.get("/leaderboard", async (req, res) => {
  const where = scopeWhere(driversTable.facilityId, req.scopeFacilityIds);
  const drivers = where
    ? await db.select({ d: driversTable, facilityName: facilitiesTable.name })
        .from(driversTable)
        .leftJoin(facilitiesTable, eq(driversTable.facilityId, facilitiesTable.id))
        .where(where)
        .orderBy(driversTable.riskScore)
    : await db.select({ d: driversTable, facilityName: facilitiesTable.name })
        .from(driversTable)
        .leftJoin(facilitiesTable, eq(driversTable.facilityId, facilitiesTable.id))
        .orderBy(driversTable.riskScore);

  const trainingRaw: { driverId: number; status: string; score: number | null }[] = [];

  res.json(drivers.map(({ d, facilityName }, idx) => {
    const completedModules = trainingRaw.filter((t: { driverId: number; status: string; score: number | null }) => t.driverId === d.id && t.status === "completed");
    const avgScore = completedModules.length > 0
      ? Math.round(completedModules.reduce((s: number, t: { score: number | null }) => s + (t.score ?? 0), 0) / completedModules.length)
      : null;
    const safetyScore = Math.max(0, Math.round(100 - d.riskScore));
    const badges: string[] = [];
    if (safetyScore >= 80) badges.push("Safe Driver");
    if (completedModules.length >= 3) badges.push("Trained");
    if (d.riskScore < 30) badges.push("Top Performer");
    if (d.totalMiles > 50000) badges.push("High Mileage");
    return {
      rank: idx + 1,
      driverId: d.id,
      driverName: `${d.firstName} ${d.lastName}`,
      facilityName,
      riskScore: d.riskScore,
      riskTier: d.riskTier,
      safetyScore,
      totalMiles: d.totalMiles,
      completedModules: completedModules.length,
      avgTrainingScore: avgScore,
      badges,
      status: d.status,
    };
  }));
});

export default router;
