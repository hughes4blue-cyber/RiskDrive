import { Router } from "express";
import { db } from "@workspace/db";
import { settlementRecordsTable, facilitiesTable, clubsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { scopeWhere } from "../lib/scope";

const router = Router();

async function formatRecord(r: typeof settlementRecordsTable.$inferSelect) {
  const [fac] = await db.select({ f: facilitiesTable, clubName: clubsTable.name })
    .from(facilitiesTable).leftJoin(clubsTable, eq(facilitiesTable.clubId, clubsTable.id))
    .where(eq(facilitiesTable.id, r.facilityId));
  return {
    id: r.id,
    facilityId: r.facilityId,
    facilityName: fac?.f.name ?? null,
    clubName: fac?.clubName ?? null,
    periodMonth: r.periodMonth,
    grossSettlement: r.grossSettlement,
    insurancePremiumDeduction: r.insurancePremiumDeduction,
    premiumFinanceInstallment: r.premiumFinanceInstallment,
    otherDeductions: r.otherDeductions,
    netPayout: r.netPayout,
    status: r.status,
    paidAt: r.paidAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/settlements", async (req, res) => {
  const periodMonth = req.query.periodMonth as string | undefined;
  const where = scopeWhere(settlementRecordsTable.facilityId, req.scopeFacilityIds);
  let rows = where
    ? await db.select().from(settlementRecordsTable).where(where).orderBy(desc(settlementRecordsTable.periodMonth))
    : await db.select().from(settlementRecordsTable).orderBy(desc(settlementRecordsTable.periodMonth));
  if (periodMonth) rows = rows.filter(r => r.periodMonth === periodMonth);
  const result = await Promise.all(rows.map(formatRecord));
  res.json(result);
});

router.get("/settlements/summary", async (req, res) => {
  const where = scopeWhere(settlementRecordsTable.facilityId, req.scopeFacilityIds);
  const rows = where
    ? await db.select().from(settlementRecordsTable).where(where)
    : await db.select().from(settlementRecordsTable);
  const totalGross = rows.reduce((s, r) => s + r.grossSettlement, 0);
  const totalPremium = rows.reduce((s, r) => s + r.insurancePremiumDeduction, 0);
  const totalNet = rows.reduce((s, r) => s + r.netPayout, 0);
  const pending = rows.filter(r => r.status === "pending").length;
  const processed = rows.filter(r => r.status === "processed").length;
  res.json({ totalGross, totalPremium, totalNet, pending, processed, totalRecords: rows.length });
});

export default router;
