import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { facilitiesTable } from "./facilities";

export const onboardingChecklistsTable = pgTable("onboarding_checklists", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id").notNull().references(() => facilitiesTable.id).unique(),
  status: text("status").notNull().default("in_progress"),
  coiSubmitted: boolean("coi_submitted").notNull().default(false),
  coiVerified: boolean("coi_verified").notNull().default(false),
  contractSigned: boolean("contract_signed").notNull().default(false),
  taxStatusVerified: boolean("tax_status_verified").notNull().default(false),
  articlesOfIncorporationVerified: boolean("articles_of_incorporation_verified").notNull().default(false),
  driversLicenseRequirementsVerified: boolean("drivers_license_requirements_verified").notNull().default(false),
  vehicleInspectionComplete: boolean("vehicle_inspection_complete").notNull().default(false),
  telematicsAgreementSigned: boolean("telematics_agreement_signed").notNull().default(false),
  telematicsDeviceInstalled: boolean("telematics_device_installed").notNull().default(false),
  backgroundChecksPassed: boolean("background_checks_passed").notNull().default(false),
  notes: text("notes"),
  assignedRepName: text("assigned_rep_name"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const driverFeedbackTable = pgTable("driver_feedback", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  eventType: text("event_type").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("info"),
  acknowledged: boolean("acknowledged").notNull().default(false),
  triggeredAt: timestamp("triggered_at").notNull().defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at"),
});

export const insertOnboardingChecklistSchema = createInsertSchema(onboardingChecklistsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOnboardingChecklist = z.infer<typeof insertOnboardingChecklistSchema>;
export type OnboardingChecklist = typeof onboardingChecklistsTable.$inferSelect;
export type DriverFeedbackRecord = typeof driverFeedbackTable.$inferSelect;
