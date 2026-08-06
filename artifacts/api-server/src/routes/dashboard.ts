import { Router } from "express";
import { db } from "@workspace/db";
import { clubsTable, facilitiesTable, driversTable, vehiclesTable, telematicsEventsTable, accidentsTable, certificatesTable } from "@workspace/db";
import { scopeWhere } from "../lib/scope";

const router = Router();

/**
 * Resolves the in-scope facilities based on scopeFacilityIds.
 * All dashboard aggregates are computed from this filtered set.
 */
async function getScopedFacilities(scopeFacilityIds: number[] | null | undefined) {
  const where = scopeWhere(facilitiesTable.id, scopeFacilityIds);
  return where
    ? await db.select().from(facilitiesTable).where(where)
    : await db.select().from(facilitiesTable);
}

router.get("/dashboard/overview", async (req, res) => {
  const facilities = await getScopedFacilities(req.scopeFacilityIds);
  const facilityIds = facilities.map(f => f.id);

  // Derive scoped clubs from the facilities in scope
  const clubIds = [...new Set(facilities.map(f => f.clubId))];

  // Only query sub-tables for facilities in scope
  const [drivers, vehicles, accidents, certs] = facilityIds.length > 0
    ? await Promise.all([
        db.select().from(driversTable).where(scopeWhere(driversTable.facilityId, facilityIds)!),
        db.select().from(vehiclesTable).where(scopeWhere(vehiclesTable.facilityId, facilityIds)!),
        db.select().from(accidentsTable).where(scopeWhere(accidentsTable.facilityId, facilityIds)!),
        db.select().from(certificatesTable).where(scopeWhere(certificatesTable.facilityId, facilityIds)!),
      ])
    : [[], [], [], []];

  const avgRisk = facilities.length > 0
    ? facilities.reduce((s, f) => s + (f.riskScore ?? 0), 0) / facilities.length
    : 0;

  const openAccidents = accidents.filter((a: any) => a.status !== "resolved").length;
  const certExpiring = certs.filter((c: any) => c.status === "expiring_soon" || c.status === "expired").length;
  const highRisk = facilities.filter(f => f.riskTier === "high" || f.riskTier === "critical").length;
  const totalMiles = vehicles.reduce((s: number, v: any) => s + (v.totalMiles ?? 0), 0);
  const premiumAtRisk = facilities.filter(f => f.riskTier !== "low")
    .reduce((s, f) => s + (f.riskScore ?? 0) * 120, 0);

  res.json({
    totalClubs: clubIds.length,
    totalFacilities: facilities.length,
    totalDrivers: drivers.length,
    totalVehicles: vehicles.length,
    avgPlatformRiskScore: Math.round(avgRisk * 10) / 10,
    openAccidents,
    certificatesExpiringSoon: certExpiring,
    premiumAtRisk: Math.round(premiumAtRisk),
    highRiskFacilities: highRisk,
    totalMilesMonitored: Math.round(totalMiles),
  });
});

router.get("/dashboard/risk-distribution", async (req, res) => {
  const facilities = await getScopedFacilities(req.scopeFacilityIds);
  const tiers = ["low", "moderate", "high", "critical"];
  const total = facilities.length || 1;
  const distribution = tiers.map(tier => {
    const count = facilities.filter(f => f.riskTier === tier).length;
    return { tier, count, percentage: Math.round((count / total) * 100) };
  });
  res.json(distribution);
});

router.get("/dashboard/recent-accidents", async (req, res) => {
  const facilities = await getScopedFacilities(req.scopeFacilityIds);
  const facilityIds = facilities.map(f => f.id);

  if (facilityIds.length === 0) {
    return res.json([]);
  }

  const [drivers, telematicsEvents] = await Promise.all([
    db.select().from(driversTable).where(scopeWhere(driversTable.facilityId, facilityIds)!),
    db.select({
      driverId: telematicsEventsTable.driverId,
      eventType: telematicsEventsTable.eventType,
      severity: telematicsEventsTable.severity,
    })
    .from(telematicsEventsTable)
    .where(scopeWhere(telematicsEventsTable.facilityId, facilityIds)!),
  ]);

  const sorted = [...drivers]
    .sort((a: any, b: any) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
    .slice(0, 8);

  const result = sorted.map((d: any) => {
    const fac = facilities.find((f) => f.id === d.facilityId);
    const driverEvents = telematicsEvents.filter((e) => e.driverId === d.id);
    const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const topEvent = [...driverEvents].sort((a, b) =>
      (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0)
    )[0];
    const topIssue = topEvent ? topEvent.eventType.replace(/_/g, " ") : "No recent events";
    return {
      driverId: d.id,
      driverName: `${d.firstName} ${d.lastName}`,
      facilityName: fac?.name ?? "Unknown",
      riskScore: d.riskScore,
      riskTier: d.riskTier,
      topIssue,
    };
  });

  return res.json(result);
});

router.get("/dashboard/telematics-activity", async (req, res) => {
  // Scope events through vehicles in the user's facilities
  const facilities = await getScopedFacilities(req.scopeFacilityIds);
  const facilityIds = facilities.map(f => f.id);

  let events: typeof telematicsEventsTable.$inferSelect[] = [];
  if (facilityIds.length > 0) {
    const vehicleWhere = scopeWhere(vehiclesTable.facilityId, facilityIds);
    const scopedVehicles = vehicleWhere
      ? await db.select({ id: vehiclesTable.id }).from(vehiclesTable).where(vehicleWhere)
      : await db.select({ id: vehiclesTable.id }).from(vehiclesTable);
    const vehicleIds = scopedVehicles.map(v => v.id);
    if (vehicleIds.length > 0) {
      const vWhere = scopeWhere(telematicsEventsTable.vehicleId, vehicleIds);
      events = vWhere
        ? await db.select().from(telematicsEventsTable).where(vWhere)
        : await db.select().from(telematicsEventsTable);
    }
  } else if (req.scopeFacilityIds === null) {
    // Unrestricted (super_admin / demo)
    events = await db.select().from(telematicsEventsTable);
  }

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split("T")[0];
    const dayEvents = events.filter(e =>
      e.timestamp?.toISOString().split("T")[0] === dateStr
    );
    return {
      date: dateStr,
      events: dayEvents.length,
      miles: Math.round(Math.random() * 2000 + 500),
      trips: Math.round(Math.random() * 80 + 20),
    };
  });

  res.json(last30Days);
});

export default router;
