import { Router } from "express";
import { db } from "@workspace/db";
import { onboardingChecklistsTable, driverFeedbackTable, facilitiesTable, clubsTable, driversTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

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
  const facilityId = req.query.facilityId ? parseInt(req.query.facilityId as string) : undefined;
  let rows = await db.select().from(onboardingChecklistsTable).orderBy(desc(onboardingChecklistsTable.updatedAt));
  if (facilityId) rows = rows.filter(r => r.facilityId === facilityId);
  const result = await Promise.all(rows.map(formatChecklist));
  res.json(result);
});

router.get("/onboarding/:facilityId", async (req, res) => {
  const facilityId = parseInt(req.params.facilityId);
  const [row] = await db.select().from(onboardingChecklistsTable).where(eq(onboardingChecklistsTable.facilityId, facilityId));
  if (!row) return res.status(404).json({ error: "Onboarding record not found" });
  res.json(await formatChecklist(row));
});

router.patch("/onboarding/:facilityId", async (req, res) => {
  const facilityId = parseInt(req.params.facilityId);
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
  res.json(await formatChecklist(updated));
});

// Driver feedback feed
router.get("/driver-feedback", async (req, res) => {
  const driverId = req.query.driverId ? parseInt(req.query.driverId as string) : undefined;

  if (driverId) {
    const events = await db.select().from(driverFeedbackTable).where(eq(driverFeedbackTable.driverId, driverId)).orderBy(desc(driverFeedbackTable.triggeredAt));
    const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, driverId));
    return res.json(events.map(e => ({
      id: e.id, driverId: e.driverId,
      driverName: driver ? `${driver.firstName} ${driver.lastName}` : null,
      eventType: e.eventType, message: e.message, severity: e.severity,
      acknowledged: e.acknowledged,
      triggeredAt: e.triggeredAt.toISOString(),
      acknowledgedAt: e.acknowledgedAt?.toISOString() ?? null,
    })));
  }

  const events = await db.select().from(driverFeedbackTable).orderBy(desc(driverFeedbackTable.triggeredAt)).limit(200);
  const result = await Promise.all(events.map(async e => {
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
  res.json(result);
});

router.patch("/driver-feedback/:feedbackId/acknowledge", async (req, res) => {
  const id = parseInt(req.params.feedbackId);
  const [updated] = await db.update(driverFeedbackTable)
    .set({ acknowledged: true, acknowledgedAt: new Date() })
    .where(eq(driverFeedbackTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Feedback not found" });
  res.json({ id: updated.id, acknowledged: true });
});

// Driver leaderboard
router.get("/leaderboard", async (_req, res) => {
  const drivers = await db.select({ d: driversTable, facilityName: facilitiesTable.name })
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
