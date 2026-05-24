import { Router } from "express";
import { db } from "@workspace/db";
import { clubsTable, facilitiesTable, driversTable, vehiclesTable, telematicsEventsTable, accidentsTable, certificatesTable } from "@workspace/db";

const router = Router();

router.get("/dashboard/overview", async (req, res) => {
  const clubs = await db.select().from(clubsTable);
  const facilities = await db.select().from(facilitiesTable);
  const drivers = await db.select().from(driversTable);
  const vehicles = await db.select().from(vehiclesTable);
  const accidents = await db.select().from(accidentsTable);
  const certs = await db.select().from(certificatesTable);

  const avgRisk = facilities.length > 0
    ? facilities.reduce((s, f) => s + (f.riskScore ?? 0), 0) / facilities.length
    : 0;

  const openAccidents = accidents.filter(a => a.status !== "resolved").length;
  const certExpiring = certs.filter(c => c.status === "expiring_soon" || c.status === "expired").length;
  const highRisk = facilities.filter(f => f.riskTier === "high" || f.riskTier === "critical").length;
  const totalMiles = vehicles.reduce((s, v) => s + (v.totalMiles ?? 0), 0);
  const premiumAtRisk = facilities.filter(f => f.riskTier !== "low")
    .reduce((s, f) => s + (f.riskScore ?? 0) * 120, 0);

  res.json({
    totalClubs: clubs.length,
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
  const facilities = await db.select().from(facilitiesTable);
  const tiers = ["low", "moderate", "high", "critical"];
  const total = facilities.length || 1;
  const distribution = tiers.map(tier => {
    const count = facilities.filter(f => f.riskTier === tier).length;
    return { tier, count, percentage: Math.round((count / total) * 100) };
  });
  res.json(distribution);
});

router.get("/dashboard/recent-accidents", async (req, res) => {
  const accidents = await db.select().from(accidentsTable);
  const vehicles = await db.select().from(vehiclesTable);
  const drivers = await db.select().from(driversTable);
  const facilities = await db.select().from(facilitiesTable);

  const sorted = [...accidents]
    .sort((a, b) => new Date(b.alertedAt ?? 0).getTime() - new Date(a.alertedAt ?? 0).getTime())
    .slice(0, 10);

  const result = sorted.map(a => {
    const veh = vehicles.find(v => v.id === a.vehicleId);
    const drv = drivers.find(d => d.id === a.driverId);
    const fac = facilities.find(f => f.id === a.facilityId);
    return {
      id: a.id, vehicleId: a.vehicleId, vehiclePlate: veh?.licensePlate ?? null,
      driverId: a.driverId, driverName: drv ? `${drv.firstName} ${drv.lastName}` : null,
      facilityId: a.facilityId, facilityName: fac?.name ?? null,
      latitude: a.latitude, longitude: a.longitude,
      severity: a.severity, status: a.status, description: a.description,
      claimNumber: a.claimNumber,
      alertedAt: a.alertedAt?.toISOString() ?? new Date().toISOString(),
      resolvedAt: a.resolvedAt?.toISOString() ?? null,
    };
  });
  res.json(result);
});

router.get("/dashboard/top-risk-drivers", async (req, res) => {
  const drivers = await db.select().from(driversTable);
  const facilities = await db.select().from(facilitiesTable);
  const events = await db.select().from(telematicsEventsTable);

  const sorted = [...drivers]
    .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
    .slice(0, 8);

  const result = sorted.map(d => {
    const fac = facilities.find(f => f.id === d.facilityId);
    const driverEvents = events.filter(e => e.driverId === d.id);
    const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const topEvent = driverEvents.sort((a, b) =>
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

  res.json(result);
});

router.get("/dashboard/telematics-activity", async (req, res) => {
  const events = await db.select().from(telematicsEventsTable);

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
