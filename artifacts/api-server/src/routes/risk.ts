import { Router } from "express";
import { db } from "@workspace/db";
import { driversTable, facilitiesTable, vehiclesTable, telematicsEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function tierFromScore(score: number): string {
  if (score < 30) return "low";
  if (score < 55) return "moderate";
  if (score < 75) return "high";
  return "critical";
}

function buildFactors(events: { eventType: string }[]): Array<{ name: string; impact: string; value: string; description: string }> {
  const hb = events.filter(e => e.eventType === "hard_braking").length;
  const ha = events.filter(e => e.eventType === "harsh_acceleration").length;
  const sp = events.filter(e => e.eventType === "speeding").length;
  const ph = events.filter(e => e.eventType === "phone_usage").length;
  return [
    { name: "Hard Braking Events", impact: hb > 10 ? "high" : hb > 4 ? "medium" : "low", value: `${hb} events`, description: "Sudden braking increases accident risk" },
    { name: "Harsh Acceleration", impact: ha > 10 ? "high" : ha > 4 ? "medium" : "low", value: `${ha} events`, description: "Aggressive acceleration increases fuel cost and wear" },
    { name: "Speeding Violations", impact: sp > 5 ? "high" : sp > 2 ? "medium" : "low", value: `${sp} incidents`, description: "Speeding is a primary accident cause" },
    { name: "Phone Usage While Driving", impact: ph > 3 ? "high" : ph > 0 ? "medium" : "low", value: `${ph} incidents`, description: "Distracted driving significantly raises risk" },
  ];
}

router.get("/risk/facility/:facilityId", async (req, res) => {
  const facilityId = parseInt(req.params.facilityId);
  const [facility] = await db.select().from(facilitiesTable).where(eq(facilitiesTable.id, facilityId));
  if (!facility) return res.status(404).json({ error: "Facility not found" });

  const vehicles = await db.select().from(vehiclesTable).where(eq(vehiclesTable.facilityId, facilityId));
  const events = await db.select().from(telematicsEventsTable);
  const facilityEvents = events.filter(e => vehicles.some(v => v.id === e.vehicleId));

  res.json({
    entityId: facilityId,
    entityType: "facility",
    score: facility.riskScore,
    tier: facility.riskTier,
    change30d: (Math.random() * 10 - 5),
    factors: buildFactors(facilityEvents),
    calculatedAt: new Date().toISOString(),
  });
});

router.get("/risk/driver/:driverId", async (req, res) => {
  const driverId = parseInt(req.params.driverId);
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, driverId));
  if (!driver) return res.status(404).json({ error: "Driver not found" });

  const events = await db.select().from(telematicsEventsTable).where(eq(telematicsEventsTable.driverId, driverId));

  res.json({
    entityId: driverId,
    entityType: "driver",
    score: driver.riskScore,
    tier: driver.riskTier,
    change30d: (Math.random() * 8 - 4),
    factors: buildFactors(events),
    calculatedAt: new Date().toISOString(),
  });
});

router.get("/risk/vehicle/:vehicleId", async (req, res) => {
  const vehicleId = parseInt(req.params.vehicleId);
  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, vehicleId));
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

  const events = await db.select().from(telematicsEventsTable).where(eq(telematicsEventsTable.vehicleId, vehicleId));

  res.json({
    entityId: vehicleId,
    entityType: "vehicle",
    score: vehicle.riskScore,
    tier: vehicle.riskTier,
    change30d: (Math.random() * 6 - 3),
    factors: buildFactors(events),
    calculatedAt: new Date().toISOString(),
  });
});

router.get("/risk/suggestions/:driverId", async (req, res) => {
  const driverId = parseInt(req.params.driverId);
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, driverId));
  if (!driver) return res.status(404).json({ error: "Driver not found" });

  const events = await db.select().from(telematicsEventsTable).where(eq(telematicsEventsTable.driverId, driverId));

  const suggestions = [];
  let id = 1;

  if (events.filter(e => e.eventType === "speeding").length > 2) {
    suggestions.push({
      id: id++, driverId, category: "speeding", priority: "high",
      title: "Speed Management Training Recommended",
      description: "Driver has exceeded posted speed limits multiple times. Recommend enrolling in defensive driving course and setting vehicle speed alerts.",
      expectedImpact: "Reduce risk score by 8-12 points within 30 days",
    });
  }
  if (events.filter(e => e.eventType === "hard_braking").length > 4) {
    suggestions.push({
      id: id++, driverId, category: "braking", priority: "medium",
      title: "Following Distance Coaching",
      description: "Frequent hard braking indicates insufficient following distance. Driver should maintain 3-second gap and scan ahead for traffic changes.",
      expectedImpact: "Reduce hard braking events by 40% and improve risk score by 5-8 points",
    });
  }
  if (events.filter(e => e.eventType === "phone_usage").length > 0) {
    suggestions.push({
      id: id++, driverId, category: "phone_usage", priority: "urgent",
      title: "Distracted Driving Policy Enforcement",
      description: "Phone use detected while vehicle in motion. Immediate counseling required. Consider enabling hands-free only mode on company devices.",
      expectedImpact: "Critical safety improvement — reduces accident probability by 23%",
    });
  }
  if (events.filter(e => e.eventType === "harsh_acceleration").length > 3) {
    suggestions.push({
      id: id++, driverId, category: "acceleration", priority: "low",
      title: "Smooth Acceleration Techniques",
      description: "Gradual acceleration reduces fuel consumption and mechanical wear. Recommend eco-driving module training.",
      expectedImpact: "Improve fuel efficiency by 12% and reduce risk score by 3-5 points",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: id++, driverId, category: "route_planning", priority: "low",
      title: "Continue Current Performance",
      description: "Driver is performing within acceptable parameters. Recommend monthly check-ins and quarterly refresher training.",
      expectedImpact: "Maintain low risk score and optimize premium savings",
    });
  }

  res.json(suggestions);
});

export default router;
