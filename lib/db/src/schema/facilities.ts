import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clubsTable } from "./clubs";

export const facilitiesTable = pgTable("facilities", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubsTable.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  ownerName: text("owner_name").notNull(),
  ownerEmail: text("owner_email"),
  ownerPhone: text("owner_phone"),
  riskScore: real("risk_score").notNull().default(50),
  riskTier: text("risk_tier").notNull().default("moderate"),
  status: text("status").notNull().default("active"),
  totalDrivers: integer("total_drivers").notNull().default(0),
  totalVehicles: integer("total_vehicles").notNull().default(0),
  certStatus: text("cert_status").notNull().default("current"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFacilitySchema = createInsertSchema(facilitiesTable).omit({ id: true, createdAt: true });
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type Facility = typeof facilitiesTable.$inferSelect;
