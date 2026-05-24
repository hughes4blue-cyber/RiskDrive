import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { facilitiesTable } from "./facilities";
import { driversTable } from "./drivers";

export const vehiclesTable = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id").notNull().references(() => facilitiesTable.id),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  licensePlate: text("license_plate").notNull(),
  vin: text("vin").notNull(),
  type: text("type").notNull().default("flatbed"),
  status: text("status").notNull().default("active"),
  riskScore: real("risk_score").notNull().default(50),
  riskTier: text("risk_tier").notNull().default("moderate"),
  totalMiles: real("total_miles").notNull().default(0),
  assignedDriverId: integer("assigned_driver_id").references(() => driversTable.id),
  telematicsDeviceId: text("telematics_device_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehiclesTable).omit({ id: true, createdAt: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehiclesTable.$inferSelect;
