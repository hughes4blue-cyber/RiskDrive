import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { facilitiesTable } from "./facilities";

export const telematicsConnectionsTable = pgTable("telematics_connections", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id").notNull().references(() => facilitiesTable.id),
  provider: text("provider").notNull(),
  status: text("status").notNull().default("disconnected"),
  encryptedCredentials: text("encrypted_credentials"),
  accountLabel: text("account_label"),
  externalOrgName: text("external_org_name"),
  vehicleCount: integer("vehicle_count").notNull().default(0),
  driverCount: integer("driver_count").notNull().default(0),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTelematicsConnectionSchema = createInsertSchema(telematicsConnectionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTelematicsConnection = z.infer<typeof insertTelematicsConnectionSchema>;
export type TelematicsConnection = typeof telematicsConnectionsTable.$inferSelect;
