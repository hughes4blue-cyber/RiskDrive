import { pgTable, serial, text, integer, real, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { facilitiesTable } from "./facilities";
import { vehiclesTable } from "./vehicles";
import { driversTable } from "./drivers";

export const telematicsEventsTable = pgTable(
  "telematics_events",
  {
    id: serial("id").primaryKey(),
    facilityId: integer("facility_id").references(() => facilitiesTable.id),
    vehicleId: integer("vehicle_id").notNull().references(() => vehiclesTable.id),
    driverId: integer("driver_id").references(() => driversTable.id),
    eventType: text("event_type").notNull(),
    severity: text("severity").notNull().default("low"),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    speed: real("speed").notNull().default(0),
    notes: text("notes"),
    provider: text("provider"),
    externalId: text("external_id"),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("telematics_events_facility_provider_external_idx")
      .on(table.facilityId, table.provider, table.externalId)
      .where(sql`${table.externalId} is not null and ${table.facilityId} is not null`),
  ],
);

export const insertTelematicsEventSchema = createInsertSchema(telematicsEventsTable).omit({ id: true });
export type InsertTelematicsEvent = z.infer<typeof insertTelematicsEventSchema>;
export type TelematicsEvent = typeof telematicsEventsTable.$inferSelect;
