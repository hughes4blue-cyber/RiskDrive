import { pgTable, serial, text, real, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { facilitiesTable } from "./facilities";
import { accidentsTable } from "./accidents";
import { driversTable } from "./drivers";

export const claimsTable = pgTable("claims", {
  id: serial("id").primaryKey(),
  accidentId: integer("accident_id").references(() => accidentsTable.id),
  facilityId: integer("facility_id").notNull().references(() => facilitiesTable.id),
  driverId: integer("driver_id").references(() => driversTable.id),
  claimNumber: text("claim_number").notNull(),
  tpaName: text("tpa_name").notNull().default("Alliant TPA Services"),
  status: text("status").notNull().default("fnol_received"),
  severity: text("severity").notNull().default("moderate"),
  description: text("description"),
  exonerationStatus: text("exoneration_status"),
  settlementAmount: real("settlement_amount"),
  reserveAmount: real("reserve_amount"),
  litigationNotes: text("litigation_notes"),
  isLitigated: boolean("is_litigated").notNull().default(false),
  adjusterName: text("adjuster_name"),
  fnolReceivedAt: timestamp("fnol_received_at").notNull().defaultNow(),
  assignedAt: timestamp("assigned_at"),
  investigationStartedAt: timestamp("investigation_started_at"),
  adjudicatedAt: timestamp("adjudicated_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertClaimSchema = createInsertSchema(claimsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claimsTable.$inferSelect;
