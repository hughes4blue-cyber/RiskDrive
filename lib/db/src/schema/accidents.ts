import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { vehiclesTable } from "./vehicles";
import { driversTable } from "./drivers";
import { facilitiesTable } from "./facilities";

export const accidentsTable = pgTable("accidents", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehiclesTable.id),
  driverId: integer("driver_id").notNull().references(() => driversTable.id),
  facilityId: integer("facility_id").notNull().references(() => facilitiesTable.id),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  severity: text("severity").notNull().default("minor"),
  status: text("status").notNull().default("alerted"),
  description: text("description"),
  claimNumber: text("claim_number"),
  alertedAt: timestamp("alerted_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertAccidentSchema = createInsertSchema(accidentsTable).omit({ id: true, alertedAt: true });
export type InsertAccident = z.infer<typeof insertAccidentSchema>;
export type Accident = typeof accidentsTable.$inferSelect;
