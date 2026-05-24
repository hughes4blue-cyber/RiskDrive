import { Router } from "express";
import { db } from "@workspace/db";
import { driversTable, facilitiesTable, telematicsEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/drivers", async (req, res) => {
  const facilityId = req.query.facilityId ? parseInt(req.query.facilityId as string) : undefined;
  let rows;
  if (facilityId) {
    rows = await db.select({ driver: driversTable, facilityName: facilitiesTable.name })
      .from(driversTable)
      .leftJoin(facilitiesTable, eq(driversTable.facilityId, facilitiesTable.id))
      .where(eq(driversTable.facilityId, facilityId));
  } else {
    rows = await db.select({ driver: driversTable, facilityName: facilitiesTable.name })
      .from(driversTable)
      .leftJoin(facilitiesTable, eq(driversTable.facilityId, facilitiesTable.id));
  }
  res.json(rows.map(({ driver: d, facilityName }) => ({
    id: d.id, facilityId: d.facilityId, facilityName,
    firstName: d.firstName, lastName: d.lastName, licenseNumber: d.licenseNumber,
    phone: d.phone, status: d.status, riskScore: d.riskScore, riskTier: d.riskTier,
    totalMiles: d.totalMiles, totalTrips: d.totalTrips, hireDate: d.hireDate,
    createdAt: d.createdAt?.toISOString() ?? new Date().toISOString(),
  })));
});

router.get("/drivers/:driverId", async (req, res) => {
  const driverId = parseInt(req.params.driverId);
  const [row] = await db.select({ driver: driversTable, facilityName: facilitiesTable.name })
    .from(driversTable)
    .leftJoin(facilitiesTable, eq(driversTable.facilityId, facilitiesTable.id))
    .where(eq(driversTable.id, driverId));
  if (!row) return res.status(404).json({ error: "Driver not found" });
  const { driver: d, facilityName } = row;
  res.json({
    id: d.id, facilityId: d.facilityId, facilityName,
    firstName: d.firstName, lastName: d.lastName, licenseNumber: d.licenseNumber,
    phone: d.phone, status: d.status, riskScore: d.riskScore, riskTier: d.riskTier,
    totalMiles: d.totalMiles, totalTrips: d.totalTrips, hireDate: d.hireDate,
    createdAt: d.createdAt?.toISOString() ?? new Date().toISOString(),
  });
});

router.get("/drivers/:driverId/behavior", async (req, res) => {
  const driverId = parseInt(req.params.driverId);
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, driverId));
  if (!driver) return res.status(404).json({ error: "Driver not found" });

  const events = await db.select().from(telematicsEventsTable).where(eq(telematicsEventsTable.driverId, driverId));

  const hardBrakingCount = events.filter(e => e.eventType === "hard_braking").length;
  const harshAccelerationCount = events.filter(e => e.eventType === "harsh_acceleration").length;
  const speedingCount = events.filter(e => e.eventType === "speeding").length;
  const phoneUsageCount = events.filter(e => e.eventType === "phone_usage").length;
  const nightDrivingHours = events.length * 0.4;
  const speeds = events.map(e => e.speed).filter(s => s > 0);
  const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 55;
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 70;
  const trend = driver.riskScore < 40 ? "improving" : driver.riskScore < 70 ? "stable" : "worsening";

  res.json({
    driverId,
    riskScore: driver.riskScore,
    hardBrakingCount,
    harshAccelerationCount,
    speedingCount,
    phoneUsageCount,
    nightDrivingHours: Math.round(nightDrivingHours),
    avgSpeed: Math.round(avgSpeed),
    maxSpeed: Math.round(maxSpeed),
    totalMiles: driver.totalMiles,
    trend,
  });
});

export default router;
