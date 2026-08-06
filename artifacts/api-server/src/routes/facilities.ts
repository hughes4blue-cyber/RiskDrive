import { Router } from "express";
import { db } from "@workspace/db";
import { facilitiesTable, clubsTable, telematicsEventsTable, driversTable, vehiclesTable, accidentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { scopeWhere, inScope } from "../lib/scope";

const router = Router();

router.get("/facilities", async (req, res) => {
  // scopeFacilityIds scopes to specific facilities (shop_owner: own facility;
  // club: all in their club; super_admin/demo: null = all)
  const where = scopeWhere(facilitiesTable.id, req.scopeFacilityIds);
  const facilities = where
    ? await db.select({ facility: facilitiesTable, clubName: clubsTable.name })
        .from(facilitiesTable)
        .leftJoin(clubsTable, eq(facilitiesTable.clubId, clubsTable.id))
        .where(where)
    : await db.select({ facility: facilitiesTable, clubName: clubsTable.name })
        .from(facilitiesTable)
        .leftJoin(clubsTable, eq(facilitiesTable.clubId, clubsTable.id));

  res.json(facilities.map(({ facility: f, clubName }) => ({
    id: f.id,
    clubId: f.clubId,
    clubName,
    name: f.name,
    address: f.address,
    city: f.city,
    state: f.state,
    ownerName: f.ownerName,
    ownerEmail: f.ownerEmail,
    ownerPhone: f.ownerPhone,
    riskScore: f.riskScore,
    riskTier: f.riskTier,
    status: f.status,
    totalDrivers: f.totalDrivers,
    totalVehicles: f.totalVehicles,
    certStatus: f.certStatus,
    createdAt: f.createdAt?.toISOString() ?? new Date().toISOString(),
  })));
});

router.get("/facilities/:facilityId", async (req, res) => {
  const facilityId = parseInt(req.params.facilityId as string);
  if (!inScope(req.scopeFacilityIds, facilityId)) {
    return res.status(403).json({ error: "Access denied" });
  }
  const [row] = await db.select({
    facility: facilitiesTable,
    clubName: clubsTable.name,
  }).from(facilitiesTable)
    .leftJoin(clubsTable, eq(facilitiesTable.clubId, clubsTable.id))
    .where(eq(facilitiesTable.id, facilityId));

  if (!row) return res.status(404).json({ error: "Facility not found" });
  const { facility: f, clubName } = row;
  return res.json({
    id: f.id, clubId: f.clubId, clubName, name: f.name, address: f.address,
    city: f.city, state: f.state, ownerName: f.ownerName, ownerEmail: f.ownerEmail,
    ownerPhone: f.ownerPhone, riskScore: f.riskScore, riskTier: f.riskTier,
    status: f.status, totalDrivers: f.totalDrivers, totalVehicles: f.totalVehicles,
    certStatus: f.certStatus, createdAt: f.createdAt?.toISOString() ?? new Date().toISOString(),
  });
});

router.get("/facilities/:facilityId/summary", async (req, res) => {
  const facilityId = parseInt(req.params.facilityId as string);
  if (!inScope(req.scopeFacilityIds, facilityId)) {
    return res.status(403).json({ error: "Access denied" });
  }
  const [facility] = await db.select().from(facilitiesTable).where(eq(facilitiesTable.id, facilityId));
  if (!facility) return res.status(404).json({ error: "Facility not found" });

  const drivers = await db.select().from(driversTable).where(eq(driversTable.facilityId, facilityId));
  const vehicles = await db.select().from(vehiclesTable).where(eq(vehiclesTable.facilityId, facilityId));
  const vehicleIds = vehicles.map(v => v.id);

  const totalMiles = vehicles.reduce((s, v) => s + (v.totalMiles ?? 0), 0);
  const activeVehicles = vehicles.filter(v => v.status === "active").length;

  let hardBraking = 0, harshAccel = 0, speeding = 0;
  if (vehicleIds.length > 0) {
    const events = await db.select().from(telematicsEventsTable);
    const facilityEvents = events.filter(e => vehicleIds.includes(e.vehicleId));
    hardBraking = facilityEvents.filter(e => e.eventType === "hard_braking").length;
    harshAccel = facilityEvents.filter(e => e.eventType === "harsh_acceleration").length;
    speeding = facilityEvents.filter(e => e.eventType === "speeding").length;
  }

  const accidents = await db.select().from(accidentsTable).where(eq(accidentsTable.facilityId, facilityId));
  const openAccidents = accidents.filter(a => a.status !== "resolved").length;
  const premiumEstimate = facility.riskScore * 120;

  return res.json({
    facilityId,
    avgRiskScore: facility.riskScore,
    riskTier: facility.riskTier,
    totalDrivers: drivers.length,
    totalVehicles: vehicles.length,
    activeVehicles,
    totalMiles,
    hardBrakingEvents: hardBraking,
    harshAccelerationEvents: harshAccel,
    speedingEvents: speeding,
    openAccidents,
    premiumEstimate: Math.round(premiumEstimate),
  });
});

export default router;
