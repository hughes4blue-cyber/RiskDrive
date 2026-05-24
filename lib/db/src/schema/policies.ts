import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { facilitiesTable } from "./facilities";

export const submissionsTable = pgTable("submissions", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id").notNull().references(() => facilitiesTable.id),
  status: text("status").notNull().default("draft"),
  carrierName: text("carrier_name"),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at"),
  prequalifiedAt: timestamp("prequalified_at"),
  quotedAt: timestamp("quoted_at"),
  boundAt: timestamp("bound_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const policiesTable = pgTable("policies", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id").notNull().references(() => facilitiesTable.id),
  submissionId: integer("submission_id").references(() => submissionsTable.id),
  policyNumber: text("policy_number").notNull(),
  carrier: text("carrier").notNull(),
  coverageType: text("coverage_type").notNull(),
  premiumAmount: real("premium_amount").notNull(),
  deductible: real("deductible").notNull().default(5000),
  coverageLimit: real("coverage_limit").notNull().default(1000000),
  effectiveDate: text("effective_date").notNull(),
  expiryDate: text("expiry_date").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPolicySchema = createInsertSchema(policiesTable).omit({ id: true, createdAt: true });
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type Submission = typeof submissionsTable.$inferSelect;
export type Policy = typeof policiesTable.$inferSelect;
