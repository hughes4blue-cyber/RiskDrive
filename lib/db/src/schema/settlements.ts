import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { facilitiesTable } from "./facilities";

export const settlementRecordsTable = pgTable("settlement_records", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id").notNull().references(() => facilitiesTable.id),
  periodMonth: text("period_month").notNull(),
  grossSettlement: real("gross_settlement").notNull(),
  insurancePremiumDeduction: real("insurance_premium_deduction").notNull(),
  premiumFinanceInstallment: real("premium_finance_installment").notNull().default(0),
  otherDeductions: real("other_deductions").notNull().default(0),
  netPayout: real("net_payout").notNull(),
  status: text("status").notNull().default("pending"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSettlementRecordSchema = createInsertSchema(settlementRecordsTable).omit({ id: true, createdAt: true });
export type InsertSettlementRecord = z.infer<typeof insertSettlementRecordSchema>;
export type SettlementRecord = typeof settlementRecordsTable.$inferSelect;
