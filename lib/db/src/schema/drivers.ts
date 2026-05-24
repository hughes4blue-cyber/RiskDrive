import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { facilitiesTable } from "./facilities";

export const driversTable = pgTable("drivers", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id").notNull().references(() => facilitiesTable.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  licenseNumber: text("license_number").notNull(),
  phone: text("phone"),
  status: text("status").notNull().default("active"),
  riskScore: real("risk_score").notNull().default(50),
  riskTier: text("risk_tier").notNull().default("moderate"),
  totalMiles: real("total_miles").notNull().default(0),
  totalTrips: integer("total_trips").notNull().default(0),
  hireDate: text("hire_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDriverSchema = createInsertSchema(driversTable).omit({ id: true, createdAt: true });
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof driversTable.$inferSelect;
