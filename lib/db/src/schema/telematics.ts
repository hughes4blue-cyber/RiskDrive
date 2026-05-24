import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { vehiclesTable } from "./vehicles";
import { driversTable } from "./drivers";

export const telematicsEventsTable = pgTable("telematics_events", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehiclesTable.id),
  driverId: integer("driver_id").references(() => driversTable.id),
  eventType: text("event_type").notNull(),
  severity: text("severity").notNull().default("low"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  speed: real("speed").notNull().default(0),
  notes: text("notes"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertTelematicsEventSchema = createInsertSchema(telematicsEventsTable).omit({ id: true });
export type InsertTelematicsEvent = z.infer<typeof insertTelematicsEventSchema>;
export type TelematicsEvent = typeof telematicsEventsTable.$inferSelect;
