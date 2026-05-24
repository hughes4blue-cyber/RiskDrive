import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { facilitiesTable } from "./facilities";

export const certificatesTable = pgTable("certificates", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id").notNull().references(() => facilitiesTable.id),
  policyNumber: text("policy_number").notNull(),
  insurer: text("insurer").notNull(),
  coverageType: text("coverage_type").notNull(),
  coverageAmount: real("coverage_amount").notNull(),
  effectiveDate: text("effective_date").notNull(),
  expirationDate: text("expiration_date").notNull(),
  status: text("status").notNull().default("current"),
  fileUrl: text("file_url"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertCertificateSchema = createInsertSchema(certificatesTable).omit({ id: true, uploadedAt: true });
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificatesTable.$inferSelect;
