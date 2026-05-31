import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { facilitiesTable } from "./facilities";
import { certificatesTable } from "./certificates";

export const insuranceDocumentsTable = pgTable("insurance_documents", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id").notNull().references(() => facilitiesTable.id),
  documentType: text("document_type").notNull(),
  fileName: text("file_name").notNull(),
  fileKey: text("file_key").notNull(),
  contentType: text("content_type").notNull(),
  status: text("status").notNull().default("uploaded"),
  extractedData: jsonb("extracted_data"),
  certificateId: integer("certificate_id").references(() => certificatesTable.id),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInsuranceDocumentSchema = createInsertSchema(insuranceDocumentsTable).omit({
  id: true,
  uploadedAt: true,
  updatedAt: true,
});
export type InsertInsuranceDocument = z.infer<typeof insertInsuranceDocumentSchema>;
export type InsuranceDocument = typeof insuranceDocumentsTable.$inferSelect;
