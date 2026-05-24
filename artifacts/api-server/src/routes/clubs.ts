import { Router } from "express";
import { db } from "@workspace/db";
import { clubsTable, facilitiesTable, driversTable, vehiclesTable, accidentsTable, certificatesTable } from "@workspace/db";
import { eq, avg, count, sql } from "drizzle-orm";

const router = Router();

router.get("/clubs", async (req, res) => {
  const clubs = await db.select().from(clubsTable);
  res.json(clubs.map(c => ({
    id: c.id,
    name: c.name,
    state: c.state,
    region: c.region,
    totalFacilities: c.totalFacilities,
    avgRiskScore: c.avgRiskScore,
    status: c.status,
    contactName: c.contactName,
    contactEmail: c.contactEmail,
    createdAt: c.createdAt?.toISOString() ?? new Date().toISOString(),
  })));
});

router.get("/clubs/:clubId", async (req, res) => {
  const clubId = parseInt(req.params.clubId);
  const [club] = await db.select().from(clubsTable).where(eq(clubsTable.id, clubId));
  if (!club) return res.status(404).json({ error: "Club not found" });
  res.json({
    ...club,
    createdAt: club.createdAt?.toISOString() ?? new Date().toISOString(),
  });
});

router.get("/clubs/:clubId/summary", async (req, res) => {
  const clubId = parseInt(req.params.clubId);
  const facilities = await db.select().from(facilitiesTable).where(eq(facilitiesTable.clubId, clubId));
  const facilityIds = facilities.map(f => f.id);

  let totalDrivers = 0;
  let totalVehicles = 0;
  let highRiskCount = 0;
  for (const f of facilities) {
    totalDrivers += f.totalDrivers;
    totalVehicles += f.totalVehicles;
    if (f.riskTier === "high" || f.riskTier === "critical") highRiskCount++;
  }

  const avgScore = facilities.length > 0
    ? facilities.reduce((s, f) => s + (f.riskScore ?? 0), 0) / facilities.length
    : 0;

  let openAccidents = 0;
  let certsExpiring = 0;
  if (facilityIds.length > 0) {
    const accidents = await db.select().from(accidentsTable);
    openAccidents = accidents.filter(a => facilityIds.includes(a.facilityId) && a.status !== "resolved").length;
    const certs = await db.select().from(certificatesTable);
    certsExpiring = certs.filter(c => facilityIds.includes(c.facilityId) && (c.status === "expiring_soon" || c.status === "expired")).length;
  }

  res.json({
    clubId,
    totalFacilities: facilities.length,
    totalDrivers,
    totalVehicles,
    avgRiskScore: Math.round(avgScore * 10) / 10,
    highRiskCount,
    openAccidents,
    certificatesExpiringSoon: certsExpiring,
  });
});

export default router;
