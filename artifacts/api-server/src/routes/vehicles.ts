import { Router } from "express";
import { db } from "@workspace/db";
import { vehiclesTable, facilitiesTable, driversTable, telematicsEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { auditAccess } from "../middlewares/audit";
import { scopeWhere, inScope } from "../lib/scope";

const router = Router();

router.get("/vehicles", auditAccess("vehicle"), async (req, res) => {
  const where = scopeWhere(vehiclesTable.facilityId, req.scopeFacilityIds);
  const rows = where
    ? await db.select({
        vehicle: vehiclesTable,
        facilityName: facilitiesTable.name,
        driverFirst: driversTable.firstName,
        driverLast: driversTable.lastName,
      }).from(vehiclesTable)
        .leftJoin(facilitiesTable, eq(vehiclesTable.facilityId, facilitiesTable.id))
        .leftJoin(driversTable, eq(vehiclesTable.assignedDriverId, driversTable.id))
        .where(where)
    : await db.select({
        vehicle: vehiclesTable,
        facilityName: facilitiesTable.name,
        driverFirst: driversTable.firstName,
        driverLast: driversTable.lastName,
      }).from(vehiclesTable)
        .leftJoin(facilitiesTable, eq(vehiclesTable.facilityId, facilitiesTable.id))
        .leftJoin(driversTable, eq(vehiclesTable.assignedDriverId, driversTable.id));

  res.json(rows.map(({ vehicle: v, facilityName, driverFirst, driverLast }) => ({
    id: v.id, facilityId: v.facilityId, facilityName, make: v.make, model: v.model,
    year: v.year, licensePlate: v.licensePlate, vin: v.vin, type: v.type,
    status: v.status, riskScore: v.riskScore, riskTier: v.riskTier,
    totalMiles: v.totalMiles, assignedDriverId: v.assignedDriverId,
    assignedDriverName: driverFirst ? `${driverFirst} ${driverLast}` : null,
    telematicsDeviceId: v.telematicsDeviceId,
    createdAt: v.createdAt?.toISOString() ?? new Date().toISOString(),
  })));
});

router.get("/vehicles/:vehicleId", auditAccess("vehicle", (r) => r.params.vehicleId), async (req, res) => {
  const vehicleId = parseInt(String(req.params.vehicleId));
  const [row] = await db.select({
    vehicle: vehiclesTable,
    facilityName: facilitiesTable.name,
    driverFirst: driversTable.firstName,
    driverLast: driversTable.lastName,
  }).from(vehiclesTable)
    .leftJoin(facilitiesTable, eq(vehiclesTable.facilityId, facilitiesTable.id))
    .leftJoin(driversTable, eq(vehiclesTable.assignedDriverId, driversTable.id))
    .where(eq(vehiclesTable.id, vehicleId));

  if (!row) return res.status(404).json({ error: "Vehicle not found" });

  if (!inScope(req.scopeFacilityIds, row.vehicle.facilityId)) {
    return res.status(403).json({ error: "Access denied" });
  }

  const { vehicle: v, facilityName, driverFirst, driverLast } = row;
  return res.json({
    id: v.id, facilityId: v.facilityId, facilityName, make: v.make, model: v.model,
    year: v.year, licensePlate: v.licensePlate, vin: v.vin, type: v.type,
    status: v.status, riskScore: v.riskScore, riskTier: v.riskTier,
    totalMiles: v.totalMiles, assignedDriverId: v.assignedDriverId,
    assignedDriverName: driverFirst ? `${driverFirst} ${driverLast}` : null,
    telematicsDeviceId: v.telematicsDeviceId,
    createdAt: v.createdAt?.toISOString() ?? new Date().toISOString(),
  });
});

router.get("/vehicles/:vehicleId/telematics", async (req, res) => {
  const vehicleId = parseInt(req.params.vehicleId);
  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, vehicleId));
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
  if (!inScope(req.scopeFacilityIds, vehicle.facilityId)) {
    return res.status(403).json({ error: "Access denied" });
  }
  const events = await db.select().from(telematicsEventsTable)
    .where(eq(telematicsEventsTable.vehicleId, vehicleId));
  return res.json(events.map(e => ({
    id: e.id, vehicleId: e.vehicleId, driverId: e.driverId,
    eventType: e.eventType, severity: e.severity,
    latitude: e.latitude, longitude: e.longitude,
    speed: e.speed, notes: e.notes,
    timestamp: e.timestamp?.toISOString() ?? new Date().toISOString(),
  })));
});

export default router;
