import { Router } from "express";
import { db } from "@workspace/db";
import { accidentsTable, vehiclesTable, driversTable, facilitiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ReportAccidentBody, InitiateClaimBody } from "@workspace/api-zod";

const router = Router();

async function formatAccident(a: typeof accidentsTable.$inferSelect) {
  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, a.vehicleId));
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, a.driverId));
  const [facility] = await db.select().from(facilitiesTable).where(eq(facilitiesTable.id, a.facilityId));
  return {
    id: a.id,
    vehicleId: a.vehicleId,
    vehiclePlate: vehicle?.licensePlate ?? null,
    driverId: a.driverId,
    driverName: driver ? `${driver.firstName} ${driver.lastName}` : null,
    facilityId: a.facilityId,
    facilityName: facility?.name ?? null,
    latitude: a.latitude,
    longitude: a.longitude,
    severity: a.severity,
    status: a.status,
    description: a.description,
    claimNumber: a.claimNumber,
    alertedAt: a.alertedAt?.toISOString() ?? new Date().toISOString(),
    resolvedAt: a.resolvedAt?.toISOString() ?? null,
  };
}

router.get("/accidents", async (req, res) => {
  const facilityId = req.query.facilityId ? parseInt(req.query.facilityId as string) : undefined;
  const status = req.query.status as string | undefined;

  let accidents = await db.select().from(accidentsTable);
  if (facilityId) accidents = accidents.filter(a => a.facilityId === facilityId);
  if (status) accidents = accidents.filter(a => a.status === status);

  const result = await Promise.all(accidents.map(formatAccident));
  res.json(result);
});

router.post("/accidents", async (req, res) => {
  const parsed = ReportAccidentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const data = parsed.data;

  const [accident] = await db.insert(accidentsTable).values({
    vehicleId: data.vehicleId,
    driverId: data.driverId,
    facilityId: data.facilityId,
    latitude: data.latitude,
    longitude: data.longitude,
    severity: data.severity,
    status: "alerted",
    description: data.description ?? null,
  }).returning();

  const result = await formatAccident(accident);
  res.status(201).json(result);
});

router.get("/accidents/:accidentId", async (req, res) => {
  const accidentId = parseInt(req.params.accidentId);
  const [accident] = await db.select().from(accidentsTable).where(eq(accidentsTable.id, accidentId));
  if (!accident) return res.status(404).json({ error: "Accident not found" });
  res.json(await formatAccident(accident));
});

router.post("/accidents/:accidentId/initiate-claim", async (req, res) => {
  const accidentId = parseInt(req.params.accidentId);
  const parsed = InitiateClaimBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const [updated] = await db.update(accidentsTable)
    .set({ status: "claim_initiated", claimNumber: parsed.data.claimNumber })
    .where(eq(accidentsTable.id, accidentId))
    .returning();

  if (!updated) return res.status(404).json({ error: "Accident not found" });
  res.json(await formatAccident(updated));
});

export default router;
