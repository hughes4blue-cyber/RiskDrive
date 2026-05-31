import { Router } from "express";
import { db } from "@workspace/db";
import { trainingModulesTable, driverTrainingTable, driversTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/training/modules", async (_req, res) => {
  const modules = await db.select().from(trainingModulesTable).orderBy(trainingModulesTable.category);
  res.json(modules.map(m => ({
    id: m.id,
    title: m.title,
    description: m.description,
    category: m.category,
    durationMinutes: m.durationMinutes,
    behaviorTrigger: m.behaviorTrigger,
    videoUrl: m.videoUrl,
  })));
});

router.get("/training/driver/:driverId", async (req, res) => {
  const driverId = parseInt(req.params.driverId as string);
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, driverId));
  if (!driver) return res.status(404).json({ error: "Driver not found" });

  const assignments = await db
    .select({ assignment: driverTrainingTable, module: trainingModulesTable })
    .from(driverTrainingTable)
    .leftJoin(trainingModulesTable, eq(driverTrainingTable.moduleId, trainingModulesTable.id))
    .where(eq(driverTrainingTable.driverId, driverId))
    .orderBy(desc(driverTrainingTable.assignedAt));

  return res.json(assignments.map(({ assignment: a, module: m }) => ({
    id: a.id,
    driverId: a.driverId,
    moduleId: a.moduleId,
    moduleTitle: m?.title ?? null,
    moduleCategory: m?.category ?? null,
    moduleDurationMinutes: m?.durationMinutes ?? null,
    status: a.status,
    score: a.score,
    assignedAt: a.assignedAt.toISOString(),
    completedAt: a.completedAt?.toISOString() ?? null,
  })));
});

router.post("/training/driver/:driverId/assign", async (req, res) => {
  const driverId = parseInt(req.params.driverId as string);
  const { moduleId } = req.body as { moduleId: number };
  if (!moduleId) return res.status(400).json({ error: "moduleId required" });

  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, driverId));
  if (!driver) return res.status(404).json({ error: "Driver not found" });

  const [mod] = await db.select().from(trainingModulesTable).where(eq(trainingModulesTable.id, moduleId));
  if (!mod) return res.status(404).json({ error: "Training module not found" });

  const [assignment] = await db.insert(driverTrainingTable).values({
    driverId,
    moduleId,
    status: "assigned",
  }).returning();

  return res.status(201).json({
    id: assignment.id,
    driverId: assignment.driverId,
    moduleId: assignment.moduleId,
    moduleTitle: mod.title,
    moduleCategory: mod.category,
    moduleDurationMinutes: mod.durationMinutes,
    status: assignment.status,
    score: assignment.score,
    assignedAt: assignment.assignedAt.toISOString(),
    completedAt: null,
  });
});

router.patch("/training/assignment/:assignmentId/complete", async (req, res) => {
  const assignmentId = parseInt(req.params.assignmentId as string);
  const { score } = req.body as { score?: number };

  const [updated] = await db.update(driverTrainingTable)
    .set({ status: "completed", score: score ?? null, completedAt: new Date() })
    .where(eq(driverTrainingTable.id, assignmentId))
    .returning();

  if (!updated) return res.status(404).json({ error: "Assignment not found" });

  const [mod] = await db.select().from(trainingModulesTable).where(eq(trainingModulesTable.id, updated.moduleId));
  return res.json({
    id: updated.id,
    driverId: updated.driverId,
    moduleId: updated.moduleId,
    moduleTitle: mod?.title ?? null,
    moduleCategory: mod?.category ?? null,
    moduleDurationMinutes: mod?.durationMinutes ?? null,
    status: updated.status,
    score: updated.score,
    assignedAt: updated.assignedAt.toISOString(),
    completedAt: updated.completedAt?.toISOString() ?? null,
  });
});

router.get("/training/assignments", async (req, res) => {
  const facilityId = req.query.facilityId ? parseInt(req.query.facilityId as string) : undefined;

  let driverIds: number[] = [];
  if (facilityId) {
    const facilityDrivers = await db.select({ id: driversTable.id })
      .from(driversTable)
      .where(eq(driversTable.facilityId, facilityId));
    driverIds = facilityDrivers.map(d => d.id);
    if (driverIds.length === 0) return res.json([]);
  }

  const allAssignments = await db
    .select({ assignment: driverTrainingTable, module: trainingModulesTable, driver: driversTable })
    .from(driverTrainingTable)
    .leftJoin(trainingModulesTable, eq(driverTrainingTable.moduleId, trainingModulesTable.id))
    .leftJoin(driversTable, eq(driverTrainingTable.driverId, driversTable.id))
    .orderBy(desc(driverTrainingTable.assignedAt));

  const filtered = facilityId
    ? allAssignments.filter(r => driverIds.includes(r.assignment.driverId))
    : allAssignments;

  return res.json(filtered.map(({ assignment: a, module: m, driver: d }) => ({
    id: a.id,
    driverId: a.driverId,
    driverName: d ? `${d.firstName} ${d.lastName}` : null,
    moduleId: a.moduleId,
    moduleTitle: m?.title ?? null,
    moduleCategory: m?.category ?? null,
    moduleDurationMinutes: m?.durationMinutes ?? null,
    status: a.status,
    score: a.score,
    assignedAt: a.assignedAt.toISOString(),
    completedAt: a.completedAt?.toISOString() ?? null,
  })));
});

export default router;
